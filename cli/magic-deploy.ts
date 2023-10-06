#!/usr/bin/env node

// Copyright 2021 Amazon.com.
// SPDX-License-Identifier: MIT

import { Command } from "commander";
import * as enquirer from "enquirer";
import * as fs from "fs";
import * as chalk from 'chalk';
import { exec } from "child_process";
import { CodeBuild } from "@aws-sdk/client-codebuild";
import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";
import { LIB_VERSION } from "./version";

/**
 * Main entry point
 */
const red = chalk.red;
const bold = chalk.bold;
const green = chalk.green;

(async () => {
  let program = new Command().description(
    "Builds and deploys the chatbot using CodeBuild"
  );
  program.version(LIB_VERSION);

  program.option("-p, --prefix <prefix>", "The prefix for the stack");

  program.action(async (options) => {
    console.log(bold(red("This command deploys the stack using CodeBuild.\nYou will incur additional cost for the time spent for the build.")))
    try {
      if (await processCodeBuildOptions(options)) {
        performCloudBuild();
      } else {
        console.log("\nRun\n\nnpx cdk deploy to deploy the stack\n");
      }
    } catch (err: any) {
      console.error("Could not complete the operation.");
      console.error(err.message);
      process.exit(1);
    }
  });

  program.parse(process.argv);
})();

function performCloudBuild() {
    let buildProjectName: string;
    let prefix = "";
    let config = ""
    try {
      config = fs.readFileSync("./bin/config.json").toString("utf8");
      prefix = JSON.parse(config).prefix;
    } catch {

    }
    console.log(green("Deploying CodeBuild stack"))
    const cp = exec(
        `npx cdk deploy GenAIChatBuildStack --require-approval never --ci --no-color`,
        (err, stdout) => {
            (async () => {
                if (err) {
                    console.log(stdout);
                    console.log(err);
                    return;
                }
                console.log(green("\nTriggering build for"), buildProjectName);
                const t = Date.now();
                const cbClient = new CodeBuild();
                try {
                    const build = await cbClient.startBuild({
                        projectName: buildProjectName,
                        environmentVariablesOverride: [{
                          name: "PREFIX",
                          value: prefix,
                        },
                        {
                          name: "GENAI_CONFIG",
                          value: config,
                        }
                        ]
                    });
                    function checkBuild() {
                        (async () => {
                            if ((
                                await cbClient.batchGetBuilds({
                                    ids: [build.build?.id ?? ""],
                                })
                            ).builds?.at(0)?.buildStatus == "IN_PROGRESS") {
                                process.stdout.write(".");
                                setTimeout(checkBuild, 1000);
                            } else {
                                const elapsed = (Date.now()-t)/1000;
                                console.log("\n");
                                const cwLogs = new CloudWatchLogs();
                                const logs = await cwLogs.filterLogEvents({
                                    logGroupName: `/aws/codebuild/${buildProjectName}`,
                                    startTime: Date.now() - 10 * 60 * 1000,
                                });
                                logs.events?.forEach((e: any) => process.stdout.write(e.message ?? ""))
                                
                                console.log(bold(`\nBuild process finished in ${elapsed} seconds.`)
                                );
                            }
                        })();
                    }
                    setTimeout(checkBuild, 1000);
                } catch (err) {
                    console.error(err);
                }
            })();
        }
    );
    cp.stdout?.on("data", (data: string) => {
        process.stdout.write(".");
        if (data.includes("GenAIChatBuildStack.BuildProjectName")) {
            buildProjectName = data.split(" = ")[1].split("\n")[0];
        }
    });
}

/**
 * Prompts the user for missing options
 *
 * @param options Options provided via the CLI
 * @returns The complete options
 */
async function processCodeBuildOptions(options: any): Promise<boolean> {
  return ((await enquirer.prompt([
      {
        type: "confirm",
        name: "deploy",
        message: "Do you want to deploy this project via a cloud build",
        initial: false,
      },
    ])) as any
  ).deploy;
}

