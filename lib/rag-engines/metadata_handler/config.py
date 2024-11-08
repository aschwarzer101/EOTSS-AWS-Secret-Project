# # Define tag values and their descriptions for categorizing documents (EOED-specific)
# CATEGORIES = {
#     'rfp': 'A Request for Proposal document outlining specific funding opportunities for businesses and organizations.',
#     'one_pager': 'A concise overview or summary document detailing essential information about grants or programs.',
#     'eligibility_summary': 'A document summarizing eligibility requirements for various grants and programs provided by EOED.'
# }

# # Define custom tags to provide additional metadata for EOED documents.
# CUSTOM_TAGS = {
#     'complexity': ['beginner', 'intermediate', 'advanced'],  # Levels indicating document complexity for different audiences.
#     'agency': [
#         'MassTech Collaborative', 'MassVentures', 'MassDevelopment', 'Mass Clean Energy Center', 'Mass Save',
#         'Mass Growth Capital Corp', 'Mass Life Sciences Center', 'Mass Office of International Trade and Investment',
#         'Mass Office of Business Development', 'MassEcon', 'Mass Small Business Development Center'
#     ],  # EOED-specific agencies with a catch-all for others.
#     'grant_program_name': [],  # Placeholder for the specific grant or program name, extracted from content.
#     'date': []  # Placeholder for the document's date of publication or issuance, extracted from content.
# }

# # Descriptions for each tag to guide their use and selection (EOED-specific).
# TAG_DESCRIPTIONS = {
#     'category': 'Defines the document type, such as RFP, one-pager, or eligibility summary.',
#     'complexity': 'Indicates how complex the document is to understand, with options for beginner, intermediate, and advanced EOED readership.',
#     'agency': 'The issuing agency or quasi-organization. If outside the predefined list, the tool should extract and label it as "Other" with the specific name.',
#     'grant_program_name': 'The specific name of the grant or program covered in the document, extracted from content.',
#     'date': 'The date when the document was issued or last updated, extracted from content.'
# }

# # Function to compile all tags (predefined and custom) into a dictionary for easy access.
# def get_all_tags():
#     return {**{'category': list(CATEGORIES.keys())}, **CUSTOM_TAGS}

# # Function to generate a prompt that directs the AI to analyze a document, summarize it, and apply relevant tags.
# def get_full_prompt(key, content):
#     all_tags = get_all_tags()

#     prompt = f"""Analyze the following EOED document and provide:
# 1. A summary of about 100 words.
# 2. Appropriate tags from the following options:

# """

#     for tag, values in all_tags.items():
#         prompt += f"{tag}: {', '.join(values) if values else 'Determine based on content'}\n"
#         if tag in TAG_DESCRIPTIONS:
#             prompt += f"   Description: {TAG_DESCRIPTIONS[tag]}\n"

#     prompt += f"""
# For tags with no predefined values, please determine an appropriate value based on the tag's description and the document content.
# Ensure that your response is in JSON format with keys 'summary' and 'tags', where 'tags' is an object containing the selected tags.
# Example JSON Response:
# {{
#     "summary": "<Your Summary>",
#     "tags": {{
#         "category": "rfp",
#         "complexity": "intermediate",
#         "agency": "MassDevelopment",
#         "grant_program_name": "Small Business Support Grant",
#         "date": "2024-11-06"
#     }}
# }}

# Document Name : {key}
# Document: {content}"""

#     return prompt
