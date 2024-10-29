import os
import genai_core.clients
import json
from botocore.exceptions import ClientError
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

    def get_enhanced_prompt(self, user_prompt, chat_history):
        print('running get_enhanced_prompt')
        llm = self.get_llm({"streaming": False})
        chat_history = chat_history[-3:] #limiting to last 3 messages

        # Enhanced prompt template
        base_prompt = f"""Prompt Enhancement Task:

        Context: You are tasked with enhancing a user prompt using the provided chat history, initial question, and initial documents to create a more detailed, contextually rich prompt for further processing.

        Chat History:
        {chat_history}

        User Prompt:
        {user_prompt}

        Task: Generate a standalone, contextually rich prompt that can be understood without requiring the chat history. Use relevant keywords and context from the chat history to reformulate the user prompt if needed, but do NOT answer the question. Only return the enhanced prompt as the output.
        Also remember to keep the prompt length under 1000 characters."""

        print('base_prompt', base_prompt)

        # Call the LLM to get the enhanced prompt on Sonnet 3.5
        bedrock = genai_core.clients.get_bedrock_client()
        try:
            response = bedrock.invoke_model(
                modelId="anthropic.claude-3-5-sonnet-20240620-v1:0",  # Change for different model
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 100,
                    "messages": [{"role": "user", "content": base_prompt}],
                })
            )
            # Response from bedrock
            result = json.loads(response.get("body").read())
            print("Response from Bedrock:", result)

            # Extract and print the enhanced prompt from the content list
            content_list = result.get("content", [])
            if content_list:
                enhanced_prompt = content_list[0].get("text", "")
                print("Enhanced Prompt Text:", enhanced_prompt)  # Print only the text from content
                return enhanced_prompt
            else:
                print("No content found in the response.")
                return None
        except ClientError as err:
            logger.error(
                f"Couldn't invoke model. Error: {err.response['Error']['Code']}: {err.response['Error']['Message']}")
            return None

    def is_first_question(self):
        # Check if the chat history is empty or has only one entry
        chat_history = self.chat_history.messages
        return len(chat_history) <= 1
    
    def get_qa_prompt_without_history(self):
        # Define a prompt template that does not include previous context history
        return """
        You are an AI assistant. Answer the following question based on your knowledge and understanding.

        Question: {question}

        Provide a clear and concise answer.
        """
    
    def run_with_chain(self, user_prompt, workspace_id=None):
        if not self.llm:
            raise ValueError("llm must be set")

        self.callback_handler.prompts = []

        # if there is an active workspace_id
        if workspace_id:
            conversation = ConversationalRetrievalChain.from_llm(
                self.llm,
                WorkspaceRetriever(workspace_id=workspace_id),
                condense_question_llm=self.get_llm({"streaming": False}),
                condense_question_prompt=self.get_condense_question_prompt(),
                combine_docs_chain_kwargs={
                    "prompt": self.get_qa_prompt() if not self.is_first_question() 
                    else self.get_qa_prompt_without_history()
                                           },
                return_source_documents=True,
                memory=self.get_memory(output_key="answer", return_messages=True),
                verbose=True,
                callbacks=[self.callback_handler],
            )

            # enhanced prompt 
            chat_history = self.chat_history.messages
            print('chat_history', chat_history)
            enhanced_prompt = self.get_enhanced_prompt(user_prompt, chat_history)
            print('enhanced', enhanced_prompt)
            # adding user prompt to the end of enhanced prompt (SARAH TEST)
            enhanced_prompt = enhanced_prompt + "Text:" + user_prompt
            
            

            # call the llm with user prompt and get response 
            result = conversation({"question": enhanced_prompt})
            logger.info(result["source_documents"])
            documents = [
                {
                    "page_content": doc.page_content,
                    "metadata": doc.metadata,
                }
                for doc in result["source_documents"]
            ]
            print('result ran', result)

            metadata = {
                "modelId": self.model_id,
                "modelKwargs": self.model_kwargs,
                "mode": self._mode,
                "sessionId": self.session_id,
                "userId": self.user_id,
                "workspaceId": workspace_id,
                "documents": documents,
                "prompts": self.callback_handler.prompts,
                "original_prompt": user_prompt,  # Store the original prompt
            }
            #print('callback', self.callback_handler.prompts)

            self.chat_history.add_metadata(metadata)
            #print('callback handler', self.callback_handler.prompts))
            #print('chat', self.chat_history.add_metadata(metadata))

            return {
                "sessionId": self.session_id,
                "type": "text",
                "content": result["answer"],
                "metadata": metadata,
            }

        # if there is not an active workspace_id 
        conversation = ConversationChain(
            llm=self.llm,
            prompt=self.get_prompt(),
            memory=self.get_memory(),
            verbose=True,
        )

        # call llm and get response 
        answer = conversation.predict(
            input=user_prompt, callbacks=[self.callback_handler]
        )

        metadata = {
            "modelId": self.model_id,
            "modelKwargs": self.model_kwargs,
            "mode": self._mode,
            "sessionId": self.session_id,
            "userId": self.user_id,
            "documents": [],
            "prompts": self.callback_handler.prompts,
            "original_prompt": user_prompt,  # Store the original prompt

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
