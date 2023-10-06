import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CodeBuildProject } from "aws-cdk-lib/aws-events-targets";
import { BuildSpec, Project } from "aws-cdk-lib/aws-codebuild";
import { readFileSync } from "fs";
import { ManagedPolicy, Role } from "aws-cdk-lib/aws-iam";

export interface AwsGenAIChatBuildStackProps extends cdk.StackProps {
  readonly config: any;
}

export class AwsGenAIChatBuildStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, {
      description: "AWS GenAI LLM Build",
      ...props,
    });

    const config = readFileSync("./bin/config.json");

    const codeBuildRole = new Role(this, "GenAI-CodeBuildRole", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("codebuild.amazonaws.com"),
    });
    codeBuildRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"));

    const buildProj = new Project(this, "GenAI-CloudBuild", {
      environment: {
        computeType: cdk.aws_codebuild.ComputeType.LARGE,
        privileged: true,
        buildImage: cdk.aws_codebuild.LinuxBuildImage.AMAZON_LINUX_2_5,
        environmentVariables: {
          GENAI_CONFIG: {
            type: cdk.aws_codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: JSON.stringify(config),
          },
        },
      },
      buildSpec: BuildSpec.fromObject({
        version: "0.2",
        phases: {
          pre_build: {
            commands: [
              "echo 'Running pre-build commands...'",
              "git clone https://github.com/aws-samples/aws-genai-llm-chatbot.git",
              "cd aws-genai-llm-chatbot",
              'if [ ! "$GENAI_CONFIG" == "" ]; then echo ${GENAI_CONFIG} > ./bin/config.json; fi',
            ],
          },
          build: {
            commands: [
              "echo 'Running build commands...'",
              "cat ./bin/config.json",
              "npm  install",
              "npm run build",
              "npx cdk deploy ${PREFIX}GenAIChatBotStack --require-approval never",
            ],
          },
        },
      }),
      role: codeBuildRole,
      concurrentBuildLimit: 1,
    });
    
    new cdk.CfnOutput(this, "BuildProjectName", {
        description: "Build Project Name",
        value: buildProj.projectName,
        exportName: "buildProjectName"
    })
  }
}
