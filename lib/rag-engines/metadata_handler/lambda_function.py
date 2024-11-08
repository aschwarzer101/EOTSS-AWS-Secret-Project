# import boto3
# import json
# import urllib.parse
# import os
# from botocore.exceptions import ClientError
# from config import get_full_prompt, get_all_tags, CATEGORIES, CUSTOM_TAGS



# s3 = boto3.client('s3')
# bedrock = boto3.client('bedrock-agent-runtime', region_name = 'us-east-1') #For using retrieve function
# bedrock_invoke =boto3.client('bedrock-runtime', region_name = 'us-east-1') #For using invoke function
# kb_id = os.environ['KB_ID']
# kendra = boto3.client('kendra', region_name='us-east-1')

# # Using Knowledge Base to fetch document contents
# def retrieve_kb_docs(file_name, index_id):
#     try:
#         # Prepare the search query
#         key, _ = os.path.splitext(file_name)
#         print(f"Search query in Kendra: {key}")

#         # Perform the query on the Kendra index
#         response = kendra.query(
#             IndexId=index_id,
#             QueryText=key,
#             PageSize=20  # Retrieve up to 20 results (adjust as needed)
#         )
        
#         # Initialize lists to store content and URIs
#         full_content = []
#         file_uris = []

#         # Process each result in the response
#         if 'ResultItems' in response and response['ResultItems']:
#             for item in response['ResultItems']:
#                 # Ensure the item contains document content and URI
#                 if 'DocumentExcerpt' in item and 'Text' in item['DocumentExcerpt']:
#                     full_content.append(item['DocumentExcerpt']['Text'])
#                 if 'DocumentURI' in item:
#                     file_uris.append(item['DocumentURI'])

#             # Return content and URIs in a consistent format
#             return {
#                 'content': full_content,
#                 'uris': file_uris
#             }

#         # If no relevant document is found, return a default message
#         else:
#             return {
#                 'content': "No relevant document found in the Kendra index.",
#                 'uris': None
#             }

#     except ClientError as e:
#         print(f"Error fetching documents from Kendra: {e}")
#         return {
#             'content': "Error occurred while searching the Kendra index.",
#             'uris': None
#         }


# # Function to summarize and categorize using claude 3
# def summarize_and_categorize(key,content):
#     try:
#         response = bedrock_invoke.invoke_model(
#             modelId='anthropic.claude-3-sonnet-20240229-v1:0',
#             contentType='application/json',
#             accept='application/json',
#             body=json.dumps({
#                 "anthropic_version": "bedrock-2023-05-31",
#                 "max_tokens": 500,
#                 "messages": [
#                     {
#                         "role": "user",
#                         "content": get_full_prompt(key,content)
#                     }
#                 ]
#             })
#         )

#         raw_response_body= response['body'].read()
#         print(f"Raw llm output : {raw_response_body}")
#         try:
#             result = json.loads(raw_response_body)
#         except json.JSONDecodeError:
#             print("Error: Response not in JSON format")
#             result = {"content": [{"text": raw_response_body}]}

#         summary_and_tags = json.loads(result['content'][0]['text'])
#         # Validate the tags
#         all_tags = get_all_tags()
#         for tag, value in summary_and_tags['tags'].items():
#             if tag in all_tags:
#                 if all_tags[tag] and value not in all_tags[tag]:
#                     summary_and_tags['tags'][tag] = 'unknown'
#             else:
#                 summary_and_tags['tags'][tag] = 'unknown'

#         return summary_and_tags
#     except Exception as e:
#         print(f"Error generating summary and tags: {e}")
#         return {"summary": "Error generating summary", "tags": {"category": "unknown"}}

# # Getting metadata information from a file
# def get_metadata(bucket,key):
#     response = s3.head_object(Bucket=bucket, Key=key)
#     existing_metadata = response.get('Metadata', {})
#     return existing_metadata

# #Getting metadata information of all files in a single document
# def get_complete_metadata(bucket):
#     all_metadata = {}
#     try:
#         paginator = s3.get_paginator('list_objects_v2')
#         for page in paginator.paginate(Bucket =bucket):
#             if 'Contents' in page:
#                 for obj in page['Contents']:
#                     key = obj['Key']
#                     try:
#                         all_metadata[key] = get_metadata(bucket,key)
#                     except Exception as e:
#                         print(f"Error in fetching complete metadata for {key}: {e}")

#         metadata_json = json.dumps(all_metadata, indent=4)
#         # Upload to S3 with a specific key
#         metadata_file = r"metadata.txt"
#         s3.put_object(
#             Bucket=bucket,
#             Key=metadata_file,
#             Body=metadata_json,
#             ContentType='text/plain'
#         )
#         print(f"Metadata successfully uploaded to {bucket}/{metadata_file}")
#         return all_metadata

#     except Exception as e:
#         print(f"Error occured in fetching complete metadata : {e}")
#         return None

# def lambda_handler(event, context):
#     try:
#         # Check if the event is caused by the Lambda function itself
#         if event['Records'][0]['eventSource'] == 'aws:s3' and \
#            event['Records'][0]['eventName'].startswith('ObjectCreated:Copy'):
#             print("Skipping event triggered by copy operation")


#             return {
#                 'statusCode': 200,
#                 'body': json.dumps("Skipped event triggered by copy operation")
#             }


#     except:
#         print("Issue checking for s3 action")


#     try:
#         # Get the bucket name and file key from the event, handling URL-encoded characters
#         bucket = event['Records'][0]['s3']['bucket']['name']
#         raw_key = event['Records'][0]['s3']['object']['key']
#         key = urllib.parse.unquote_plus(raw_key)
#         # Skipping operation if the uploaded file is metadata.
#         if key == "metadata.txt":
#             print("Skipping processing for metadata.txt to prevent recursion.")
#             return {
#                 'statusCode': 200,
#                 'body': json.dumps("Skipped processing for metadata.txt")
#             }

#         print(f"Processing file: Bucket - {bucket}, File - {key}")

#         # Retrieve the document content from the knowledge base
#         print(f"file : {key}, kb_id : {kb_id}")
#         document_content = retrieve_kb_docs(key, kb_id)
#         if "Error occurred" in document_content:
#             return {
#                 'statusCode': 500,
#                 'body': json.dumps("Error retrieving document content from knowledge base")
#             }
#         else:
#             print(f"Content : {document_content}")

#         summary_and_tags = summarize_and_categorize(key,document_content)
#         if "Error generating summary" in summary_and_tags['summary']:
#             return {
#                 'statusCode': 500,
#                 'body': json.dumps("Error generating summary and tags")
#             }
#         else:
#             print(f"Summary and category : {summary_and_tags}")




#         try:
#             existing_metadata = get_metadata(bucket,key)
#         except Exception as e:
#             print(f"Error fetching metadata for {key}: {e}")
#             return {
#                 'statusCode': 500,
#                 'body': json.dumps(f"Error fetching metadata for {key}: {e}")
#             }

#         # Generate new metadata fields

#         new_metadata = {
#             'summary': summary_and_tags['summary'],
#             **{f"tag_{k}": v for k, v in summary_and_tags['tags'].items()}
#         }

#         # Merge new metadata with any existing metadata
#         updated_metadata = {**existing_metadata, **new_metadata}

#         # Copy the object to itself to update metadata
#         try:
#             s3.copy_object(
#                 Bucket=bucket,
#                 CopySource={'Bucket': bucket, 'Key': key},
#                 Key=key,
#                 Metadata=updated_metadata,
#                 MetadataDirective='REPLACE'
#             )
#             print(f"Metadata successfully updated for {key}: {updated_metadata}")
#         except Exception as e:
#             print("Error in copying file copy")
#             print(f"Error updating metadata for {key}: {e}")
#             return {
#                 'statusCode': 500,
#                 'body': json.dumps(f"Error updating metadata for {key}: {e}")
#             }

#         all_metadata = get_complete_metadata(bucket)
#         if all_metadata is not None:
#             print(f"All Metadata : {all_metadata}")
#             return {
#                 'statusCode': 200,
#                 'body': json.dumps(all_metadata)
#             }
#         else:
#             return {
#                 'statusCode': 500,
#                 'body': json.dumps("Failed to retrieve metadata")
#             }

#     except Exception as e:
#         print(f"Unexpected error processing file: {e}")
#         return {
#             'statusCode': 500,
#             'body': json.dumps(f"Unexpected error processing file: {e}")
#         }