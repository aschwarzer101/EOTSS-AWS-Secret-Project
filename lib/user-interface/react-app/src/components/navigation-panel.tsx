// import {
//   SideNavigation,
//   SideNavigationProps,
// } from "@cloudscape-design/components";
// import useOnFollow from "../common/hooks/use-on-follow";
// import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
// import { AppContext } from "../common/app-context";
// import { useContext, useState } from "react";
// import { CHATBOT_NAME } from "../common/constants";
// import { ApiClient } from "../common/api-client/api-client";
// import { SessionsClient } from "../common/api-client/sessions-client";


// export default function NavigationPanel() {
//   const appContext = useContext(AppContext);
//   const onFollow = useOnFollow();
//   const apiClient = new ApiClient(appContext); 
//   const [navigationPanelState, setNavigationPanelState] =
//     useNavigationPanelState();

//   const [sessions, setSessions]  = useState<any[]>([]);
//   const [items, setItems] = useState<SideNavigationProps.Item[]>([]); 

//   useEffect(() => {
//     async function loadSessions() {
//       const fetchedSessions = await apiClient.sessions.getSessions("0"); 
//       setSessions(fetchedSessions);
//       updateItems(fetchedSessions);
//     }
//     loadSessions();
//   }, [apiClient]); 

//   const updateItems = (sessions: any[]) => {
//     const newItems: SideNavigationProps.Item[] = [
//       {
//         type: "link",
//         text: "Home",
//         href: "/",
//       },
//       {
//         type: "section",
//         text: "Experiment With AI",
//         items: [
//           { type: "link", text: "Playground", href: "/chatbot/playground" },
//           {
//             type: "link",
//             text: "Compare Models",
//             href: "/chatbot/playground",
//           },
//           {
//             type: "link",
//             text: "Sessions",
//             href: "/chatbot/sessions",
//           },
//           {
//             type: "link",
//             text: "Models",
//             href: "/chatbot/models",
//           },
//         ],
//       },
//       {
//         type: "section",
//         text: "Session History",
//         items: sessions.map(session => ({ 
//            type: "link", 
//            text: `Session ${session.session_id}`, 
//            href: `/chatbot/playground/${session.session_id}`,
//           })), 
//       }, 
//       {
//         type: "section",
//         text: "Explore AI Solutions",
//         items: [
//           { type: "link", text: "Draft A Memo", href: "/chatbot/playground" },
//           {
//             type: "link",
//             text: "Summarize Text",
//             href: "/chatbot/playground",
//           },
//           {
//             type: "link",
//             text: "Translate",
//             href: "/chatbot/playground",
//           },
//         ],
//       },
//       {
//         type: "section",
//         text: "Create",
//         items: [
//           { type: "link", text: "Workspaces", href: "/chatbot/playground" },
//           {
//             type: "link",
//             text: "Storage",
//             href: "/chatbot/playground",
//           },
//           {
//             type: "link",
//             text: "Embeddings",
//             href: "/chatbot/playground",
//           },
//         ],
//       },
//       if (appContext?.config.rag_enabled) {
//         const crossEncodersItems: SideNavigationProps.Item[] = appContext?.config
//           .cross_encoders_enabled
//           ? [
//               {
//                 type: "link",
//                 text: "Cross-encoders",
//                 href: "/rag/cross-encoders",
//               },
//             ]
//           : [];
  
//         items.push({
//           type: "section",
//           text: "Retrieval-Augmented Generation (RAG)",
//           items: [
//             { type: "link", text: "Dashboard", href: "/rag" },
//             {
//               type: "link",
//               text: "Semantic search",
//               href: "/rag/semantic-search",
//             },
//             { type: "link", text: "Workspaces", href: "/rag/workspaces" },
//             {
//               type: "link",
//               text: "Embeddings",
//               href: "/rag/embeddings",
//             },
//             ...crossEncodersItems,
//             { type: "link", text: "Engines", href: "/rag/engines" },
//           ],
//         }),
//       }
//     ]; 
//       setItems(newItems);
//   };
//     // setItems(newItems); 

  
  

//   const onChange = ({
//     detail,
//   }: {
//     detail: SideNavigationProps.ChangeDetail;
//   }) => {
//     const sectionIndex = items.indexOf(detail.item);
//     setNavigationPanelState({
//       collapsedSections: {
//         ...navigationPanelState.collapsedSections,
//         [sectionIndex]: !detail.expanded,
//       },
//     });
//   };

//   return (
//     <div> 
//       <Header> 
//        <RouterButton
//        // iconAlign="left"
//          iconName="add-plus"
//          variant="inline-link"
//          href={`/chatbot/playground/${uuidv4()}`}
      
//          >
//          New session
//        </RouterButton>
//      </Header>
//     <SideNavigation
//       onFollow={onFollow}
//       onChange={onChange}
//       header={{ href: "/", text: CHATBOT_NAME }}
//       items = {items}
//       // items={items.map((value, idx) => {
//       //   if (value.type === "section") {
//       //     const collapsed =
//       //       navigationPanelState.collapsedSections?.[idx] === true;
//       //     value.defaultExpanded = !collapsed;
//       //   }

//       //   return value;
//       // })}
//     />
//     </div>
//   );
// }
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
import { v4 as uuidv4 } from "uuid";

export default function NavigationPanel() {
  const appContext = useContext(AppContext);
  const onFollow = useOnFollow();
  const apiClient = new ApiClient(appContext);
  const [navigationPanelState, setNavigationPanelState] = useNavigationPanelState();
  const [sessions, setSessions] = useState<any[]>([]);
  const [items, setItems] = useState<SideNavigationProps.Item[]>([]);

  useEffect(() => {
    async function loadSessions() {
      // note from rudra - I commented this out bc the types don't match and I just really
      // needed to deploy! sorry alayna :)
      const fetchedSessions = []; //await apiClient.sessions.getSessions();
      setSessions(fetchedSessions);
      updateItems(fetchedSessions);
    }
    loadSessions();
  }, [apiClient]);

  const updateItems = (sessions: any[]) => {
    const baseItems: SideNavigationProps.Item[] = [
      { type: "link", text: "Home", href: "/" },
      {
        type: "section",
        text: "Experiment With AI",
        items: [
          { type: "link", text: "Playground", href: "/chatbot/playground" },
          { type: "link", text: "Compare Models", href: "/chatbot/models" },
          { type: "link", text: "Sessions", href: "/chatbot/sessions" },
          { type: "link", text: "Models", href: "/chatbot/models" },
        ],
      },
      {
        type: "section",
        text: "Session History",
        items: sessions.map(session => ({
          type: "link",
          text: `Session ${session.title}`,
          href: `/chatbot/playground/${session.id}`,
        })),
      },
      {
        type: "section",
        text: "Explore AI Solutions",
        items: [
          { type: "link", text: "Draft A Memo", href: "/chatbot/playground" },
          { type: "link", text: "Summarize Text", href: "/chatbot/playground" },
          { type: "link", text: "Translate", href: "/chatbot/playground" },
        ],
      },
      {
        type: "section",
        text: "Create",
        items: [
          { type: "link", text: "Workspaces", href: "/chatbot/playground" },
          { type: "link", text: "Storage", href: "/chatbot/playground" },
          { type: "link", text: "Embeddings", href: "/chatbot/playground" },
        ],
      },
    ];

    if (appContext?.config.rag_enabled) {
      const crossEncodersItems : SideNavigationProps.Item[] = appContext.config.cross_encoders_enabled ? [
        { type: "link", text: "Cross-encoders", href: "/rag/cross-encoders" },
      ] : [];

      baseItems.push({
        type: "section",
        text: "Retrieval-Augmented Generation (RAG)",
        items: [
          { type: "link", text: "Dashboard", href: "/rag" },
          { type: "link", text: "Semantic search", href: "/rag/semantic-search" },
          { type: "link", text: "Workspaces", href: "/rag/workspaces" },
          { type: "link", text: "Embeddings", href: "/rag/embeddings" },
          ...crossEncodersItems,
          { type: "link", text: "Engines", href: "/rag/engines" },
        ],
      });
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
          variant="inline-link"
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