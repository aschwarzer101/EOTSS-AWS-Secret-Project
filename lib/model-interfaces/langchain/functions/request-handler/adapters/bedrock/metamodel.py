import json
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger
import genai_core.clients
import os

from .base import Bedrock
from ..base import ModelAdapter
from genai_core.registry import registry

logger = Logger()


class BedrockMetaModelAdapter(ModelAdapter):
    def __init__(self, session_id, user_id, model_id="meta_model_as_db_supersecret_id",
                 model_kwargs={}, *args, **kwargs):
        # Initialize the model_id for this instance
        self.model_id = model_id
        # A specific model identifier for a particular version of a model
        self.BEDROCK_MODEL_ID_CLAUDE_3_Sonnet = "anthropic.claude-3-sonnet-20240229-v1:0"

        # Call the superclass constructor with all required and optional parameters
        super().__init__(session_id, user_id, model_kwargs=model_kwargs, *args, **kwargs)

    def get_llm(self, model_kwargs={}):
        bedrock = genai_core.clients.get_bedrock_client()
        params = {}
        if "temperature" in model_kwargs:
            params["temperature"] = model_kwargs["temperature"]
        if "topP" in model_kwargs:
            params["top_p"] = model_kwargs["topP"]
        if "maxTokens" in model_kwargs:
            params["max_tokens"] = model_kwargs["maxTokens"]

        params["anthropic_version"] = "bedrock-2023-05-31"
        return Bedrock(
            client=bedrock,
            model_id=self.BEDROCK_MODEL_ID_CLAUDE_3_Sonnet,
            model_kwargs=params,
            streaming=model_kwargs.get("streaming", False),
            callbacks=[self.callback_handler],
        )

    def get_csv_data_as_text(self):
        directory = os.path.dirname(os.path.abspath(__file__))
        filepath = os.path.join(directory, "Bedrock_LLM_Guide.csv")
        try:
            with open(filepath, "r") as file:
                return file.read()
        except Exception as e:
            logger.error(f"Error reading CSV data: {str(e)}")
            return None


    model_id_data = {
        "Titan Text G1 - Express": "amazon.titan-text-express-v1",
        "Titan Text G1 - Lite": "amazon.titan-text-lite-v1",
        "Claude": "anthropic.claude-v2:1",
        "Claude 3 Sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
        "Claude 3 Haiku": "anthropic.claude-3-haiku-20240307-v1:0",
        "Claude Instant": "anthropic.claude-instant-v1",
        "Jurassic-2 Mid": "ai21.j2-mid-v1",
        "Jurassic-2 Ultra": "ai21.j2-ultra-v1",
        "Command": "cohere.command-text-v14",
        "Command Light": "cohere.command-light-text-v14",
        "Llama 2 Chat 13B": "meta.llama2-13b-chat-v1",
        "Llama 2 Chat 70B": "meta.llama2-70b-chat-v1",
        "Mistral 7B Instruct": "mistral.mistral-7b-instruct-v0:2",
        "Mixtral 8X7B Instruct": "mistral.mixtral-8x7b-instruct-v0:1",
    }

    def get_model_suggestion(self, user_prompt):
        csv_data = self.get_csv_data_as_text()
        if not csv_data:
            logger.error("Error reading CSV data.")
            return self.BEDROCK_MODEL_ID_CLAUDE_3_Sonnet

        base_prompt = f"""Decision-Making Task with Model Name Consistency:

        Context: You are tasked with evaluating a dataset detailing various language models to determine the most suitable one for a specific user request. The dataset provides insights on model capabilities, use cases, and performance metrics.

        Input Data:

        CSV Dataset: {csv_data}
        User Prompt: {user_prompt}

        Output Expectation: Respond with the exact model name from the list provided below, ensuring spelling accuracy. Your response should consist only of this model name, without additional commentary.

        List of Models for Consistency:
        Titan Text G1 - Lite
        Titan Text G1 - Express
        Jurassic-2 Mid
        Jurassic-2 Ultra
        Claude Instant
        Claude
        Claude 3 Sonnet
        Claude 3 Haiku
        Command
        Command Light
        Llama 2 Chat 13B
        Llama 2 Chat 70B
        Mistral 7B Instruct
        Mixtral 8x7B Instruct

        Procedure:

        Understand the User Prompt: Analyze the details of the user's request, including task requirements and any specific constraints.
        Evaluate Based on Criteria: Use the dataset to assess which model best aligns with the user's needs, considering factors like task complexity, language support, performance metrics, and cost.
        Make Your Decision: Identify the most appropriate model from the list above to handle the user's request, based on your analysis.
        Expected Output: Provide the selected model's name exactly as it appears in the list above. This ensures clarity and uniformity in the response, facilitating seamless further processing.

        Note: It is crucial to adhere to the requested output format, delivering only the name of the chosen model with exact spelling as listed, to maintain consistency across all responses."""

        bedrock = genai_core.clients.get_bedrock_client()
        try:
            response = bedrock.invoke_model(
                modelId=self.BEDROCK_MODEL_ID_CLAUDE_3_Sonnet,
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1024,
                    "messages": [{"role": "user", "content": base_prompt}],
                })
            )
            result = json.loads(response.get("body").read())
            model_name = result.get("content", [{}])[0].get("text", "")
            return self.model_id_data.get(self.check_model_and_return(model_name))
        except ClientError as err:
            logger.error(
                f"Couldn't invoke model. Error: {err.response['Error']['Code']}: {err.response['Error']['Message']}")
            return None

    def check_model_and_return(self, model_name):
        valid_models = [
            "Titan Text G1 - Lite", "Titan Text G1 - Express", "Jurassic-2 Mid", "Jurassic-2 Ultra",
            "Claude Instant", "Claude", "Claude 3 Sonnet", "Claude 3 Haiku",
            "Command", "Command Light", "Llama 2 Chat 13B", "Llama 2 Chat 70B",
            "Mistral 7B Instruct", "Mixtral 8x7B Instruct"
        ]
        return model_name if model_name in valid_models else "Claude 3 Sonnet"




# Register the adapter
registry.register(r"^bedrock.meta_model_as_db_supersecret_id", BedrockMetaModelAdapter)

# import genai_core.clients
# import json
# from botocore.exceptions import ClientError
# from aws_lambda_powertools import Logger
#
# logger = Logger()
#
# BEDROCK_MODEL_ID_CLAUDE_3_Sonnet = "anthropic.claude-3-sonnet-20240229-v1:0"
#
# def getCsvDataAsText():
#     """
#     Function to read the CSV data from a file and return it as text.
#
#     :return: The CSV data as text.
#     """
#     # Read the CSV data from a file
#     with open("Bedrock_LLM_Guide.csv", "r") as file:
#         csvData = file.read()
#
#     return csvData
#
# def check_model_and_return(model_name):
#     valid_models = [
#         "Titan Text G1 - Lite",
#         "Titan Text G1 - Express",
#         "Jurassic-2 Mid",
#         "Jurassic-2 Ultra",
#         "Claude Instant",
#         "Claude",
#         "Claude 3 Sonnet",
#         "Claude 3 Haiku",
#         "Command",
#         "Command Light",
#         "Llama 2 Chat 13B",
#         "Llama 2 Chat 70B",
#         "Mistral 7B Instruct",
#         "Mixtral 8x7B Instruct"
#     ]
#
#     # Check if the model name is in the list of valid models
#     if model_name in valid_models:
#         return model_name
#     else:
#         # If the model name is not in the list, return "Claude 3 Sonnet"
#         return "Claude 3 Sonnet"
#
# def getModelSuggestion(user_prompt):
#     csv_data = getCsvDataAsText()
#
#     base_prompt = f"""Decision-Making Task with Model Name Consistency:
#
#     Context: You are tasked with evaluating a dataset detailing various language models to determine the most suitable one for a specific user request. The dataset provides insights on model capabilities, use cases, and performance metrics.
#
#     Input Data:
#
#     CSV Dataset: ${csv_data}
#     User Prompt: ${user_prompt}
#
#     Output Expectation: Respond with the exact model name from the list provided below, ensuring spelling accuracy. Your response should consist only of this model name, without additional commentary.
#
#     List of Models for Consistency:
#
#     Titan Text G1 - Lite
#     Titan Text G1 - Express
#     Jurassic-2 Mid
#     Jurassic-2 Ultra
#     Claude Instant
#     Claude
#     Claude 3 Sonnet
#     Claude 3 Haiku
#     Command
#     Command Light
#     Llama 2 Chat 13B
#     Llama 2 Chat 70B
#     Mistral 7B Instruct
#     Mixtral 8x7B Instruct
#
#     Procedure:
#
#     Understand the User Prompt: Analyze the details of the user's request, including task requirements and any specific constraints.
#     Evaluate Based on Criteria: Use the dataset to assess which model best aligns with the user's needs, considering factors like task complexity, language support, performance metrics, and cost.
#     Make Your Decision: Identify the most appropriate model from the list above to handle the user's request, based on your analysis.
#     Expected Output: Provide the selected model's name exactly as it appears in the list above. This ensures clarity and uniformity in the response, facilitating seamless further processing.
#
#     Note: It is crucial to adhere to the requested output format, delivering only the name of the chosen model with exact spelling as listed, to maintain consistency across all responses."""
#
#     # Invoke Claude 3 with the prompt
#     # get client from boto3
#     bedrock = genai_core.clients.get_bedrock_client()
#     model_id = BEDROCK_MODEL_ID_CLAUDE_3_Sonnet,
#     try:
#         response = bedrock.invoke_model(
#             modelId=model_id,
#             body=json.dumps(
#                 {
#                     "anthropic_version": "bedrock-2023-05-31",
#                     "max_tokens": 1024,
#                     "messages": [
#                         {
#                             "role": "user",
#                             "content": [{"type": "text", "text": base_prompt}],
#                         }
#                     ],
#                 }
#             ),
#         )
#
#         # Process and print the response
#         result = json.loads(response.get("body").read())
#         output_list = result.get("content", [])
#         if output_list:
#             model_name = output_list[0].get("text", "")
#             return check_model_and_return(model_name)
#
#     except ClientError as err:
#         logger.error(
#             "Couldn't invoke Claude 3 Sonnet(Meta Model). Here's why: %s: %s",
#             err.response["Error"]["Code"],
#             err.response["Error"]["Message"],
#         )
#
#         return None
#
