import { useContext, useEffect, useState } from "react";
import {
  ChatBotConfiguration,
  ChatBotHistoryItem,
  ChatBotMessageType,
  FeedbackData,
} from "./types";
import { SpaceBetween, StatusIndicator } from "@cloudscape-design/components";
import { v4 as uuidv4 } from "uuid";
import { AppContext } from "../../common/app-context";
import { ApiClient } from "../../common/api-client/api-client";
import ChatMessage from "./chat-message";
import ChatInputPanel, { ChatScrollState } from "./chat-input-panel";
import styles from "../../styles/chat.module.scss";
import { CHATBOT_NAME } from "../../common/constants";

export default function Chat(props: { sessionId?: string, prompt?: string}) {
  const appContext = useContext(AppContext);
  const [running, setRunning] = useState<boolean>(false);
  const [session, setSession] = useState<{ id: string; loading: boolean }>({
    id: props.sessionId ?? uuidv4(),
    loading: typeof props.sessionId !== "undefined",
  });
  const [configuration, setConfiguration] = useState<ChatBotConfiguration>(
    () => ({
      streaming: true,
      showMetadata: false,
      maxTokens: 512,
      temperature: 0.6,
      topP: 0.9,
      files: null,
    })
  );

  const [messageHistory, setMessageHistory] = useState<ChatBotHistoryItem[]>(
    []
  );

  useEffect(() => {

    const queryParams = new URLSearchParams(window.location.search); 
    const urlPrompt = queryParams.get('prompt') || " "; 

    setInitialPrompt(decodeURIComponent(urlPrompt)); 

    if (!appContext) return;
    setMessageHistory([]);


    (async () => {
      if (!props.sessionId) {
        setSession({ id: uuidv4(), loading: false });
        return;
      }
      
      // NEW parse query params 
      // const queryParams = new URLSearchParams(window.location.search); 
      


      // checks if prompt, prefills input 
      if (props.prompt) {
        
        console.log(props.prompt)
        // console.log(primingPrompt)
        return;
        // prefill chat input panel
        // ideas: input state method 
        // prefillChatInput(primingPrompt)
      }


      setSession({ id: props.sessionId, loading: true });
      const apiClient = new ApiClient(appContext);
      try {
        const result = await apiClient.sessions.getSession(props.sessionId);

        if (result.data?.getSession?.history) {
          console.log(result.data.getSession);
          ChatScrollState.skipNextHistoryUpdate = true;
          ChatScrollState.skipNextScrollEvent = true;
          console.log("History", result.data.getSession.history);
          setMessageHistory(
            result
              .data!.getSession!.history.filter((x) => x !== null)
              .map((x) => ({
                type: x!.type as ChatBotMessageType,
                metadata: JSON.parse(x!.metadata!),
                content: x!.content,
              }))
          );

          window.scrollTo({
            top: 0,
            behavior: "instant",
          });
        }
      } catch (error) {
        console.log(error);
      }

      setSession({ id: props.sessionId, loading: false });
      setRunning(false);
    })();
  }, [appContext, props.sessionId, props.prompt]);

  // define state to keep track of initial prompt when mounting 
  const [initialPrompt, setInitialPrompt] = useState(prompt);

  const handleFeedback = (feedbackType: 1 | 0, idx: number, message: ChatBotHistoryItem) => {
    if (message.metadata.sessionId) {
      
      let prompt = " ";
      if (Array.isArray(message.metadata.prompts) && Array.isArray(message.metadata.prompts[0])) { 
          prompt = message.metadata.prompts[0][0];
      }
      const completion = message.content;
      const model = message.metadata.modelId;
      const feedbackData: FeedbackData = {
        sessionId: message.metadata.sessionId as string,
        key: idx,
        feedback: feedbackType,
        prompt: prompt,
        completion: completion,
        model: model as string
      };
      addUserFeedback(feedbackData);
    }
  };

  const addUserFeedback = async (feedbackData: FeedbackData) => {
    if (!appContext) return;

    const apiClient = new ApiClient(appContext);
    await apiClient.userFeedback.addUserFeedback({feedbackData});
  };



  return (
    <div className={styles.chat_container}>
      <SpaceBetween direction="vertical" size="m">
        {messageHistory.map((message, idx) => (
          <ChatMessage
            key={idx}
            message={message}
            showMetadata={configuration.showMetadata}
            onThumbsUp={() => handleFeedback(1, idx, message)}
            onThumbsDown={() => handleFeedback(0, idx, message)}
          />
        ))}
      </SpaceBetween>
      <div className={styles.welcome_text}>
        {messageHistory.length == 0 && !session?.loading && (
          <center>{CHATBOT_NAME}</center>
        )}
        {session?.loading && (
          <center>
            <StatusIndicator type="loading">Loading session</StatusIndicator>
          </center>
        )}
      </div>
      <div className={styles.input_container}>
        <ChatInputPanel
          session={session}
          running={running}
          setRunning={setRunning}
          initialPrompt={initialPrompt}
          // CHECK HERE
          messageHistory={messageHistory}
          setMessageHistory={(history) => setMessageHistory(history)}
          configuration={configuration}
          setConfiguration={setConfiguration}
        />
      </div>
    </div>
  );
}
