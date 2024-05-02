
import {
  SideNavigation,
  SideNavigationProps,
  Header,
} from "@cloudscape-design/components";
import useOnFollow from "../common/hooks/use-on-follow";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import { AppContext } from "../common/app-context";
import { useContext, useState, useEffect } from "react";
import { CHATBOT_NAME } from "../common/constants";
import { ApiClient } from "../common/api-client/api-client";
import RouterButton from "../components/wrappers/router-button";
import { Auth } from "aws-amplify";
import { v4 as uuidv4 } from "uuid";
import TaskPriming from "./chatbot/task";

export default function NavigationPanel() {
  const appContext = useContext(AppContext);
  const onFollow = useOnFollow();
  const apiClient = new ApiClient(appContext);
  const [navigationPanelState, setNavigationPanelState] = useNavigationPanelState();
  const [sessions, setSessions] = useState<any[]>([]);
  const [items, setItems] = useState<SideNavigationProps.Item[]>([]);

  useEffect(() => {
    async function loadSessions() {
      let username;
      await Auth.currentAuthenticatedUser().then((value) => username = value.username);
      if (username) {
        const fetchedSessions = await apiClient.sessions.getSessions();
        if (fetchedSessions.data && fetchedSessions.data.listSessions) {
          const listedSessions = fetchedSessions.data.listSessions.slice(0,5); 
          // updateItems(fetchedSessions);
          setSessions(listedSessions);
          updateItems(listedSessions); 
        }
      }
      // note from rudra - I commented this out bc the types don't match and I just really
      // needed to deploy! sorry alayna :)
      
      // B4 setSessions(fetchedSessions);
      // B4updateItems(fetchedSessions);
    }
     loadSessions(); 
  }, [apiClient]);

  const updateItems = (sessions: any[]) => {
    // const sessionItems = sessions.map(session => ({
    //   type: "link", 
    //   text: '${session.title}' , 
    //   href: '/chatbot/playground/${session.id}', 
    // }) as SideNavigationProps.Item); 

    const baseItems: SideNavigationProps.Item[] = [
      // { type: "link", text: "Home", href: "/" },
      { type: "link", text: "", href: "/", info: <RouterButton
          iconName="add-plus"
          variant="primary"
          href={`/chatbot/playground/${uuidv4()}`}
        >
          New session
        </RouterButton> },
      {
        type: "section",
        text: "Experiment With AI",
        items: [
          { type: "link", text: "Playground", href: "/chatbot/playground" },
          { type: "link", text: "Compare Models", href: "/chatbot/multichat" },
          { type: "link", text: "Sessions", href: "/chatbot/sessions" },
          { type: "link", text: "Models", href: "/chatbot/models" },
        ],
      },
      {
        type: "section",
        text: "Session History",
        items: sessions.map(session => ({
          type: "link", 
          text: `Session ${session.title.summarize}`,
          href: `/chatbot/playground/${session.id}`,
        })),
      },
      {
        type: "section",
        text: "Explore AI Solutions",
        items: [
          { type: "link", text: "Draft A Memo", href: `/chatbot/playground?prompt=${encodeURIComponent(TaskPriming("memo").instructions)}`},
          { type: "link", text: "Summarize Text", href: `/chatbot/playground?prompt=${encodeURIComponent(TaskPriming("summarize").instructions)}`},
          { type: "link", text: "Translate", href: `/chatbot/playground?prompt=${encodeURIComponent(TaskPriming("translate").instructions)}` },
        ],
      },
    ];

    if (appContext?.config.rag_enabled) {
 
    }
    setItems(baseItems);
  };

  const onChange = ({
    detail,
  }: {
    detail: SideNavigationProps.ChangeDetail;
  }) => {
    // const sectionIndex = items.findIndex(item => item.text === detail.item.text);
    const sectionIndex = items.indexOf(detail.item);
    setNavigationPanelState({
      collapsedSections: {
        ...navigationPanelState.collapsedSections,
        [sectionIndex]: !detail.expanded,
      },
    });
  };

  return (
    <div>
      <Header>
        <RouterButton
          iconName="add-plus"
          variant="primary"
          href={`/chatbot/playground/${uuidv4()}`}
        >
          New session
        </RouterButton>
      </Header>
    <SideNavigation
      onFollow={onFollow}
      onChange={onChange}
      header={{ href: "/", text: CHATBOT_NAME }}
      items = {items}
        />
        </div>
  ); 
}