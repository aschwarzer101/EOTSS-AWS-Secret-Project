import {
  SideNavigation,
  SideNavigationProps,
} from "@cloudscape-design/components";
import useOnFollow from "../common/hooks/use-on-follow";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import { AppContext } from "../common/app-context";
import { useContext, useState } from "react";
import { CHATBOT_NAME } from "../common/constants";




export default function NavigationPanel() {
  const appContext = useContext(AppContext);
  const onFollow = useOnFollow();
  const [navigationPanelState, setNavigationPanelState] =
    useNavigationPanelState();
  const [items] = useState<SideNavigationProps.Item[]>(() => {
    const items: SideNavigationProps.Item[] = [
      {
        type: "link",
        text: "Home",
        href: "/",
      },
      {
        type: "section",
        text: "Experiment With AI",
        items: [
          { type: "link", text: "Playground", href: "/chatbot/playground" },
          {
            type: "link",
            text: "Compare Models",
            href: "/chatbot/playground",
          },
          {
            type: "link",
            text: "Sessions",
            href: "/chatbot/sessions",
          },
          {
            type: "link",
            text: "Models",
            href: "/chatbot/models",
          },
        ],
      },
      {
        type: "section",
        text: "Explore AI Solutions",
        items: [
          { type: "link", text: "Draft A Memo", href: "/chatbot/playground" },
          {
            type: "link",
            text: "Summarize Text",
            href: "/chatbot/playground",
          },
          {
            type: "link",
            text: "Translate",
            href: "/chatbot/playground",
          },
        ],
      },
      {
        type: "section",
        text: "Create",
        items: [
          { type: "link", text: "Workspaces", href: "/chatbot/playground" },
          {
            type: "link",
            text: "Storage",
            href: "/chatbot/playground",
          },
          {
            type: "link",
            text: "Embeddings",
            href: "/chatbot/playground",
          },
        ],
      },
    ];

    if (appContext?.config.rag_enabled) {
      const crossEncodersItems: SideNavigationProps.Item[] = appContext?.config
        .cross_encoders_enabled
        ? [
            {
              type: "link",
              text: "Cross-encoders",
              href: "/rag/cross-encoders",
            },
          ]
        : [];

      items.push({
        type: "section",
        text: "Retrieval-Augmented Generation (RAG)",
        items: [
          { type: "link", text: "Dashboard", href: "/rag" },
          {
            type: "link",
            text: "Semantic search",
            href: "/rag/semantic-search",
          },
          { type: "link", text: "Workspaces", href: "/rag/workspaces" },
          {
            type: "link",
            text: "Embeddings",
            href: "/rag/embeddings",
          },
          ...crossEncodersItems,
          { type: "link", text: "Engines", href: "/rag/engines" },
        ],
      });
    }

    items.push(
      { type: "divider" },
      {
        type: "link",
        text: "Documentation",
        href: "https://aws-samples.github.io/aws-genai-llm-chatbot/",
        external: true,
      }
    );

    return items;
  });

  const onChange = ({
    detail,
  }: {
    detail: SideNavigationProps.ChangeDetail;
  }) => {
    const sectionIndex = items.indexOf(detail.item);
    setNavigationPanelState({
      collapsedSections: {
        ...navigationPanelState.collapsedSections,
        [sectionIndex]: !detail.expanded,
      },
    });
  };

  return (
    <SideNavigation
      onFollow={onFollow}
      onChange={onChange}
      header={{ href: "/", text: CHATBOT_NAME }}
      items={items.map((value, idx) => {
        if (value.type === "section") {
          const collapsed =
            navigationPanelState.collapsedSections?.[idx] === true;
          value.defaultExpanded = !collapsed;
        }

        return value;
      })}
    />
  );
}
