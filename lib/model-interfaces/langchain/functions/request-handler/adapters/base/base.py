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

        # Track the initial question and documents
        self.initial_question = None
        self.initial_documents = []

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
    
    # Enhancer: Adds initial question and initial documents to context history
    # def enhance_prompt(self, chat_history, user_input):
    #     initial_context = ""
    #     if self.initial_question:
    #         initial_context += f"\nInitial question: {self.initial_question}\n"
        
    #     if self.initial_documents:
    #         initial_context += "\nInitial source documents:\n"
    #         for doc in self.initial_documents:
    #             initial_context += f"- {doc['page_content'][:200]}...\n"  # Shortened content preview

    #     enhanced_prompt = f"{chat_history}\n{initial_context}\nQuestion: {user_input}"
    #     return enhanced_prompt
    def enhance_prompt(self, chat_history, user_input):
        """
        Enhances the user input prompt by adding initial question and initial documents to the context history.

        Args:
            chat_history (str): The chat history to include in the prompt.
            user_input (str): The user's input question.

        Returns:
            str: The enhanced prompt.
        """
        context_parts = [chat_history]

        if self.initial_question:
            context_parts.append(f"\nInitial question: {self.initial_question}\n")
        
        if self.initial_documents:
            context_parts.append("\nInitial source documents:\n")
            for doc in self.initial_documents:
                context_parts.append(f"- {doc['page_content'][:200]}...\n")  # Shortened content preview

        context_parts.append(f"\nQuestion: {user_input}")
        
        enhanced_prompt = ''.join(context_parts)
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
            result = conversation({"question": user_prompt})
            logger.info(result["source_documents"])

            # Capture initial question and documents if it's the first run
            if not self.initial_question:
                self.initial_question = user_prompt
                self.initial_documents = [
                    {"page_content": doc.page_content, "metadata": doc.metadata}
                    for doc in result["source_documents"]
                ]

            # Print the retrieved documents -- testing
            for doc in result["source_documents"]:
                print(f"Page Content: {doc.page_content}")
                print(f"Metadata: {doc.metadata}")
            
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

        # Enhance the prompt with context before running the chain
        enhanced_user_prompt = self.enhance_prompt(self.chat_history, user_prompt)

        # newest update
        # # Fetch relevant documents based on the enhanced prompt
        # relevant_documents = self.fetch_documents(enhanced_user_prompt)

        # # Update initial documents with the newly fetched relevant documents
        # self.initial_documents = relevant_documents
        
        conversation = ConversationChain(
            llm=self.llm,
            prompt=self.get_prompt(),
            memory=self.get_memory(),
            verbose=True,
        )
  
        answer = conversation.predict(
            input=enhanced_user_prompt, callbacks=[self.callback_handler]
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