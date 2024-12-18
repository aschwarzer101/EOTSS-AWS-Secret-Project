import {
    Box,
    Button,
    Container,
    ExpandableSection,
    Popover,
    Spinner,
    StatusIndicator,
    Tabs,
    TextContent,
    Textarea,
    SpaceBetween,
    Input
} from "@cloudscape-design/components";
import {useEffect, useState} from "react";
import {JsonView, darkStyles} from "react-json-view-lite";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "../../styles/chat.module.scss";
import {
    ChatBotConfiguration,
    ChatBotHistoryItem,
    ChatBotMessageType,
    ImageFile,
    RagDocument,
} from "./types";

import {getSignedUrl} from "./utils";

import "react-json-view-lite/dist/index.css";
import "../../styles/app.scss";

export interface ChatMessageProps {
    message: ChatBotHistoryItem;
    configuration?: ChatBotConfiguration;
    showMetadata?: boolean;
    onThumbsUp: (message: string) => void;
    onThumbsDown: (message: string) => void;
}

export default function ChatMessage(props: ChatMessageProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const [message] = useState<ChatBotHistoryItem>(props.message);
    const [files, setFiles] = useState<ImageFile[]>([] as ImageFile[]);
    const [documentIndex, setDocumentIndex] = useState("0");
    const [promptIndex, setPromptIndex] = useState("0");
    const [selectedIcon, setSelectedIcon] = useState<1 | 0 | null>(null);
    const [showFeedbackBox, setShowFeedbackBox] = useState<boolean>(false);
    const [writtenFeedback, setWrittenFeedback] = useState<string>("");

    const getContentUpToForMore = (content) => {
        const phrase = "For more";
        const index = content.indexOf(phrase);
        if (index !== -1) {
          return content.substring(0, index).trim();
        }
        return content;
      };

    useEffect(() => {
        const getSignedUrls = async () => {
            setLoading(true);
            if (message.metadata?.files as ImageFile[]) {
                const files: ImageFile[] = [];
                for await (const file of message.metadata?.files as ImageFile[]) {
                    const signedUrl = await getSignedUrl(file.key);
                    files.push({
                    ...file,
                        url: signedUrl as string,
                    });
                }

                setLoading(false);
                setFiles(files);
            }
        };

        if (message.metadata?.files as ImageFile[]) {
            getSignedUrls();
        }
    }, [message]);

    const content =
        props.message.content && props.message.content.length > 0
            ? props.message.content
            : props.message.tokens?.map((v) => v.value).join("");
    console.log('chat message content', content);

    return (
        <div>
            {props.message?.type === ChatBotMessageType.AI && (
            <Container
                footer={
                ((props?.showMetadata && props.message.metadata) ||
                    (props.message.metadata &&
                    props.configuration?.showMetadata)) && (
                    <ExpandableSection variant="footer" headerText="Metadata">
                    <JsonView
                        shouldInitiallyExpand={(level) => level < 2}
                        data={JSON.parse(
                        JSON.stringify(props.message.metadata).replace(
                            /\\n/g,
                            "\\\\n"
                        )
                        )}
                        style={{
                        ...darkStyles,
                        stringValue: "jsonStrings",
                        numberValue: "jsonNumbers",
                        booleanValue: "jsonBool",
                        nullValue: "jsonNull",
                        container: "jsonContainer",
                        }}
                    />
                    {props.message.metadata.documents && (
                        <>
                        <div className={styles.btn_chabot_metadata_copy}>
                            <Popover
                            size="medium"
                            position="top"
                            triggerType="custom"
                            dismissButton={false}
                            content={
                                <StatusIndicator type="success">
                                Copied to clipboard
                                </StatusIndicator>
                            }
                            >
                            <Button
                                variant="inline-icon"
                                iconName="copy"
                                onClick={() => {
                                navigator.clipboard.writeText(
                                    (
                                    props.message.metadata
                                        .documents as RagDocument[]
                                    )[parseInt(documentIndex)].page_content
                                );
                                }}
                            />
                            </Popover>
                        </div>
                        <Tabs
                            tabs={(
                            props.message.metadata.documents as RagDocument[]
                            ).map((p: any, i) => {
                            return {
                                id: `${i}`,
                                label: p.metadata.path,
                                content: (
                                <>
                                    <Textarea
                                    value={p.page_content}
                                    readOnly={true}
                                    rows={8}
                                    />
                                </>
                                ),
                            };
                            })}
                            activeTabId={documentIndex}
                            onChange={({detail}) =>
                            setDocumentIndex(detail.activeTabId)
                            }
                        />
                        </>
                    )}
                    {props.message.metadata.prompts && (
                        <>
                        <div className={styles.btn_chabot_metadata_copy}>
                            <Popover
                            size="medium"
                            position="top"
                            triggerType="custom"
                            dismissButton={false}
                            content={
                                <StatusIndicator type="success">
                                Copied to clipboard
                                </StatusIndicator>
                            }
                            >
                            <Button
                                variant="inline-icon"
                                iconName="copy"
                                onClick={() => {
                                navigator.clipboard.writeText(
                                    (props.message.metadata.prompts as string[][])[
                                    parseInt(promptIndex)
                                    ][0]
                                );
                                }}
                            />
                            </Popover>
                        </div>
                        <Tabs
                            tabs={(props.message.metadata.prompts as string[][]).map(
                            (p, i) => {
                                return {
                                id: `${i}`,
                                label: `Prompt ${
                                    (props.message.metadata.prompts as string[][])
                                    .length > 1
                                    ? i + 1
                                    : ""
                                }`,
                                content: (
                                    <>
                                    <Textarea
                                        value={p[0]}
                                        readOnly={true}
                                        rows={8}
                                    />
                                    </>
                                ),
                                };
                            }
                            )}
                            activeTabId={promptIndex}
                            onChange={({detail}) =>
                            setPromptIndex(detail.activeTabId)
                            }
                        />
                        </>
                    )}
                    </ExpandableSection>
                )
                }
            >
                {content?.length === 0 ? (
                <Box>
                    <Spinner/>
                </Box>
                ) : null}
                {props.message.content.length > 0 ? (
                <div className={styles.btn_chabot_message_copy}>
                    <Popover
                    size="medium"
                    position="top"
                    triggerType="custom"
                    dismissButton={false}
                    content={
                        <StatusIndicator type="success">
                        Copied to clipboard
                        </StatusIndicator>
                    }
                    >
                    <Button
                        variant="inline-icon"
                        iconName="copy"
                        onClick={() => {
                        navigator.clipboard.writeText(props.message.content);
                        }}
                    />
                    </Popover>
                </div>
                ) : null}
                <ReactMarkdown
                children={content}
                remarkPlugins={[remarkGfm]}
                components={{
                    pre(props) {
                    const {children, ...rest} = props;
                    return (
                        <pre {...rest} className={styles.codeMarkdown}>
                {children}
              </pre>
                    );
                    },
                    table(props) {
                    const {children, ...rest} = props;
                    return (
                        <table {...rest} className={styles.markdownTable}>
                        {children}
                        </table>
                    );
                    },
                    th(props) {
                    const {children, ...rest} = props;
                    return (
                        <th {...rest} className={styles.markdownTableCell}>
                        {children}
                        </th>
                    );
                    },
                    td(props) {
                    const {children, ...rest} = props;
                    return (
                        <td {...rest} className={styles.markdownTableCell}>
                        {children}
                        </td>
                    );
                    },
                }}
                />
                <div className={styles.thumbsContainer}>
                {(selectedIcon === 1 || selectedIcon === null) && (
                    <Button
                    variant="icon"
                    iconName={selectedIcon === 1 ? "thumbs-up-filled" : "thumbs-up"}
                    onClick={() => {
                        props.onThumbsUp("");
                        setSelectedIcon(1);
                    }}
                    />
                )}
                {(selectedIcon === 0 || selectedIcon === null) && !showFeedbackBox && (
                    <Button
                    iconName={
                        selectedIcon === 0 ? "thumbs-down-filled" : "thumbs-down"
                    }
                    variant="icon"
                    onClick={() => {
                        // props.onThumbsDown("Hi!, this is DB testing!");
                        setShowFeedbackBox(true);
                        setSelectedIcon(0);
                    }}
                    />
                )}
                {showFeedbackBox && <SpaceBetween size="xxs">
                    <Input
                    onChange={({detail}) => setWrittenFeedback(detail.value)}
                    placeholder="Please provide feedback"
                    onKeyDown={({detail}) => {
                        if (detail.key == "Enter") {
                        props.onThumbsDown(writtenFeedback)
                        setShowFeedbackBox(false);
                        }
                    }}
                    value={writtenFeedback}
                    ></Input>
                    <Button onClick={() => {
                        props.onThumbsDown(writtenFeedback);
                        setShowFeedbackBox(false);
                     }}>Submit</Button>
                </SpaceBetween>}
                </div>
            </Container>
            )}
            {loading && (
            <Box float="left">
                <Spinner/>
            </Box>
            )}
            {files && !loading && (
            <>
                    {files.map((file, idx) => (
                        <a
                            key={idx}
                            href={file.url as string}
                            target="_blank"
                            rel="noreferrer"
                            style={{marginLeft: "5px", marginRight: "5px"}}
                        >
                            <img
                                src={file.url as string}
                                className={styles.img_chabot_message}
                            />
                        </a>
                    ))}
                </>
            )}

            {props.message?.type === ChatBotMessageType.Human && (
                <div className={styles.chat_message_container}>
                    <div className={styles.input_message}>
                        {getContentUpToForMore(props.message.content)}
                    </div>
                </div>
            )}
        </div>
    );
}
