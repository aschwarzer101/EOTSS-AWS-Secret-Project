import os
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
    
    def enhance_prompt(self, chat_history, initial_output, source_documents):
    # Implement your logic to enhance the prompt here
        enhanced_prompt = f"{chat_history}\n{initial_output}\n{source_documents}"
        return enhanced_prompt

    def run_with_chain(self, user_prompt, workspace_id=None):
        if not self.llm:
            raise ValueError("llm must be set")

        self.callback_handler.prompts = []

        if workspace_id:
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

            #initial code 
            #result = conversation({"question": user_prompt})
            #logger.info(result["source_documents"])

            #initial conversation output and source documents
            result = conversation.run({"question": user_prompt})
            initial_output = result["answer"]
            source_documents = result["source_documents"]

            # Print the retrieved documents -- testing
            for doc in result["source_documents"]:
                print(f"Page Content: {doc.page_content}")
                print(f"Metadata: {doc.metadata}")
            
            documents = [
                {
                    "page_content": doc.page_content,
                    "metadata": doc.metadata,
                }
                for doc in source_documents #result["source_documents"]
            ]

            # prompt enhancer 
            chat_history = self.callback_handler.prompts   
            enhanced_prompt = self.enhance_prompt(chat_history, initial_output, source_documents)

            # run conversation with enhanced prompt
            final_result = conversation.run({"question": enhanced_prompt})
            final_output = final_result["answer"]
    

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
                "content": final_output, # old result["answer"],
                "metadata": metadata,
            }

        conversation = ConversationChain(
            llm=self.llm,
            prompt=self.get_prompt(),
            memory=self.get_memory(),
            verbose=True,
        )
        print(user_prompt)
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