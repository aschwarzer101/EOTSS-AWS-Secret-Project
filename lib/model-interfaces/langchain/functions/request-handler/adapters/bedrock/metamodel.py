import genai_core.clients
import json
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

logger = Logger()

def getCsvDataAsText():
    """
    Function to read the CSV data from a file and return it as text.

    :return: The CSV data as text.
    """
    # Read the CSV data from a file
    with open("Bedrock_LLM_Guide.csv", "r") as file:
        csvData = file.read()

    return csvData

def check_model_and_return(model_name):
    valid_models = [
        "Titan Text G1 - Lite",
        "Titan Text G1 - Express",
        "Jurassic-2 Mid",
        "Jurassic-2 Ultra",
        "Claude Instant",
        "Claude",
        "Claude 3 Sonnet",
        "Claude 3 Haiku",
        "Command",
        "Command Light",
        "Llama 2 Chat 13B",
        "Llama 2 Chat 70B",
        "Mistral 7B Instruct",
        "Mixtral 8x7B Instruct"
    ]

    # Check if the model name is in the list of valid models
    if model_name in valid_models:
        return model_name
    else:
        # If the model name is not in the list, return "Claude 3 Sonnet"
        return "Claude 3 Sonnet"

def getModelSuggestion(user_prompt):
    csv_data = getCsvDataAsText()

    base_prompt = f"""Decision-Making Task with Model Name Consistency:

    Context: You are tasked with evaluating a dataset detailing various language models to determine the most suitable one for a specific user request. The dataset provides insights on model capabilities, use cases, and performance metrics.

    Input Data:

    CSV Dataset: ${csv_data}
    User Prompt: ${user_prompt}

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

    # Invoke Claude 3 with the prompt
    # get client from boto3
    bedrock = genai_core.clients.get_bedrock_client()
    model_id = "anthropic.claude-3-sonnet-20240229-v1:0",
    try:
        response = bedrock.invoke_model(
            modelId=model_id,
            body=json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1024,
                    "messages": [
                        {
                            "role": "user",
                            "content": [{"type": "text", "text": base_prompt}],
                        }
                    ],
                }
            ),
        )

        # Process and print the response
        result = json.loads(response.get("body").read())
        output_list = result.get("content", [])
        if output_list:
            model_name = output_list[0].get("text", "")
            return check_model_and_return(model_name)

    except ClientError as err:
        logger.error(
            "Couldn't invoke Claude 3 Sonnet(Meta Model). Here's why: %s: %s",
            err.response["Error"]["Code"],
            err.response["Error"]["Message"],
        )

        return None

