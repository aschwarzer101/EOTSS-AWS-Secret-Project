import {
    Button,
    Container,
    Icon,
    Select,
    SelectProps,
    SpaceBetween,
    Spinner,
    StatusIndicator,
  } from "@cloudscape-design/components";
  import {
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
  } from "react";
  import { useNavigate } from "react-router-dom";
  import SpeechRecognition, {
    useSpeechRecognition,
  } from "react-speech-recognition";
  import TextareaAutosize from "react-textarea-autosize";
  import { ReadyState } from "react-use-websocket";
  import { ApiClient } from "../../common/api-client/api-client";
  import { AppContext } from "../../common/app-context";
  import { OptionsHelper } from "../../common/helpers/options-helper";
  import { StorageHelper } from "../../common/helpers/storage-helper";
  import { API } from "aws-amplify";
  import { GraphQLSubscription, GraphQLResult } from "@aws-amplify/api";
  import { Model, ReceiveMessagesSubscription, Workspace } from "../../API";
  import { LoadingStatus, ModelInterface } from "../../common/types";
  import styles from "../../styles/chat.module.scss";
  import ConfigDialog from "./config-dialog";
  import ImageDialog from "./image-dialog";
  import {
    ChabotInputModality,
    ChatBotHeartbeatRequest,
    ChatBotAction,
    ChatBotConfiguration,
    ChatBotHistoryItem,
    ChatBotMessageResponse,
    ChatBotMessageType,
    ChatBotMode,
    ChatBotRunRequest,
    ChatInputState,
    ImageFile,
    ChatBotModelInterface,
    ChatBotTask,
  } from "./types";
  import { sendQuery } from "../../graphql/mutations";
  import {
    getSelectedModelMetadata,
    getSignedUrl,
    updateMessageHistoryRef,
  } from "./utils";
  import { receiveMessages } from "../../graphql/subscriptions";
  import { Utils } from "../../common/utils";
import { languageList } from "../../common/constants";
import { Auth } from "aws-amplify";
import { valueFromAST } from "graphql";

  
  export interface TaskInputPanelProps {
    running: boolean; 
    setRunning: Dispatch<SetStateAction<boolean>>;
    session: { id: string; loading: boolean };
    initialPrompt: string; 
    task: ChatBotTask ;
    sendPromptOnlyOnce: boolean;
    instructions: string; 
    apiPrompt: string;
    language: string; 
    messageHistory: ChatBotHistoryItem[];
    setMessageHistory: (history: ChatBotHistoryItem[]) => void;
    configuration: ChatBotConfiguration;
    setConfiguration: Dispatch<React.SetStateAction<ChatBotConfiguration>>;
  }
  
  export abstract class ChatScrollState {
    static userHasScrolled = false;
    static skipNextScrollEvent = false;
    static skipNextHistoryUpdate = false;
  }
  
  const workspaceDefaultOptions: SelectProps.Option[] = [
    {
      label: "No workspace (RAG data source)",
      value: "",
      iconName: "close",
    },
    {
      label: "Create new workspace",
      value: "__create__",
      iconName: "add-plus",
    },
  ];
  
  export default function TaskInputPanel(props: TaskInputPanelProps) {
    const appContext = useContext(AppContext);
    const navigate = useNavigate();
    const { transcript, listening, browserSupportsSpeechRecognition } =
      useSpeechRecognition();
    const [isReadOnly, setIsReadOnly] = useState<boolean>(!!props.initialPrompt);
  
    const [state, setState] = useState<ChatInputState>({
      // have it so the value of the input is either the primer or mt string 
      value:  " ", 
      // + "For the above text" + props.apiPrompt, 
      // props.initialPrompt +
     // initialPrompt: props.initialPrompt, 
      initialPrompt: props.task.apiPrompt, 
      instructions: props.task.instructions, 
      apiPrompt: props.task.instructions,
      sendPromptOnlyOnce: props.task.sendPromptOnlyOnce,
      selectedModel: null,
      selectedModelMetadata: null,
      selectedWorkspace: workspaceDefaultOptions[0],
      modelsStatus: "loading",
      workspacesStatus: "loading",
    });
    const [configDialogVisible, setConfigDialogVisible] = useState(false);
    const [imageDialogVisible, setImageDialogVisible] = useState(false);
    const [files, setFiles] = useState<ImageFile[]>([]);
    const [readyState, setReadyState] = useState<ReadyState>(
      ReadyState.UNINSTANTIATED
    );
    const [selectedLanguage, setSelectedLanguage] = useState(null);
  
    const messageHistoryRef = useRef<ChatBotHistoryItem[]>([]);
  
    useEffect(() => {
      messageHistoryRef.current = props.messageHistory;
    }, [props.messageHistory]);

    useEffect(() => {
      async function subscribe() {
        console.log("Subscribing to AppSync");
        setReadyState(ReadyState.CONNECTING);
        const sub = await API.graphql<
          GraphQLSubscription<ReceiveMessagesSubscription>
        >({
          query: receiveMessages,
          variables: {
            sessionId: props.session.id,
            initialPrompt: props.initialPrompt
          },
          authMode: "AMAZON_COGNITO_USER_POOLS",
        }).subscribe({
          next: ({ value }) => {
            const data = value.data!.receiveMessages?.data;
            if (data !== undefined && data !== null) {
              const response: ChatBotMessageResponse = JSON.parse(data);
              //console.log("message data", response.data);
              if (response.action === ChatBotAction.Heartbeat) {
                console.log("Heartbeat pong!");
                return;
              }
              updateMessageHistoryRef(
                props.session.id,
                messageHistoryRef.current,
                response
              );
              console.log('message history current input panel', messageHistoryRef.current);
  
              if (
                response.action === ChatBotAction.FinalResponse ||
                response.action === ChatBotAction.Error
              ) {
                console.log("Final message received");
                props.setRunning(false);
              }
              props.setMessageHistory([...messageHistoryRef.current]);
            }
          },
          error: (error) => console.warn(error),
        });
        return sub;
      }
  
      
  
      const sub = subscribe();
      sub
        .then(() => {
          setReadyState(ReadyState.OPEN);
          console.log(`Subscribed to session ${props.session.id}`);
          const request: ChatBotHeartbeatRequest = {
            action: ChatBotAction.Heartbeat,
            modelInterface: ChatBotModelInterface.Langchain,
            data: {
              sessionId: props.session.id,
              initialPrompt: props.initialPrompt
            },
          };
          const result = API.graphql({
            query: sendQuery,
            variables: {
              data: JSON.stringify(request),
            },
          });
          Promise.all([result])
            .then((x) => console.log(`Query successful`, x))
            .catch((err) => console.log(err));
        })
        .catch((err) => {
          console.log(err);
          setReadyState(ReadyState.CLOSED);
        });
  
      return () => {
        sub
          .then((s) => {
            console.log(`Unsubscribing from ${props.session.id}`);
            s.unsubscribe();
          })
          .catch((err) => console.log(err));
      };
      // eslint-disable-next-line
    }, [props.session.id]);
    // from microphone
    useEffect(() => {
      if (transcript) {
        setState((state) => ({ ...state, value: transcript }));
      }
    }, [transcript]);
    // useEffect(() => {
    //   if (props.initialPrompt) {
    //     console.log("got to prompts use affect")
    //     setState((prevState) => ({ ...prevState, value: props.initialPrompt + " " }));
    //   }
    // }, [props.initialPrompt]);
  
    
  
    useEffect(() => {
      if (!appContext) return;
  
      (async () => {
        const apiClient = new ApiClient(appContext);
        let workspaces: Workspace[] = [];
        let workspacesStatus: LoadingStatus = "finished";
        let modelsResult: GraphQLResult<any>;
        let workspacesResult: GraphQLResult<any>;
        try {
          let username = "";
          username = await Auth.currentAuthenticatedUser().then((value) => username = value.username);
          if (appContext?.config.rag_enabled) {
            [modelsResult, workspacesResult] = await Promise.all([
              apiClient.models.getModels(),
              apiClient.workspaces.getWorkspaces(username),
            ]);
            workspaces = workspacesResult.data?.listWorkspaces;
            workspacesStatus =
              workspacesResult.errors === undefined ? "finished" : "error";
          } else {
            modelsResult = await apiClient.models.getModels();
          }
  
          const models = modelsResult.data ? modelsResult.data.listModels : [];

        // save meta model data to local storage as default
        let defaultModel = '';
        if(models.length){
          const smartModel = models.find((m) => m.name === "Smart Model");
          if (smartModel)  {
            defaultModel = "bedrock::Smart Model";
          }
        }

        const selectedModelOption = getSelectedModelOption(models, defaultModel);
          const selectedModelMetadata = getSelectedModelMetadata(
            models,
            selectedModelOption
          );
          const selectedWorkspaceOption = appContext?.config.rag_enabled
            ? getSelectedWorkspaceOption(workspaces)
            : workspaceDefaultOptions[0];
  
          setState((state) => ({
            ...state,
            models,
            prompt, 
            workspaces,
            selectedModel: selectedModelOption,
            selectedModelMetadata,
            selectedWorkspace: selectedWorkspaceOption,
            modelsStatus: "finished",
            workspacesStatus: workspacesStatus,
          }));
        } catch (error) {
          console.log(Utils.getErrorMessage(error));
          setState((state) => ({
            ...state,
            modelsStatus: "error",
          }));
          
        } 
      })();
    }, [appContext, state.modelsStatus]);
  
    useEffect(() => {
      const onWindowScroll = () => {
        if (ChatScrollState.skipNextScrollEvent) {
          ChatScrollState.skipNextScrollEvent = false;
          return;
        }
  
        const isScrollToTheEnd =
          Math.abs(
            window.innerHeight +
              window.scrollY -
              document.documentElement.scrollHeight
          ) <= 10;
  
        if (!isScrollToTheEnd) {
          ChatScrollState.userHasScrolled = true;
        } else {
          ChatScrollState.userHasScrolled = false;
        }
      };
  
      window.addEventListener("scroll", onWindowScroll);
  
      return () => {
        window.removeEventListener("scroll", onWindowScroll);
      };
    }, []);
  
    useLayoutEffect(() => {
      if (ChatScrollState.skipNextHistoryUpdate) {
        ChatScrollState.skipNextHistoryUpdate = false;
        return;
      }
  
      if (!ChatScrollState.userHasScrolled && props.messageHistory.length > 0) {
        ChatScrollState.skipNextScrollEvent = true;
        window.scrollTo({
          top: document.documentElement.scrollHeight + 1000,
          behavior: "instant",
        });
      }
    }, [props.messageHistory]);
  
    useEffect(() => {
      const getSignedUrls = async () => {
        if (props.configuration?.files as ImageFile[]) {
          const files: ImageFile[] = [];
          for await (const file of props.configuration?.files ?? []) {
            const signedUrl = await getSignedUrl(file.key);
            files.push({
              ...file,
              url: signedUrl,
            });
          }
  
          setFiles(files);
        }
      };
  
      if (props.configuration.files?.length) {
        getSignedUrls();
      }
    }, [props.configuration]);
  
    const hasImagesInChatHistory = function (): boolean {
      return (
        messageHistoryRef.current.filter(
          (x) =>
            x.type == ChatBotMessageType.Human &&
            x.metadata?.files &&
            (x.metadata.files as object[]).length > 0
        ).length > 0
      );
    };
  
    const handleSendMessage = () => {
      if (!state.selectedModel) return;
      if (props.running) return;
      if (readyState !== ReadyState.OPEN) return;
      ChatScrollState.userHasScrolled = false;
  
      const { name, provider } = OptionsHelper.parseValue(
        state.selectedModel.value
      );
      // change it here next if that doesnt work
      
      
      
      
      // const value = state.value.trim() + "For the above text" + props.apiPrompt
      // check if this is the first time sending the prompt

      let value: string;

      if(props.task.sendPromptOnlyOnce && props.messageHistory.length > 0){
         value = "Text:  \"" + state.value.trim() + "\"."
      }
      else {
        if(props.task.name === "translate"){
         value = props.apiPrompt + "Text:  \"" + state.value.trim() + "\"\n" + "\n Translate the above text too [Target Language]: \"" + selectedLanguage.label + "\"."
      }
      else{
        value = props.apiPrompt + "Text:  \"" + state.value.trim() + "\"."
        }
      }

      if (props.messageHistory.length < 1){
        value = props.task.name + " - " + value;
      }
      console.log('value after task and message length', value)
      // if the selected lanuage is not null then append it here
      // props.initialPrompt;

      // adding curent date for context 
      let dateTime = new Date().toLocaleString();
      value = value + "\n\nFor more context here is the current date and time: " + dateTime;
      console.log('value after datetime', value);

      const request: ChatBotRunRequest = {
        action: ChatBotAction.Run,
        modelInterface:
          (props.configuration.files && props.configuration.files.length > 0) ||
          (hasImagesInChatHistory() &&
            state.selectedModelMetadata?.inputModalities.includes(
              ChabotInputModality.Image
            ))
            ? "multimodal"
            : (state.selectedModelMetadata!.interface as ModelInterface),
        data: {
          mode: ChatBotMode.Chain,
          text: value, // includes all of the prompt (even hardcoded)
          files: props.configuration.files ?? [],
          modelName: "Smart Model",
          // modelName: name,
          // modelId: state?.models?.find((obj: any) => obj.name === name)?.modelId || null,
          modelId: "meta_model_as_db_supersecret_id", 
          provider: "bedrock",
          sessionId: props.session.id,
          workspaceId: state.selectedWorkspace?.value,
          modelKwargs: {
            streaming: props.configuration.streaming,
            maxTokens: props.configuration.maxTokens,
            temperature: props.configuration.temperature,
            topP: props.configuration.topP,
          },
        },
      };
      console.log(request);
      console.log('value within data', value); // this has users attached
      const newValue = value.match(/Text:\s*(.*)/)?.[1] || '';
      console.log('new value', newValue);
      // adds user input to state 
      setState((state) => ({
        ...state,
        value: "",
      }));
      setFiles([]);
      console.log('state', state); 
  
      props.setConfiguration({
        ...props.configuration,
        files: [],
      });
  
      props.setRunning(true);
      messageHistoryRef.current = [
        ...messageHistoryRef.current,

        {
          type: ChatBotMessageType.Human, //runniing the chatbot conversation
           content:  newValue , // testing - SARAH 
          //content: value + "For the above text " + props.apiPrompt, // added in props.initialprompt here
          metadata: {
            ...props.configuration,
          },
          tokens: [],
        },
        {
          type: ChatBotMessageType.AI,
          tokens: [],
          content: "",
          metadata: {},
        },
      ];
  
      props.setMessageHistory(messageHistoryRef.current);
  
      API.graphql({
        query: sendQuery,
        variables: {
          data: JSON.stringify(request),
        },
      });
  
      // change here to set readonly to false after sending 
      if (isReadOnly) {
        setIsReadOnly(false);  // Allow editing after the first send
    }
    };
  
    const connectionStatus = {
      [ReadyState.CONNECTING]: "Connecting",
      [ReadyState.OPEN]: "Open",
      [ReadyState.CLOSING]: "Closing",
      [ReadyState.CLOSED]: "Closed",
      [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState];
  
    const modelsOptions = OptionsHelper.getSelectOptionGroups(state.models ?? []);
  
    const workspaceOptions = [
      ...workspaceDefaultOptions,
      ...OptionsHelper.getSelectOptions(state.workspaces ?? []),
    ];

     // Extract the part after "Text:"
     // sarah testing
    // let extractedPrompt = value;
    // const textIndex = value.indexOf("Text:");
    // if (textIndex !== -1) {
    //   extractedPrompt = value.substring(textIndex + 5).trim();
    // }
    // console.log("extractedPrompt" + extractedPrompt);

    // State to keep track of the selected language
    // {props.initialPrompt}

    //  console.log("Selected Language:" , detail.selectedOption.label); 
    // const shouldDisplaySelect = props.task.name.includes('translate');
    //console.log('initial prompt', props.initialPrompt); - instructions 
    //console.log('value after', state.value); - empty 
    return (
      <SpaceBetween direction="vertical" size="l">
        <div className={styles.non_editable_prompt} aria-readonly={isReadOnly}>
            {props.initialPrompt}
        </div>
       
          {props.task.name === "translate" && (<Select
          placeholder="Select a language"
          options={languageList}
          selectedOption={selectedLanguage}
          onChange={({ detail }) => setSelectedLanguage(detail.selectedOption)}
          empty="No languages available"
          />)}
     
        
        <Container>
          <div className={styles.input_textarea_container}>
            <SpaceBetween size="xxs" direction="horizontal" alignItems="center">
              {browserSupportsSpeechRecognition ? (
                <Button
                  iconName={listening ? "microphone-off" : "microphone"}
                  variant="icon"
                  onClick={() =>
                    listening
                      ? SpeechRecognition.stopListening()
                      : SpeechRecognition.startListening()
                  }
                />
              ) : (
                <Icon name="microphone-off" variant="disabled" />
              )}
              {state.selectedModelMetadata?.inputModalities.includes(
                ChabotInputModality.Image
              ) && (
                <Button
                  variant="icon"
                  onClick={() => setImageDialogVisible(true)}
                  iconSvg={
                    <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
                      <rect
                        x="2"
                        y="2"
                        width="19"
                        height="19"
                        rx="2"
                        ry="2"
                      ></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  }
                ></Button>
              )}
            </SpaceBetween>
            <ImageDialog
              sessionId={props.session.id}
              visible={imageDialogVisible}
              setVisible={setImageDialogVisible}
              configuration={props.configuration}
              setConfiguration={props.setConfiguration}
            />
            
            <TextareaAutosize
              className={styles.input_textarea}
              // maybe try here - SARAH
              value={state.value} // added here so the value in the  component is bound to state
              // readOnly={isReadOnly}
              maxRows={6}
              minRows={1}
              spellCheck={true}
              autoFocus
              onChange={(e) =>
                setState((state) => ({ ...state, value: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key == "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              
              placeholder={listening ? "Listening..." : props.instructions }
              // "Send a message"
            />
            <div style={{ marginLeft: "8px" }}>
              {state.selectedModelMetadata?.inputModalities.includes(
                ChabotInputModality.Image
              ) &&
                files.length > 0 &&
                files.map((file, idx) => (
                  <img
                    key={idx}
                    onClick={() => setImageDialogVisible(true)}
                    src={file.url}
                    style={{
                      borderRadius: "4px",
                      cursor: "pointer",
                      maxHeight: "30px",
                      float: "left",
                      marginRight: "8px",
                    }}
                  />
                ))}
              <Button
                disabled={
                  readyState !== ReadyState.OPEN ||
                  !state.models?.length ||
                  !state.selectedModel ||
                  props.running ||
                  state.value.trim().length === 0 ||
                  props.session.loading
                }
                onClick={handleSendMessage}
                iconAlign="right"
                iconName={!props.running ? "angle-right-double" : undefined}
                variant="primary"
              >
                {props.running ? (
                  <>
                    Loading&nbsp;&nbsp;
                    <Spinner />
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </div>
        </Container>
        <div className={styles.input_controls}>
          <div
            className={
              appContext?.config.rag_enabled
                ? styles.input_controls_selects_2
                : styles.input_controls_selects_1
            }
          >
            <Select
              disabled={props.running}
              statusType={state.modelsStatus}
              loadingText="Loading models (might take few seconds)..."
              placeholder="Select a model"
              empty={
                <div>
                  No models available. Please make sure you have access to Amazon
                  Bedrock or alternatively deploy a self hosted model on SageMaker
                  or add API_KEY to Secrets Manager
                </div>
              }
              filteringType="auto"
              selectedOption={state.selectedModel}
              onChange={({ detail }) => {
                setState((state) => ({
                  ...state,
                  selectedModel: detail.selectedOption,
                  selectedModelMetadata: getSelectedModelMetadata(
                    state.models,
                    detail.selectedOption
                  ),
                }));
                if (detail.selectedOption?.value) {
                  StorageHelper.setSelectedLLM(detail.selectedOption.value);
                }
              }}
              options={modelsOptions}
            />

            {/* {appContext?.config.rag_enabled && ( SARAH - im hididng this right now bc workspaces dont work in tasks
              <Select
                disabled={
                  props.running || !state.selectedModelMetadata?.ragSupported
                }
                loadingText="Loading workspaces (might take few seconds)..."
                statusType={state.workspacesStatus}
                placeholder="Select a workspace (RAG data source)"
                filteringType="auto"
                selectedOption={state.selectedWorkspace}
                options={workspaceOptions}
                onChange={({ detail }) => {
                  if (detail.selectedOption?.value === "__create__") {
                    navigate("/rag/workspaces/create");
                  } else {
                    setState((state) => ({
                      ...state,
                      selectedWorkspace: detail.selectedOption,
                    }));
  
                    StorageHelper.setSelectedWorkspaceId(
                      detail.selectedOption?.value ?? ""
                    );
                  }
                }}
                empty={"No Workspaces available"}
              />
            )} */}
          </div>
          <div className={styles.input_controls_right}>
            <SpaceBetween direction="horizontal" size="xxs" alignItems="center">
              <div style={{ paddingTop: "1px" }}>
                <ConfigDialog
                  sessionId={props.session.id}
                  visible={configDialogVisible}
                  setVisible={setConfigDialogVisible}
                  configuration={props.configuration}
                  setConfiguration={props.setConfiguration}
                />
                <Button
                  iconName="settings"
                  variant="icon"
                  onClick={() => setConfigDialogVisible(true)}
                />
              </div>
              <StatusIndicator
                type={
                  readyState === ReadyState.OPEN
                    ? "success"
                    : readyState === ReadyState.CONNECTING ||
                      readyState === ReadyState.UNINSTANTIATED
                    ? "in-progress"
                    : "error"
                }
              >
                {readyState === ReadyState.OPEN ? "Connected" : connectionStatus}
              </StatusIndicator>
            </SpaceBetween>
          </div>
        </div>
      </SpaceBetween>
    );
  }
  
  function getSelectedWorkspaceOption(
    workspaces: Workspace[]
  ): SelectProps.Option | null {
    let selectedWorkspaceOption: SelectProps.Option | null = null;
  
    const savedWorkspaceId = StorageHelper.getSelectedWorkspaceId();
    if (savedWorkspaceId) {
      const targetWorkspace = workspaces.find((w) => w.id === savedWorkspaceId);
  
      if (targetWorkspace) {
        selectedWorkspaceOption = OptionsHelper.getSelectOptions([
          targetWorkspace,
        ])[0];
      }
    }
  
    if (!selectedWorkspaceOption) {
      selectedWorkspaceOption = workspaceDefaultOptions[0];
    }
  
    return selectedWorkspaceOption;
  }
  
  function getSelectedModelOption(models: Model[], defaultModel:string = ''): SelectProps.Option | null {
    let selectedModelOption: SelectProps.Option | null = null;
    let savedModel = StorageHelper.getSelectedLLM();

    if(defaultModel){
    savedModel = defaultModel;
  }
  
    if (savedModel) {
      const savedModelDetails = OptionsHelper.parseValue(savedModel);
      const targetModel = models.find(
        (m) =>
          m.name === savedModelDetails.name &&
          m.provider === savedModelDetails.provider
      );
  
      if (targetModel) {
        selectedModelOption = OptionsHelper.getSelectOptionGroups([
          targetModel,
        ])[0].options[0];
      }
    }

  
  
    let candidate: Model | undefined = undefined;
    if (!selectedModelOption) {
      const bedrockModels = models.filter((m) => m.provider === "bedrock");
      const sageMakerModels = models.filter((m) => m.provider === "sagemaker");
      const openAIModels = models.filter((m) => m.provider === "openai");
  
      candidate = bedrockModels.find((m) => m.name === "anthropic.claude-v2");
      if (!candidate) {
        candidate = bedrockModels.find((m) => m.name === "anthropic.claude-v1");
      }
  
      // CHANGE IN HERE FOR DEFAULT TO BE SMART MODEL 
      if (!candidate) {
        candidate = bedrockModels.find(
          (m) => m.name === "amazon.titan-tg1-large"
        );
      }
  
      if (!candidate) {
        candidate = bedrockModels.find((m) => m.name.startsWith("amazon.titan-"));
      }
  
      if (!candidate && sageMakerModels.length > 0) {
        candidate = sageMakerModels[0];
      }
  
      if (openAIModels.length > 0) {
        if (!candidate) {
          candidate = openAIModels.find((m) => m.name === "gpt-4");
        }
  
        if (!candidate) {
          candidate = openAIModels.find((m) => m.name === "gpt-3.5-turbo-16k");
        }
      }
  
      if (!candidate && bedrockModels.length > 0) {
        candidate = bedrockModels[0];
      }
  
      if (candidate) {
        selectedModelOption = OptionsHelper.getSelectOptionGroups([candidate])[0]
          .options[0];
      }
    }
  
    return selectedModelOption;
  }
  