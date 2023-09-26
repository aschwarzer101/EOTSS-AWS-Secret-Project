#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AwsGenAILLMChatbotStack } from "../lib/aws-genai-llm-chatbot-stack";
import { AwsGenAIChatBuildStack } from "../lib/aws-genai-llm-build-stack";
import { getConfig } from "./config";

const app = new cdk.App();

const config = getConfig();

new AwsGenAILLMChatbotStack(app, `${config.prefix}GenAIChatBotStack`, {
  config, 
});

new AwsGenAIChatBuildStack(app, 'GenAIChatBuildStack', {  });