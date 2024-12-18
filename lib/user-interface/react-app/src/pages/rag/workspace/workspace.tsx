import {
  BreadcrumbGroup,
  Button,
  ContentLayout,
  Flashbar,
  Header,
  SpaceBetween,
  StatusIndicator,
  Tabs,
} from "@cloudscape-design/components";
import useOnFollow from "../../../common/hooks/use-on-follow";
import BaseAppLayout from "../../../components/base-app-layout";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCallback, useContext, useEffect, useState } from "react";
import { AppContext } from "../../../common/app-context";
import { ApiClient } from "../../../common/api-client/api-client";
import { Utils } from "../../../common/utils";
import RouterButton from "../../../components/wrappers/router-button";
import RouterButtonDropdown from "../../../components/wrappers/router-button-dropdown";
import AuroraWorkspaceSettings from "./aurora-workspace-settings";
import DocumentsTab from "./documents-tab";
import OpenSearchWorkspaceSettings from "./open-search-workspace-settings";
import KendraWorkspaceSettings from "./kendra-workspace-settings";
import { CHATBOT_NAME } from "../../../common/constants";
import { Workspace } from "../../../API";
import { v4 as uuidv4 } from 'uuid'; //sarah testing

export default function WorkspacePane() {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const onFollow = useOnFollow();
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "file");
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | undefined | null>(
    null
  );
  // Sarah testing
  const [sessions, setSessions] = useState<any[]>([]); // Assuming sessions is an array of session objects


  const getWorkspace = useCallback(async () => {
    if (!appContext || !workspaceId) return;

    const apiClient = new ApiClient(appContext);
    try {
      const result = await apiClient.workspaces.getWorkspace(workspaceId);
      if (!result.data?.getWorkspace) {
        navigate("/rag/workspaces");
        return;
      }
      setWorkspace(result.data!.getWorkspace);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, [appContext, navigate, workspaceId]);

  useEffect(() => {
    getWorkspace();
  }, [getWorkspace]);

  const showTabs = !workspace?.kendraIndexExternal;
  const disabledTabs =
    workspace?.engine === "kendra" ? ["qna", "website", "rssfeed"] : [];

  function truncateText(text, charLimit) {
      let cleanText = text.replace(/[^a-zA-Z0-9\s]/g, '');
      cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
      if (cleanText.length > charLimit) {
          return cleanText.substring(0, charLimit) + ' [...]';
      }
      return cleanText;
  }
  
  // SARAH testing 
  const handleNavigateBack = async () => {
    console.log('nav back');
    navigate(`/chatbot/playground`);
    console.log('navigating to playground');
  };

  // SARAH - note: this works but now we want to initialize the session with the recently created workspace


    // SARAH -- this navigates back to the most recent session
    // try {
    //   const apiClient = new ApiClient(appContext);
    //   const fetchedSessions = await apiClient.sessions.getSessions();
    //   const sessions = fetchedSessions.data?.listSessions || [];
    //   console.log('fetched within workspace sessions', sessions);
      
    //   if (sessions.length > 0) {
    //     console.log('within session length');
    //     console.log('sessions', sessions);
    //     const mostRecentSession = sessions.reduce((latest, session) => {
    //       return new Date(session.startTime) > new Date(latest.startTime) ? session : latest;
    //     }, sessions[0]);
    //     navigate(`/chatbot/playground/${mostRecentSession.id}`);
    //     console.log('navigating to most recent session');
    //   } else {
    //     navigate('/chatbot/playground');
    //   }
    // } catch (error) {
    //   console.error('Error fetching sessions:', error);
    //   navigate('/chatbot/playground');
    // }
  //};

  const items = loading
    ? [{ type: "link", text: "Loading...", href: "#" }]
    : sessions.length > 0
    ? sessions.map((session) => ({
        type: "link",
        text: `${truncateText(session.title || 'Untitled Session', 35)} - ${new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(new Date(session.startTime))}`,
        href: `/chatbot/playground/${session.id}`,
        tooltip: `Time Created: ${new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(new Date(session.startTime))}`
      }))
    : [{ type: "link", text: "No sessions available", href: "#" }];


  return (
    <BaseAppLayout
      contentType="cards"
      breadcrumbs={
        <BreadcrumbGroup
          onFollow={onFollow}
          items={[
            {
              text: CHATBOT_NAME,
              href: "/",
            },
            {
              text: "RAG",
              href: "/rag",
            },
            {
              text: "Workspaces",
              href: "/rag/workspaces",
            },
            {
              text: workspace?.name || "",
              href: `/rag/workspaces/${workspace?.id}`,
            },
          ]}
        />
      }
      content={
        <ContentLayout
          header={
            <Header
              variant="h1"
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={handleNavigateBack}
                    variant="normal"
                    iconName="arrow-left"
                  >
                    Go Back
                  </Button>
                  <RouterButton
                    href={`/rag/semantic-search?workspaceId=${workspaceId}`}
                  >
                    Semantic search
                  </RouterButton>
                  <RouterButtonDropdown
                    items={[
                      {
                        id: "upload-file",
                        text: "Upload files",
                        href: `/rag/workspaces/add-data?tab=file&workspaceId=${workspaceId}`,
                      },
                      {
                        id: "add-text",
                        text: "Add texts",
                        href: `/rag/workspaces/add-data?tab=text&workspaceId=${workspaceId}`,
                      },
                      {
                        id: "add-qna",
                        text: "Add Q&A",
                        href: `/rag/workspaces/add-data?tab=qna&workspaceId=${workspaceId}`,
                      },
                      {
                        id: "crawl-website",
                        text: "Crawl website",
                        href: `/rag/workspaces/add-data?tab=website&workspaceId=${workspaceId}`,
                      },
                      {
                        id: "add-rss-subscription",
                        text: "Add RSS subscription",
                        href: `/rag/workspaces/add-data?tab=rssfeed&workspaceId=${workspaceId}`,
                      },
                    ]}
                  >
                    Add data
                  </RouterButtonDropdown>
                </SpaceBetween>
              }
            >
              {loading ? (
                <StatusIndicator type="loading">Loading...</StatusIndicator>
              ) : (
                workspace?.name
              )}
            </Header>
          }
        >
          <SpaceBetween size="l">
            {workspace && workspace.engine === "aurora" && (
              <AuroraWorkspaceSettings workspace={workspace} />
            )}
            {workspace && workspace.engine === "opensearch" && (
              <OpenSearchWorkspaceSettings workspace={workspace} />
            )}
            {workspace && workspace.engine === "kendra" && (
              <KendraWorkspaceSettings workspace={workspace} />
            )}
            {workspace?.kendraIndexExternal && (
              <Flashbar
                items={[
                  {
                    type: "info",
                    content: (
                      <>
                        Data upload is not available for external Kendra indexes
                      </>
                    ),
                  },
                ]}
              />
            )}
            {workspace && showTabs && (
              <Tabs
                tabs={[
                  {
                    label: "Files",
                    id: "file",
                    content: (
                      <DocumentsTab
                        workspaceId={workspaceId}
                        documentType="file"
                      />
                    ),
                  },
                  {
                    label: "Texts",
                    id: "text",
                    content: (
                      <DocumentsTab
                        workspaceId={workspaceId}
                        documentType="text"
                      />
                    ),
                  },
                  {
                    label: "Q&A",
                    id: "qna",
                    disabled: disabledTabs.includes("qna"),
                    content: (
                      <DocumentsTab
                        workspaceId={workspaceId}
                        documentType="qna"
                      />
                    ),
                  },
                  {
                    label: "Websites",
                    id: "website",
                    disabled: disabledTabs.includes("website"),
                    content: (
                      <DocumentsTab
                        workspaceId={workspaceId}
                        documentType="website"
                      />
                    ),
                  },
                  {
                    label: "RSS Feeds",
                    id: "rssfeed",
                    disabled: disabledTabs.includes("rssfeed"),
                    content: (
                      <DocumentsTab
                        workspaceId={workspaceId}
                        documentType="rssfeed"
                      />
                    ),
                  },
                ]}
                activeTabId={activeTab}
                onChange={({ detail: { activeTabId } }) => {
                  setActiveTab(activeTabId);
                  setSearchParams((current) => ({
                    ...Utils.urlSearchParamsToRecord(current),
                    tab: activeTabId,
                  }));
                }}
              />
            )}
          </SpaceBetween>
        </ContentLayout>
      }
    />
  );
}
