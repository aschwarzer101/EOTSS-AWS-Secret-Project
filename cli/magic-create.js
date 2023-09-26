#!/usr/bin/env node
"use strict";
// Copyright 2021 Amazon.com.
// SPDX-License-Identifier: MIT
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const enquirer = require("enquirer");
const types_1 = require("../lib/shared/types");
const fs = require("fs");
const child_process_1 = require("child_process");
const client_codebuild_1 = require("@aws-sdk/client-codebuild");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const versionRegExp = /\d+.\d+.\d+/;
const embeddingModels = [
    {
        provider: "sagemaker",
        name: "intfloat/multilingual-e5-large",
        dimensions: 1024,
    },
    {
        provider: "sagemaker",
        name: "sentence-transformers/all-MiniLM-L6-v2",
        dimensions: 384,
    },
    {
        provider: "bedrock",
        name: "amazon.titan-e1t-medium",
        dimensions: 4096,
    },
    {
        provider: "openai",
        name: "text-embedding-ada-002",
        dimensions: 1536,
    },
];
/**
 * Main entry point
 */
(async () => {
    let program = new commander_1.Command().description("Creates a new chatbot configuration");
    program.version("3.0.0");
    program.option("-p, --prefix <prefix>", "The prefix for the stack");
    program.action(async (options) => {
        if (fs.existsSync("./bin/config.json")) {
            const config = JSON.parse(fs.readFileSync("./bin/config.json").toString("utf8"));
            options.prefix = config.prefix;
            options.bedrockEnable = config.bedrock?.enabled;
            options.bedrockRegion = config.bedrock?.region;
            options.bedrockEndpoint = config.bedrock?.endpointUrl;
            options.bedrockRoleArn = config.bedrock?.roleArn;
            options.sagemakerLLMs = config.llms.sagemaker;
            options.ragsToEnable = Object.keys(config.rag.engines).filter((v) => config.rag.engines[v].enabled);
            options.embeddings = config.rag.embeddingsModels.map((m) => m.name);
            options.defaultEmbedding = config.rag.embeddingsModels.filter((m) => m.default)[0].name;
            options.kendraExternal = config.rag.engines.kendra.external;
        }
        try {
            if (await processCreateOptions(options)) {
                let buildProjectName;
                const cp = (0, child_process_1.exec)("npx cdk deploy GenAIChatBuildStack --require-approval never --ci --no-color", async (err, stdout) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log("Building ", buildProjectName);
                    const cbClient = new client_codebuild_1.CodeBuild();
                    try {
                        const build = await cbClient.startBuild({ projectName: buildProjectName });
                        async function checkBuild() {
                            if ((await cbClient.batchGetBuilds({ ids: [build.build?.id ?? ""] })).builds?.at(0)?.buildStatus == "IN_PROGRESS") {
                                process.stdout.write(".");
                                setTimeout(checkBuild, 1000);
                            }
                            else {
                                console.log("\n");
                                const cwLogs = new client_cloudwatch_logs_1.CloudWatchLogs();
                                const logs = await cwLogs.filterLogEvents({ logGroupName: `/aws/codebuild/${buildProjectName}`, startTime: Date.now() - 10 * 60 * 1000 });
                                logs.events?.forEach(e => process.stdout.write(e.message ?? ""));
                            }
                        }
                        setTimeout(checkBuild, 1000);
                    }
                    catch (err) {
                        console.error(err);
                    }
                });
                cp.stdout?.on("data", (data) => {
                    console.log(data);
                    if (data.includes("GenAIChatBuildStack.BuildProjectName")) {
                        buildProjectName = data.split(" = ")[1].split("\n")[0];
                    }
                });
            }
        }
        catch (err) {
            console.error("Could not complete the operation.");
            console.error(err.message);
            process.exit(1);
        }
    });
    program.parse(process.argv);
})();
function createConfig(config) {
    fs.writeFileSync("./bin/config.json", JSON.stringify(config, undefined, 2));
    console.log("New config written to ./bin/config.json");
}
/**
 * Prompts the user for missing options
 *
 * @param options Options provided via the CLI
 * @returns The complete options
 */
async function processCreateOptions(options) {
    let questions = [
        {
            type: "input",
            name: "prefix",
            message: "Prefix to differentiate this deployment",
            initial: options.prefix,
            askAnswered: false,
        },
        {
            type: "confirm",
            name: "bedrockEnable",
            message: "Do you have access to Bedrock and want to enable it",
            initial: true,
        },
        {
            type: "select",
            name: "bedrockRegion",
            message: "Region where Bedrock is available",
            choices: [
                types_1.SupportedRegion.US_EAST_1,
                types_1.SupportedRegion.US_WEST_2,
                types_1.SupportedRegion.EU_CENTRAL_1,
                types_1.SupportedRegion.AP_SOUTHEAST_1,
            ],
            initial: options.bedrockRegion ?? "us-east-1",
            skip() {
                return !this.state.answers.bedrockEnable;
            },
        },
        {
            type: "input",
            name: "bedrockEndpoint",
            message: "Bedrock endpoint - leave as is for standard endpoint",
            initial() {
                return `https://bedrock.${this.state.answers.bedrockRegion}.amazonaws.com`;
            },
        },
        {
            type: "input",
            name: "bedrockRoleArn",
            message: "Cross account role arn to invoke Bedrock - leave empty if Bedrock is in same account",
            validate: (v) => {
                const valid = RegExp(/arn:aws:iam::\d+:role\/[\w-_]+/).test(v);
                return v.length === 0 || valid;
            },
            initial: options.bedrockRoleArn || "",
        },
        {
            type: "multiselect",
            name: "sagemakerLLMs",
            message: "Which Sagemaker LLMs do you want to enable",
            choices: Object.values(types_1.SupportedSageMakerLLM),
            initial: options.sagemakerLLMs || [],
        },
        {
            type: "confirm",
            name: "enableRag",
            message: "Do you want to enable RAG",
            initial: options.enableRag || true,
        },
        {
            type: "multiselect",
            name: "ragsToEnable",
            message: "Which datastores do you want to enable for RAG",
            choices: [
                { message: "Aurora", name: "aurora" },
                // Not yet supported
                // {message:'OpenSearch', name:'opensearch'},
                // {message:'Kendra (managed)', name:'kendra'},
            ],
            skip: function () {
                // workaround for https://github.com/enquirer/enquirer/issues/298
                this.state._choices = this.state.choices;
                return !this.state.answers.enableRag;
            },
            initial: options.ragsToEnable || [],
        },
        {
            type: "confirm",
            name: "kendra",
            message: "Do you want to add existing Kendra indexes",
            initial: !!options.kendraExternal || false,
            skip: function () {
                // workaround for https://github.com/enquirer/enquirer/issues/298
                this.state._choices = this.state.choices;
                return !this.state.answers.enableRag;
            },
        },
    ];
    const answers = await enquirer.prompt(questions);
    const kendraExternal = [];
    let newKendra = answers.enableRag && answers.kendra;
    // if (options.kendraExternal) {
    //     options.kendraExternal.forEach((v: any) => console.log(v))
    // }
    while (newKendra === true) {
        const kendraQ = [
            {
                type: "input",
                name: "name",
                message: "Kendra source name",
            },
            {
                type: "autocomplete",
                limit: 8,
                name: "region",
                choices: Object.values(types_1.SupportedRegion),
                message: "Region of the Kendra index",
            },
            {
                type: "input",
                name: "roleArn",
                message: "Cross account role Arn to assume to call Kendra, leave empty if not needed",
                validate: (v) => {
                    const valid = RegExp(/arn:aws:iam::\d+:role\/[\w-_]+/).test(v);
                    return v.length === 0 || valid;
                },
                initial: "",
            },
            {
                type: "input",
                name: "kendraId",
                message: "Kendra ID",
                validate(v) {
                    return RegExp(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/).test(v);
                },
            },
            {
                type: "confirm",
                name: "newKendra",
                message: "Do you want to add another Kendra source",
                default: false,
            },
        ];
        const kendraInstance = await enquirer.prompt(kendraQ);
        const ext = (({ name, roleArn, kendraId, region }) => ({
            name,
            roleArn,
            kendraId,
            region,
        }))(kendraInstance);
        if (ext.roleArn === "")
            ext.roleArn = undefined;
        kendraExternal.push({
            enabled: true,
            external: ext,
        });
        newKendra = kendraInstance.newKendra;
    }
    const modelsPrompts = [
        {
            type: "select",
            name: "defaultEmbedding",
            message: "Which is the default embedding model",
            choices: embeddingModels.map((m) => ({ name: m.name, value: m })),
            initial: options.defaultEmbedding || undefined,
        },
    ];
    const models = await enquirer.prompt(modelsPrompts);
    // Create the config object
    const config = {
        prefix: answers.prefix,
        bedrock: answers.bedrockEnable
            ? {
                enabled: answers.bedrockEnable,
                region: answers.bedrockRegion,
                roleArn: answers.bedrockRoleArn === "" ? undefined : answers.bedrockRoleArn,
                endpointUrl: answers.bedrockEndpoint,
            }
            : undefined,
        llms: {
            sagemaker: answers.sagemakerLLMs,
        },
        rag: {
            enabled: answers.enableRag,
            engines: {
                aurora: {
                    enabled: answers.ragsToEnable.includes("aurora"),
                },
                opensearch: {
                    enabled: answers.ragsToEnable.includes("opensearch"),
                },
                kendra: { enabled: false, external: [{}] },
            },
            embeddingsModels: [{}],
            crossEncoderModels: [
                {
                    provider: "sagemaker",
                    name: "cross-encoder/ms-marco-MiniLM-L-12-v2",
                    default: true,
                },
            ],
        },
    };
    config.rag.engines.kendra.enabled = answers.ragsToEnable.includes("kendra");
    config.rag.engines.kendra.external = [...kendraExternal];
    config.rag.embeddingsModels = embeddingModels;
    config.rag.embeddingsModels.forEach((m) => {
        if (m.name === models.defaultEmbedding) {
            m.default = true;
        }
    });
    console.log("\n✨ This is the chosen configuration:\n");
    console.log(JSON.stringify(config, undefined, 2));
    (await enquirer.prompt([
        {
            type: "confirm",
            name: "create",
            message: "Do you want to create a new config based on the above",
            initial: false,
        },
    ])).create
        ? createConfig(config)
        : console.log("Skipping");
    return (await enquirer.prompt([
        {
            type: "confirm",
            name: "deploy",
            message: "Do you want to deploy this project via a cloud build",
            initial: false,
        },
    ])).deploy;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFnaWMtY3JlYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFnaWMtY3JlYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsNkJBQTZCO0FBQzdCLCtCQUErQjs7QUFFL0IseUNBQW9DO0FBQ3BDLHFDQUFxQztBQUNyQywrQ0FJNkI7QUFDN0IseUJBQXlCO0FBQ3pCLGlEQUFxQztBQUNyQyxnRUFBb0Q7QUFDcEQsNEVBQWdFO0FBR2hFLE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQztBQUVwQyxNQUFNLGVBQWUsR0FBRztJQUN0QjtRQUNFLFFBQVEsRUFBRSxXQUFXO1FBQ3JCLElBQUksRUFBRSxnQ0FBZ0M7UUFDdEMsVUFBVSxFQUFFLElBQUk7S0FDakI7SUFDRDtRQUNFLFFBQVEsRUFBRSxXQUFXO1FBQ3JCLElBQUksRUFBRSx3Q0FBd0M7UUFDOUMsVUFBVSxFQUFFLEdBQUc7S0FDaEI7SUFDRDtRQUNFLFFBQVEsRUFBRSxTQUFTO1FBQ25CLElBQUksRUFBRSx5QkFBeUI7UUFDL0IsVUFBVSxFQUFFLElBQUk7S0FDakI7SUFDRDtRQUNFLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLElBQUksRUFBRSx3QkFBd0I7UUFDOUIsVUFBVSxFQUFFLElBQUk7S0FDakI7Q0FDRixDQUFDO0FBRUY7O0dBRUc7QUFFSCxDQUFDLEtBQUssSUFBSSxFQUFFO0lBQ1YsSUFBSSxPQUFPLEdBQUcsSUFBSSxtQkFBTyxFQUFFLENBQUMsV0FBVyxDQUNyQyxxQ0FBcUMsQ0FDdEMsQ0FBQztJQUNGLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFekIsT0FBTyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO0lBRXBFLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1FBQy9CLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFO1lBQ3RDLE1BQU0s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Q0FBQztJQUVoRCxDQUFDLE1BQU0sUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUNyQjtZQUNFLElBQUksRUFBRSxTQUFTO1lBQ2YsSUFBSSxFQUFFLFFBQVE7WUFDZCxPQUFPLEVBQUUsdURBQXVEO1lBQ2hFLE9BQU8sRUFBRSxLQUFLO1NBQ2Y7S0FDRixDQUFDLENBQ0gsQ0FBQyxNQUFNO1FBQ04sQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7UUFDdEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFNUIsT0FDRSxDQUFDLE1BQU0sUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUNyQjtZQUNFLElBQUksRUFBRSxTQUFTO1lBQ2YsSUFBSSxFQUFFLFFBQVE7WUFDZCxPQUFPLEVBQUUsc0RBQXNEO1lBQy9ELE9BQU8sRUFBRSxLQUFLO1NBQ2Y7S0FDRixDQUFDLENBQ0gsQ0FBQyxNQUFNLENBQUM7QUFDWCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG4vLyBDb3B5cmlnaHQgMjAyMSBBbWF6b24uY29tLlxuLy8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IE1JVFxuXG5pbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcImNvbW1hbmRlclwiO1xuaW1wb3J0ICogYXMgZW5xdWlyZXIgZnJvbSBcImVucXVpcmVyXCI7XG5pbXBvcnQge1xuICBTdXBwb3J0ZWRSZWdpb24sXG4gIFN1cHBvcnRlZFNhZ2VNYWtlckxMTSxcbiAgU3lzdGVtQ29uZmlnLFxufSBmcm9tIFwiLi4vbGliL3NoYXJlZC90eXBlc1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IENvZGVCdWlsZH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWNvZGVidWlsZCdcbmltcG9ydCB7IENsb3VkV2F0Y2hMb2dzIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWNsb3Vkd2F0Y2gtbG9ncydcblxuXG5jb25zdCB2ZXJzaW9uUmVnRXhwID0gL1xcZCsuXFxkKy5cXGQrLztcblxuY29uc3QgZW1iZWRkaW5nTW9kZWxzID0gW1xuICB7XG4gICAgcHJvdmlkZXI6IFwic2FnZW1ha2VyXCIsXG4gICAgbmFtZTogXCJpbnRmbG9hdC9tdWx0aWxpbmd1YWwtZTUtbGFyZ2VcIixcbiAgICBkaW1lbnNpb25zOiAxMDI0LFxuICB9LFxuICB7XG4gICAgcHJvdmlkZXI6IFwic2FnZW1ha2VyXCIsXG4gICAgbmFtZTogXCJzZW50ZW5jZS10cmFuc2Zvcm1lcnMvYWxsLU1pbmlMTS1MNi12MlwiLFxuICAgIGRpbWVuc2lvbnM6IDM4NCxcbiAgfSxcbiAge1xuICAgIHByb3ZpZGVyOiBcImJlZHJvY2tcIixcbiAgICBuYW1lOiBcImFtYXpvbi50aXRhbi1lMXQtbWVkaXVtXCIsXG4gICAgZGltZW5zaW9uczogNDA5NixcbiAgfSxcbiAge1xuICAgIHByb3ZpZGVyOiBcIm9wZW5haVwiLFxuICAgIG5hbWU6IFwidGV4dC1lbWJlZGRpbmctYWRhLTAwMlwiLFxuICAgIGRpbWVuc2lvbnM6IDE1MzYsXG4gIH0sXG5dO1xuXG4vKipcbiAqIE1haW4gZW50cnkgcG9pbnRcbiAqL1xuXG4oYXN5bmMgKCkgPT4ge1xuICBsZXQgcHJvZ3JhbSA9IG5ldyBDb21tYW5kKCkuZGVzY3JpcHRpb24oXG4gICAgXCJDcmVhdGVzIGEgbmV3IGNoYXRib3QgY29uZmlndXJhdGlvblwiXG4gICk7XG4gIHByb2dyYW0udmVyc2lvbihcIjMuMC4wXCIpO1xuXG4gIHByb2dyYW0ub3B0aW9uKFwiLXAsIC0tcHJlZml4IDxwcmVmaXg+XCIsIFwiVGhlIHByZWZpeCBmb3IgdGhlIHN0YWNrXCIpO1xuXG4gIHByb2dyYW0uYWN0aW9uKGFzeW5jIChvcHRpb25zKSA9PiB7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoXCIuL2Jpbi9jb25maWcuanNvblwiKSkge1xuICAgICAgY29uc3QgY29uZmlnOiBTeXN0ZW1Db25maWcgPSBKU09OLnBhcnNlKFxuICAgICAgICBmcy5yZWFkRmlsZVN5bmMoXCIuL2Jpbi9jb25maWcuanNvblwiKS50b1N0cmluZyhcInV0ZjhcIilcbiAgICAgICk7XG4gICAgICBvcHRpb25zLnByZWZpeCA9IGNvbmZpZy5wcmVmaXg7XG4gICAgICBvcHRpb25zLmJlZHJvY2tFbmFibGUgPSBjb25maWcuYmVkcm9jaz8uZW5hYmxlZDtcbiAgICAgIG9wdGlvbnMuYmVkcm9ja1JlZ2lvbiA9IGNvbmZpZy5iZWRyb2NrPy5yZWdpb247XG4gICAgICBvcHRpb25zLmJlZHJvY2tFbmRwb2ludCA9IGNvbmZpZy5iZWRyb2NrPy5lbmRwb2ludFVybDtcbiAgICAgIG9wdGlvbnMuYmVkcm9ja1JvbGVBcm4gPSBjb25maWcuYmVkcm9jaz8ucm9sZUFybjtcbiAgICAgIG9wdGlvbnMuc2FnZW1ha2VyTExNcyA9IGNvbmZpZy5sbG1zLnNhZ2VtYWtlcjtcbiAgICAgIG9wdGlvbnMucmFnc1RvRW5hYmxlID0gT2JqZWN0LmtleXMoY29uZmlnLnJhZy5lbmdpbmVzKS5maWx0ZXIoXG4gICAgICAgICh2OiBzdHJpbmcpID0+IChjb25maWcucmFnLmVuZ2luZXMgYXMgYW55KVt2XS5lbmFibGVkXG4gICAgICApO1xuICAgICAgb3B0aW9ucy5lbWJlZGRpbmdzID0gY29uZmlnLnJhZy5lbWJlZGRpbmdzTW9kZWxzLm1hcCgobTogYW55KSA9PiBtLm5hbWUpO1xuICAgICAgb3B0aW9ucy5kZWZhdWx0RW1iZWRkaW5nID0gY29uZmlnLnJhZy5lbWJlZGRpbmdzTW9kZWxzLmZpbHRlcihcbiAgICAgICAgKG06IGFueSkgPT4gbS5kZWZhdWx0XG4gICAgICApWzBdLm5hbWU7XG4gICAgICBvcHRpb25zLmtlbmRyYUV4dGVybmFsID0gY29uZmlnLnJhZy5lbmdpbmVzLmtlbmRyYS5leHRlcm5hbDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGlmIChhd2FpdCBwcm9jZXNzQ3JlYXRlT3B0aW9ucyhvcHRpb25zKSkge1xuICAgICAgICBsZXQgYnVpbGRQcm9qZWN0TmFtZTogc3RyaW5nO1xuICAgICAgICBjb25zdCBjcCA9IGV4ZWMoXG4gICAgICAgICAgXCJucHggY2RrIGRlcGxveSBHZW5BSUNoYXRCdWlsZFN0YWNrIC0tcmVxdWlyZS1hcHByb3ZhbCBuZXZlciAtLWNpIC0tbm8tY29sb3JcIixcbiAgICAgICAgICBhc3luYyAoZXJyLCBzdGRvdXQpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJCdWlsZGluZyBcIiwgYnVpbGRQcm9qZWN0TmFtZSk7XG4gICAgICAgICAgICBjb25zdCBjYkNsaWVudCA9IG5ldyBDb2RlQnVpbGQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYnVpbGQgPSBhd2FpdCBjYkNsaWVudC5zdGFydEJ1aWxkKHtwcm9qZWN0TmFtZTpidWlsZFByb2plY3ROYW1lfSk7XG4gICAgICAgICAgICAgICAgYXN5bmMgZnVuY3Rpb24gY2hlY2tCdWlsZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChhd2FpdCBjYkNsaWVudC5iYXRjaEdldEJ1aWxkcyh7aWRzOltidWlsZC5idWlsZD8uaWQgPz8gXCJcIl19KSkuYnVpbGRzPy5hdCgwKT8uYnVpbGRTdGF0dXMgPT0gXCJJTl9QUk9HUkVTU1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShcIi5cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2tCdWlsZCwgMTAwMCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlxcblwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGN3TG9ncyA9IG5ldyBDbG91ZFdhdGNoTG9ncygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9ncyA9IGF3YWl0IGN3TG9ncy5maWx0ZXJMb2dFdmVudHMoe2xvZ0dyb3VwTmFtZTogYC9hd3MvY29kZWJ1aWxkLyR7YnVpbGRQcm9qZWN0TmFtZX1gLCBzdGFydFRpbWU6IERhdGUubm93KCktMTAqNjAqMTAwMH0pXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dzLmV2ZW50cz8uZm9yRWFjaChlID0+IHByb2Nlc3Muc3Rkb3V0LndyaXRlKGUubWVzc2FnZSA/PyBcIlwiKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVja0J1aWxkLCAxMDAwKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgY3Auc3Rkb3V0Py5vbihcImRhdGFcIiwgKGRhdGE6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgIGlmIChkYXRhLmluY2x1ZGVzKFwiR2VuQUlDaGF0QnVpbGRTdGFjay5CdWlsZFByb2plY3ROYW1lXCIpKSB7XG4gICAgICAgICAgICBidWlsZFByb2plY3ROYW1lID0gZGF0YS5zcGxpdChcIiA9IFwiKVsxXS5zcGxpdChcIlxcblwiKVswXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IGNvbXBsZXRlIHRoZSBvcGVyYXRpb24uXCIpO1xuICAgICAgY29uc29sZS5lcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxuICB9KTtcblxuICBwcm9ncmFtLnBhcnNlKHByb2Nlc3MuYXJndik7XG59KSgpO1xuXG5mdW5jdGlvbiBjcmVhdGVDb25maWcoY29uZmlnOiBhbnkpOiB2b2lkIHtcbiAgZnMud3JpdGVGaWxlU3luYyhcIi4vYmluL2NvbmZpZy5qc29uXCIsIEpTT04uc3RyaW5naWZ5KGNvbmZpZywgdW5kZWZpbmVkLCAyKSk7XG4gIGNvbnNvbGUubG9nKFwiTmV3IGNvbmZpZyB3cml0dGVuIHRvIC4vYmluL2NvbmZpZy5qc29uXCIpO1xufVxuXG4vKipcbiAqIFByb21wdHMgdGhlIHVzZXIgZm9yIG1pc3Npbmcgb3B0aW9uc1xuICpcbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgcHJvdmlkZWQgdmlhIHRoZSBDTElcbiAqIEByZXR1cm5zIFRoZSBjb21wbGV0ZSBvcHRpb25zXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NDcmVhdGVPcHRpb25zKG9wdGlvbnM6IGFueSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBsZXQgcXVlc3Rpb25zID0gW1xuICAgIHtcbiAgICAgIHR5cGU6IFwiaW5wdXRcIixcbiAgICAgIG5hbWU6IFwicHJlZml4XCIsXG4gICAgICBtZXNzYWdlOiBcIlByZWZpeCB0byBkaWZmZXJlbnRpYXRlIHRoaXMgZGVwbG95bWVudFwiLFxuICAgICAgaW5pdGlhbDogb3B0aW9ucy5wcmVmaXgsXG4gICAgICBhc2tBbnN3ZXJlZDogZmFsc2UsXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBcImNvbmZpcm1cIixcbiAgICAgIG5hbWU6IFwiYmVkcm9ja0VuYWJsZVwiLFxuICAgICAgbWVzc2FnZTogXCJEbyB5b3UgaGF2ZSBhY2Nlc3MgdG8gQmVkcm9jayBhbmQgd2FudCB0byBlbmFibGUgaXRcIixcbiAgICAgIGluaXRpYWw6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBcInNlbGVjdFwiLFxuICAgICAgbmFtZTogXCJiZWRyb2NrUmVnaW9uXCIsXG4gICAgICBtZXNzYWdlOiBcIlJlZ2lvbiB3aGVyZSBCZWRyb2NrIGlzIGF2YWlsYWJsZVwiLFxuICAgICAgY2hvaWNlczogW1xuICAgICAgICBTdXBwb3J0ZWRSZWdpb24uVVNfRUFTVF8xLFxuICAgICAgICBTdXBwb3J0ZWRSZWdpb24uVVNfV0VTVF8yLFxuICAgICAgICBTdXBwb3J0ZWRSZWdpb24uRVVfQ0VOVFJBTF8xLFxuICAgICAgICBTdXBwb3J0ZWRSZWdpb24uQVBfU09VVEhFQVNUXzEsXG4gICAgICBdLFxuICAgICAgaW5pdGlhbDogb3B0aW9ucy5iZWRyb2NrUmVnaW9uID8/IFwidXMtZWFzdC0xXCIsXG4gICAgICBza2lwKCkge1xuICAgICAgICByZXR1cm4gISh0aGlzIGFzIGFueSkuc3RhdGUuYW5zd2Vycy5iZWRyb2NrRW5hYmxlO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFwiaW5wdXRcIixcbiAgICAgIG5hbWU6IFwiYmVkcm9ja0VuZHBvaW50XCIsXG4gICAgICBtZXNzYWdlOiBcIkJlZHJvY2sgZW5kcG9pbnQgLSBsZWF2ZSBhcyBpcyBmb3Igc3RhbmRhcmQgZW5kcG9pbnRcIixcbiAgICAgIGluaXRpYWwoKSB7XG4gICAgICAgIHJldHVybiBgaHR0cHM6Ly9iZWRyb2NrLiR7XG4gICAgICAgICAgKHRoaXMgYXMgYW55KS5zdGF0ZS5hbnN3ZXJzLmJlZHJvY2tSZWdpb25cbiAgICAgICAgfS5hbWF6b25hd3MuY29tYDtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBcImlucHV0XCIsXG4gICAgICBuYW1lOiBcImJlZHJvY2tSb2xlQXJuXCIsXG4gICAgICBtZXNzYWdlOlxuICAgICAgICBcIkNyb3NzIGFjY291bnQgcm9sZSBhcm4gdG8gaW52b2tlIEJlZHJvY2sgLSBsZWF2ZSBlbXB0eSBpZiBCZWRyb2NrIGlzIGluIHNhbWUgYWNjb3VudFwiLFxuICAgICAgdmFsaWRhdGU6ICh2OiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgdmFsaWQgPSBSZWdFeHAoL2Fybjphd3M6aWFtOjpcXGQrOnJvbGVcXC9bXFx3LV9dKy8pLnRlc3Qodik7XG4gICAgICAgIHJldHVybiB2Lmxlbmd0aCA9PT0gMCB8fCB2YWxpZDtcbiAgICAgIH0sXG4gICAgICBpbml0aWFsOiBvcHRpb25zLmJlZHJvY2tSb2xlQXJuIHx8IFwiXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBcIm11bHRpc2VsZWN0XCIsXG4gICAgICBuYW1lOiBcInNhZ2VtYWtlckxMTXNcIixcbiAgICAgIG1lc3NhZ2U6IFwiV2hpY2ggU2FnZW1ha2VyIExMTXMgZG8geW91IHdhbnQgdG8gZW5hYmxlXCIsXG4gICAgICBjaG9pY2VzOiBPYmplY3QudmFsdWVzKFN1cHBvcnRlZFNhZ2VNYWtlckxMTSksXG4gICAgICBpbml0aWFsOiBvcHRpb25zLnNhZ2VtYWtlckxMTXMgfHwgW10sXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBcImNvbmZpcm1cIixcbiAgICAgIG5hbWU6IFwiZW5hYmxlUmFnXCIsXG4gICAgICBtZXNzYWdlOiBcIkRvIHlvdSB3YW50IHRvIGVuYWJsZSBSQUdcIixcbiAgICAgIGluaXRpYWw6IG9wdGlvbnMuZW5hYmxlUmFnIHx8IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICB0eXBlOiBcIm11bHRpc2VsZWN0XCIsXG4gICAgICBuYW1lOiBcInJhZ3NUb0VuYWJsZVwiLFxuICAgICAgbWVzc2FnZTogXCJXaGljaCBkYXRhc3RvcmVzIGRvIHlvdSB3YW50IHRvIGVuYWJsZSBmb3IgUkFHXCIsXG4gICAgICBjaG9pY2VzOiBbXG4gICAgICAgIHsgbWVzc2FnZTogXCJBdXJvcmFcIiwgbmFtZTogXCJhdXJvcmFcIiB9LFxuICAgICAgICAvLyBOb3QgeWV0IHN1cHBvcnRlZFxuICAgICAgICAvLyB7bWVzc2FnZTonT3BlblNlYXJjaCcsIG5hbWU6J29wZW5zZWFyY2gnfSxcbiAgICAgICAgLy8ge21lc3NhZ2U6J0tlbmRyYSAobWFuYWdlZCknLCBuYW1lOidrZW5kcmEnfSxcbiAgICAgIF0sXG4gICAgICBza2lwOiBmdW5jdGlvbiAoKTogYm9vbGVhbiB7XG4gICAgICAgIC8vIHdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9lbnF1aXJlci9lbnF1aXJlci9pc3N1ZXMvMjk4XG4gICAgICAgICh0aGlzIGFzIGFueSkuc3RhdGUuX2Nob2ljZXMgPSAodGhpcyBhcyBhbnkpLnN0YXRlLmNob2ljZXM7XG4gICAgICAgIHJldHVybiAhKHRoaXMgYXMgYW55KS5zdGF0ZS5hbnN3ZXJzLmVuYWJsZVJhZztcbiAgICAgIH0sXG4gICAgICBpbml0aWFsOiBvcHRpb25zLnJhZ3NUb0VuYWJsZSB8fCBbXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6IFwiY29uZmlybVwiLFxuICAgICAgbmFtZTogXCJrZW5kcmFcIixcbiAgICAgIG1lc3NhZ2U6IFwiRG8geW91IHdhbnQgdG8gYWRkIGV4aXN0aW5nIEtlbmRyYSBpbmRleGVzXCIsXG4gICAgICBpbml0aWFsOiAhIW9wdGlvbnMua2VuZHJhRXh0ZXJuYWwgfHwgZmFsc2UsXG4gICAgICBza2lwOiBmdW5jdGlvbiAoKTogYm9vbGVhbiB7XG4gICAgICAgIC8vIHdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9lbnF1aXJlci9lbnF1aXJlci9pc3N1ZXMvMjk4XG4gICAgICAgICh0aGlzIGFzIGFueSkuc3RhdGUuX2Nob2ljZXMgPSAodGhpcyBhcyBhbnkpLnN0YXRlLmNob2ljZXM7XG4gICAgICAgIHJldHVybiAhKHRoaXMgYXMgYW55KS5zdGF0ZS5hbnN3ZXJzLmVuYWJsZVJhZztcbiAgICAgIH0sXG4gICAgfSxcbiAgXTtcbiAgY29uc3QgYW5zd2VyczogYW55ID0gYXdhaXQgZW5xdWlyZXIucHJvbXB0KHF1ZXN0aW9ucyk7XG4gIGNvbnN0IGtlbmRyYUV4dGVybmFsID0gW107XG4gIGxldCBuZXdLZW5kcmEgPSBhbnN3ZXJzLmVuYWJsZVJhZyAmJiBhbnN3ZXJzLmtlbmRyYTtcblxuICAvLyBpZiAob3B0aW9ucy5rZW5kcmFFeHRlcm5hbCkge1xuICAvLyAgICAgb3B0aW9ucy5rZW5kcmFFeHRlcm5hbC5mb3JFYWNoKCh2OiBhbnkpID0+IGNvbnNvbGUubG9nKHYpKVxuICAvLyB9XG4gIHdoaWxlIChuZXdLZW5kcmEgPT09IHRydWUpIHtcbiAgICBjb25zdCBrZW5kcmFRID0gW1xuICAgICAge1xuICAgICAgICB0eXBlOiBcImlucHV0XCIsXG4gICAgICAgIG5hbWU6IFwibmFtZVwiLFxuICAgICAgICBtZXNzYWdlOiBcIktlbmRyYSBzb3VyY2UgbmFtZVwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogXCJhdXRvY29tcGxldGVcIixcbiAgICAgICAgbGltaXQ6IDgsXG4gICAgICAgIG5hbWU6IFwicmVnaW9uXCIsXG4gICAgICAgIGNob2ljZXM6IE9iamVjdC52YWx1ZXMoU3VwcG9ydGVkUmVnaW9uKSxcbiAgICAgICAgbWVzc2FnZTogXCJSZWdpb24gb2YgdGhlIEtlbmRyYSBpbmRleFwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogXCJpbnB1dFwiLFxuICAgICAgICBuYW1lOiBcInJvbGVBcm5cIixcbiAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICBcIkNyb3NzIGFjY291bnQgcm9sZSBBcm4gdG8gYXNzdW1lIHRvIGNhbGwgS2VuZHJhLCBsZWF2ZSBlbXB0eSBpZiBub3QgbmVlZGVkXCIsXG4gICAgICAgIHZhbGlkYXRlOiAodjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgY29uc3QgdmFsaWQgPSBSZWdFeHAoL2Fybjphd3M6aWFtOjpcXGQrOnJvbGVcXC9bXFx3LV9dKy8pLnRlc3Qodik7XG4gICAgICAgICAgcmV0dXJuIHYubGVuZ3RoID09PSAwIHx8IHZhbGlkO1xuICAgICAgICB9LFxuICAgICAgICBpbml0aWFsOiBcIlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogXCJpbnB1dFwiLFxuICAgICAgICBuYW1lOiBcImtlbmRyYUlkXCIsXG4gICAgICAgIG1lc3NhZ2U6IFwiS2VuZHJhIElEXCIsXG4gICAgICAgIHZhbGlkYXRlKHY6IHN0cmluZykge1xuICAgICAgICAgIHJldHVybiBSZWdFeHAoL1xcd3s4fS1cXHd7NH0tXFx3ezR9LVxcd3s0fS1cXHd7MTJ9LykudGVzdCh2KTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IFwiY29uZmlybVwiLFxuICAgICAgICBuYW1lOiBcIm5ld0tlbmRyYVwiLFxuICAgICAgICBtZXNzYWdlOiBcIkRvIHlvdSB3YW50IHRvIGFkZCBhbm90aGVyIEtlbmRyYSBzb3VyY2VcIixcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICB9LFxuICAgIF07XG4gICAgY29uc3Qga2VuZHJhSW5zdGFuY2U6IGFueSA9IGF3YWl0IGVucXVpcmVyLnByb21wdChrZW5kcmFRKTtcbiAgICBjb25zdCBleHQgPSAoKHsgbmFtZSwgcm9sZUFybiwga2VuZHJhSWQsIHJlZ2lvbiB9KSA9PiAoe1xuICAgICAgbmFtZSxcbiAgICAgIHJvbGVBcm4sXG4gICAgICBrZW5kcmFJZCxcbiAgICAgIHJlZ2lvbixcbiAgICB9KSkoa2VuZHJhSW5zdGFuY2UpO1xuICAgIGlmIChleHQucm9sZUFybiA9PT0gXCJcIikgZXh0LnJvbGVBcm4gPSB1bmRlZmluZWQ7XG4gICAga2VuZHJhRXh0ZXJuYWwucHVzaCh7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgZXh0ZXJuYWw6IGV4dCxcbiAgICB9KTtcbiAgICBuZXdLZW5kcmEgPSBrZW5kcmFJbnN0YW5jZS5uZXdLZW5kcmE7XG4gIH1cbiAgY29uc3QgbW9kZWxzUHJvbXB0cyA9IFtcbiAgICB7XG4gICAgICB0eXBlOiBcInNlbGVjdFwiLFxuICAgICAgbmFtZTogXCJkZWZhdWx0RW1iZWRkaW5nXCIsXG4gICAgICBtZXNzYWdlOiBcIldoaWNoIGlzIHRoZSBkZWZhdWx0IGVtYmVkZGluZyBtb2RlbFwiLFxuICAgICAgY2hvaWNlczogZW1iZWRkaW5nTW9kZWxzLm1hcCgobSkgPT4gKHsgbmFtZTogbS5uYW1lLCB2YWx1ZTogbSB9KSksXG4gICAgICBpbml0aWFsOiBvcHRpb25zLmRlZmF1bHRFbWJlZGRpbmcgfHwgdW5kZWZpbmVkLFxuICAgIH0sXG4gIF07XG4gIGNvbnN0IG1vZGVsczogYW55ID0gYXdhaXQgZW5xdWlyZXIucHJvbXB0KG1vZGVsc1Byb21wdHMpO1xuXG4gIC8vIENyZWF0ZSB0aGUgY29uZmlnIG9iamVjdFxuICBjb25zdCBjb25maWcgPSB7XG4gICAgcHJlZml4OiBhbnN3ZXJzLnByZWZpeCxcbiAgICBiZWRyb2NrOiBhbnN3ZXJzLmJlZHJvY2tFbmFibGVcbiAgICAgID8ge1xuICAgICAgICAgIGVuYWJsZWQ6IGFuc3dlcnMuYmVkcm9ja0VuYWJsZSxcbiAgICAgICAgICByZWdpb246IGFuc3dlcnMuYmVkcm9ja1JlZ2lvbixcbiAgICAgICAgICByb2xlQXJuOlxuICAgICAgICAgICAgYW5zd2Vycy5iZWRyb2NrUm9sZUFybiA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IGFuc3dlcnMuYmVkcm9ja1JvbGVBcm4sXG4gICAgICAgICAgZW5kcG9pbnRVcmw6IGFuc3dlcnMuYmVkcm9ja0VuZHBvaW50LFxuICAgICAgICB9XG4gICAgICA6IHVuZGVmaW5lZCxcbiAgICBsbG1zOiB7XG4gICAgICBzYWdlbWFrZXI6IGFuc3dlcnMuc2FnZW1ha2VyTExNcyxcbiAgICB9LFxuICAgIHJhZzoge1xuICAgICAgZW5hYmxlZDogYW5zd2Vycy5lbmFibGVSYWcsXG4gICAgICBlbmdpbmVzOiB7XG4gICAgICAgIGF1cm9yYToge1xuICAgICAgICAgIGVuYWJsZWQ6IGFuc3dlcnMucmFnc1RvRW5hYmxlLmluY2x1ZGVzKFwiYXVyb3JhXCIpLFxuICAgICAgICB9LFxuICAgICAgICBvcGVuc2VhcmNoOiB7XG4gICAgICAgICAgZW5hYmxlZDogYW5zd2Vycy5yYWdzVG9FbmFibGUuaW5jbHVkZXMoXCJvcGVuc2VhcmNoXCIpLFxuICAgICAgICB9LFxuICAgICAgICBrZW5kcmE6IHsgZW5hYmxlZDogZmFsc2UsIGV4dGVybmFsOiBbe31dIH0sXG4gICAgICB9LFxuICAgICAgZW1iZWRkaW5nc01vZGVsczogW3t9XSxcbiAgICAgIGNyb3NzRW5jb2Rlck1vZGVsczogW1xuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZXI6IFwic2FnZW1ha2VyXCIsXG4gICAgICAgICAgbmFtZTogXCJjcm9zcy1lbmNvZGVyL21zLW1hcmNvLU1pbmlMTS1MLTEyLXYyXCIsXG4gICAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgfTtcbiAgY29uZmlnLnJhZy5lbmdpbmVzLmtlbmRyYS5lbmFibGVkID0gYW5zd2Vycy5yYWdzVG9FbmFibGUuaW5jbHVkZXMoXCJrZW5kcmFcIik7XG4gIGNvbmZpZy5yYWcuZW5naW5lcy5rZW5kcmEuZXh0ZXJuYWwgPSBbLi4ua2VuZHJhRXh0ZXJuYWxdO1xuICBjb25maWcucmFnLmVtYmVkZGluZ3NNb2RlbHMgPSBlbWJlZGRpbmdNb2RlbHM7XG4gIGNvbmZpZy5yYWcuZW1iZWRkaW5nc01vZGVscy5mb3JFYWNoKChtOiBhbnkpID0+IHtcbiAgICBpZiAobS5uYW1lID09PSBtb2RlbHMuZGVmYXVsdEVtYmVkZGluZykge1xuICAgICAgbS5kZWZhdWx0ID0gdHJ1ZTtcbiAgICB9XG4gIH0pO1xuICBjb25zb2xlLmxvZyhcIlxcbuKcqCBUaGlzIGlzIHRoZSBjaG9zZW4gY29uZmlndXJhdGlvbjpcXG5cIik7XG4gIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGNvbmZpZywgdW5kZWZpbmVkLCAyKSk7XG4gIChcbiAgICAoYXdhaXQgZW5xdWlyZXIucHJvbXB0KFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogXCJjb25maXJtXCIsXG4gICAgICAgIG5hbWU6IFwiY3JlYXRlXCIsXG4gICAgICAgIG1lc3NhZ2U6IFwiRG8geW91IHdhbnQgdG8gY3JlYXRlIGEgbmV3IGNvbmZpZyBiYXNlZCBvbiB0aGUgYWJvdmVcIixcbiAgICAgICAgaW5pdGlhbDogZmFsc2UsXG4gICAgICB9LFxuICAgIF0pKSBhcyBhbnlcbiAgKS5jcmVhdGVcbiAgICA/IGNyZWF0ZUNvbmZpZyhjb25maWcpXG4gICAgOiBjb25zb2xlLmxvZyhcIlNraXBwaW5nXCIpO1xuXG4gIHJldHVybiAoXG4gICAgKGF3YWl0IGVucXVpcmVyLnByb21wdChbXG4gICAgICB7XG4gICAgICAgIHR5cGU6IFwiY29uZmlybVwiLFxuICAgICAgICBuYW1lOiBcImRlcGxveVwiLFxuICAgICAgICBtZXNzYWdlOiBcIkRvIHlvdSB3YW50IHRvIGRlcGxveSB0aGlzIHByb2plY3QgdmlhIGEgY2xvdWQgYnVpbGRcIixcbiAgICAgICAgaW5pdGlhbDogZmFsc2UsXG4gICAgICB9LFxuICAgIF0pKSBhcyBhbnlcbiAgKS5kZXBsb3k7XG59XG4iXX0=