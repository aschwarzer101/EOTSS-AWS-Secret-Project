import {
    SideNavigation,
    SideNavigationProps,
    Header,
} from "@cloudscape-design/components";
import useOnFollow from "../common/hooks/use-on-follow";
import {useNavigationPanelState} from "../common/hooks/use-navigation-panel-state";
import {AppContext} from "../common/app-context";
import {useContext, useState, useEffect} from "react";
import {CHATBOT_NAME} from "../common/constants";
import {ApiClient} from "../common/api-client/api-client";
import RouterButton from "../components/wrappers/router-button";
import {Auth} from "aws-amplify";
import {v4 as uuidv4} from "uuid";
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
                    const sortedSessions = fetchedSessions.data.listSessions.sort((a, b) =>
                        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                    );
                    const listedSessions = sortedSessions.slice(0, 5);
                    setSessions(listedSessions);
                    updateItems(listedSessions);
                }
            }
            // note from rudra - I commented this out bc the types don't match and I just really
            // needed to deploy! sorry alayna :)

            // B4 setSessions(fetchedSessions);
            // B4 updateItems(fetchedSessions);
        }

        loadSessions();
    }, [apiClient]);


    function truncateText(text, limit) {
        const words = text.split(' ');
        if (words.length > limit) {
            return words.slice(0, limit).join(' ') + '...';
        }
        return text;
    }

    const updateItems = (sessions: any[]) => {
        // const sessionItems = sessions.map(session => ({
        //   type: "link",
        //   text: '${session.title}' ,
        //   href: '/chatbot/playground/${session.id}',
        // }) as SideNavigationProps.Item);

        const baseItems: SideNavigationProps.Item[] = [
            // { type: "link", text: "Home", href: "/" },
            {
                type: "link", text: "", href: "/", info: <RouterButton
                    iconName="add-plus"
                    variant="primary"
                    href={`/chatbot/playground/${uuidv4()}`}
                >
                    New session
                </RouterButton>
            },
            {
                type: "section",
                text: "Experiment With AI",
                items: [
                    {type: "link", text: "Playground", href: "/chatbot/playground"},
                    {type: "link", text: "Compare Models", href: "/chatbot/multichat"},
                    {type: "link", text: "Sessions", href: "/chatbot/sessions"},
                    {type: "link", text: "Models", href: "/chatbot/models"},
                ],
            },
            {
                type: "section",
                text: "Chat History",
                items: sessions.map((session, index) => ({
                    type: "link",
                    text: `${truncateText(session.title || 'Untitled Session', 8)}<br><span style='color:grey;'>${new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }).format(new Date(session.startTime))}</span>"`,
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
                })),
            },
            { // need to learn how to refresh with side-bar navigation
                type: "section",
                text: "Explore AI Solutions",
                items: [
                    {
                        type: "link",
                        text: "Draft A Memo",
                        href: `/chatbot/playground?prompt=${encodeURIComponent(TaskPriming("memo").prompt)}`
                    },
                    {
                        type: "link",
                        text: "Summarize Text",
                        href: `/chatbot/playground/${uuidv4()}?prompt=${encodeURIComponent(TaskPriming("summarize").prompt)}`
                    },
                    {
                        type: "link",
                        text: "Translate",
                        href: `/chatbot/playground/${uuidv4()}?prompt=${encodeURIComponent(TaskPriming("translate").prompt)}`
                    },
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
            {/* <Header>
        <RouterButton
          iconName="add-plus"
          variant="primary"
          href={`/chatbot/playground/${uuidv4()}`}
        >
          New session
        </RouterButton>
      </Header> */}
            <SideNavigation
                onFollow={onFollow}
                onChange={onChange}
                header={{href: "/", text: CHATBOT_NAME}}
                items={items}
            />
        </div>
    );
}