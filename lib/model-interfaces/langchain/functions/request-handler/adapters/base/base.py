import os
import genai_core.clients
import json
from enum import Enum
from aws_lambda_powertools import Logger
from langchain.callbacks.base import BaseCallbackHandler
from langchain.chains import ConversationalRetrievalChain, ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts.prompt import PromptTemplate
from langchain.chains.conversational_retrieval.prompts import (
    QA_PROMPT,
    CONDENSE_QUESTION_PROMPT,
)
from typing import Dict, List, Any

from genai_core.langchain import WorkspaceRetriever, DynamoDBChatMessageHistory
from genai_core.types import ChatbotMode

logger = Logger()


class Mode(Enum):
    CHAIN = "chain"


class LLMStartHandler(BaseCallbackHandler):
    prompts = []

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> Any:
        logger.info(prompts)
        self.prompts.append(prompts)


class ModelAdapter:
    def __init__(
        self, session_id, user_id, mode=ChatbotMode.CHAIN.value, model_kwargs={}
    ):
        self.session_id = session_id
        self.user_id = user_id
        self._mode = mode
        self.model_kwargs = model_kwargs

        self.callback_handler = LLMStartHandler()
        self.__bind_callbacks()

        self.chat_history = self.get_chat_history()
        self.llm = self.get_llm(model_kwargs)

    def __bind_callbacks(self):
        callback_methods = [method for method in dir(self) if method.startswith("on_")]
        valid_callback_names = [
            attr for attr in dir(self.callback_handler) if attr.startswith("on_")
        ]

        for method in callback_methods:
            if method in valid_callback_names:
                setattr(self.callback_handler, method, getattr(self, method))

    def get_llm(self, model_kwargs={}):
        raise ValueError("llm must be implemented")

    def get_embeddings_model(self, embeddings):
        raise ValueError("embeddings must be implemented")

    def get_chat_history(self):
        return DynamoDBChatMessageHistory(
            table_name=os.environ["SESSIONS_TABLE_NAME"],
            session_id=self.session_id,
            user_id=self.user_id,
        )

    def get_memory(self, output_key=None, return_messages=False):
        return ConversationBufferMemory(
            memory_key="chat_history",
            chat_memory=self.chat_history,
            return_messages=return_messages,
            output_key=output_key,
        )

    def get_prompt(self):
        template = """The following is a friendly conversation between a human and an AI. If the AI does not know the answer to a question, it truthfully says it does not know.

        Current conversation:
        {chat_history}

        Question: {input}"""

        return PromptTemplate.from_template(template)

    def get_condense_question_prompt(self):
        return CONDENSE_QUESTION_PROMPT

    def get_qa_prompt(self):
        return QA_PROMPT
    
    def get_enhanced_prompt(self, chat_history, user_input, initial_question=None, initial_documents=None):
        print('in enhnacement')
        context_parts = [chat_history]

        if initial_question:
            context_parts.append(f"\nInitial question: {initial_question}\n")
        
        if initial_documents:
            context_parts.append("\nInitial source documents:\n")
            for doc in initial_documents:
                context_parts.append(f"- {doc['page_content'][:200]}...\n")  # Shortened content preview

        context_parts.append(f"\nQuestion: {user_input}")

        # Combine context parts into a single string
        context = "\n".join(context_parts)
        
        base_prompt = f"""Prompt Enhancement Task:

        Context: You are tasked with enhancing a user prompt based on the provided chat history, initial question, and initial documents. The goal is to generate a more detailed and contextually rich prompt for further processing.

        Chat History:
        {chat_history}

        Initial Question:
        {initial_question if initial_question else "N/A"}

        Initial Documents:
        {''.join([f"- {doc['page_content'][:200]}...\n" for doc in initial_documents]) if initial_documents else "N/A"}

        User Prompt:
        {user_input}

        Task: Enhance the user prompt by incorporating relevant details from the chat history, initial question, and initial documents. The enhanced prompt should be clear, detailed, and contextually rich.

        Enhanced Prompt:"""

        # Call LLM to enhance the prompt
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
            print("Response from Bedrock:", response)  # Print the raw response
            result = json.loads(response.get("body").read())
            print("Parsed result:", result)  # Print the parsed result
            enhanced_prompt = result.get("content", [{}])[0].get("text", "")
            print("Enhanced prompt:", enhanced_prompt)  # Print the enhanced prompt
            return enhanced_prompt
        except ClientError as err:
            print(f"Couldn't invoke model. Error: {err.response['Error']['Code']}: {err.response['Error']['Message']}")
            return None

    def run_with_chain(self, user_prompt, workspace_id=None):
        if not self.llm:
            raise ValueError("llm must be set")

        self.callback_handler.prompts = []

        # Step 1: accepting hte user query 
        # Step 2: Enahncing the query 
        chat_history = self.chat_history.get_history()  # Assuming you have a method to get chat history
        initial_question = user_prompt  # Initial question is the user prompt
        initial_documents = []  # Initialize an empty list for initial documents
        print('initial question:', initial_question)

        if workspace_id:
            # Retrieving Relevant Documents 
            retriever = WorkspaceRetriever(workspace_id=workspace_id)
            relevant_documents = retriever.get_relevant_documents(query=user_prompt)
            initial_documents = [{"page_content": doc.page_content, "metadata": doc.metadata} for doc in relevant_documents]

            # Enhance the prompt
            enhanced_prompt = self.get_enhanced_prompt(
                chat_history=chat_history,
                user_input=user_prompt,
                initial_question=initial_question,
                initial_documents=initial_documents
            )
            print('enhanced prompt:', enhanced_prompt)

            # Contextualize and response
            conversation = ConversationalRetrievalChain.from_llm(
                self.llm,
                WorkspaceRetriever(workspace_id=workspace_id),
                condense_question_llm=self.get_llm({"streaming": False}),
                condense_question_prompt=self.get_condense_question_prompt(),
                combine_docs_chain_kwargs={"prompt": self.get_qa_prompt()},
                return_source_documents=True,
                memory=self.get_memory(output_key="answer", return_messages=True),
                verbose=True,
                callbacks=[self.callback_handler],
            )
            
            result = conversation({"question": user_prompt})
            logger.info(result["source_documents"])
            documents = [
                {
                    "page_content": doc.page_content,
                    "metadata": doc.metadata,
                }
                for doc in result["source_documents"]
            ]

            metadata = {
                "modelId": self.model_id,
                "modelKwargs": self.model_kwargs,
                "mode": self._mode,
                "sessionId": self.session_id,
                "userId": self.user_id,
                "workspaceId": workspace_id,
                "documents": documents,
                "prompts": self.callback_handler.prompts,
            }
    
            self.chat_history.add_metadata(metadata)

            return {
                "sessionId": self.session_id,
                "type": "text",
                "content": result["answer"],
                "metadata": metadata,
            }

        # Step 4: Provide the response for non-workspace queries
        enhanced_prompt = self.enhance_prompt(
            chat_history=chat_history,
            user_input=user_prompt,
            initial_question=initial_question,
            initial_documents=initial_documents
        )

        conversation = ConversationChain(
            llm=self.llm,
            prompt=self.get_prompt(),
            memory=self.get_memory(),
            verbose=True,
        )
        print(user_prompt)
        answer = conversation.predict(
            input=enhanced_prompt, callbacks=[self.callback_handler] # using enhanced prompt instead of user_prompt
        )

        metadata = {
            "modelId": self.model_id,
            "modelKwargs": self.model_kwargs,
            "mode": self._mode,
            "sessionId": self.session_id,
            "userId": self.user_id,
            "documents": [],   
            "prompts": self.callback_handler.prompts,
        }

        self.chat_history.add_metadata(metadata)

        return {
            "sessionId": self.session_id,
            "type": "text",
            "content": answer,
            "metadata": metadata,
        }

    def run(self, prompt, workspace_id=None, *args, **kwargs):
        logger.debug(f"run with {kwargs}")
        logger.debug(f"workspace_id {workspace_id}")
        logger.debug(f"mode: {self._mode}")

        if self._mode == ChatbotMode.CHAIN.value:
            return self.run_with_chain(prompt, workspace_id)

        raise ValueError(f"unknown mode {self._mode}")