import {
  ContentLayout,
  Header,
  Cards,
  Container,
  SpaceBetween,
  Link,
  BreadcrumbGroup,
} from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import RouterButton from "../components/wrappers/router-button";
import useOnFollow from "../common/hooks/use-on-follow";
import { CHATBOT_NAME, languageList } from "../common/constants";
import { useHref } from "react-router-dom";
import { TaskOptions } from "../common/constants";
import TaskPriming from "../components/chatbot/task";
import {v4 as uuidv4} from "uuid";

export default function Welcome() {
  const onFollow = useOnFollow();

  return (
    <BaseAppLayout
      breadcrumbs={
        <BreadcrumbGroup
          onFollow={onFollow}
          items={[
            {
              text: CHATBOT_NAME,
              href: "/",
            },
          ]}
        />
      }
      content={
        <ContentLayout
          header={
            <Header
              variant="h1"
              description="Experiment and chat with different models. Compare and contrast their responses for your target uses. "
              actions={
                <RouterButton
                  iconAlign="right"
                  iconName="contact"
                  variant="primary"
                  href="/chatbot/playground"
                >
                  Getting Started
                </RouterButton>
              }
            >
              Sandbox Home
            </Header>
          }
        >
          <SpaceBetween size="l">
            <Cards
              cardDefinition={{
                header: (item) => (
                  <Link
                    external={item.external}
                    href={item.href}
                    fontSize="heading-m"
                  >
                    {item.name}
                  </Link>
                ),
                sections: [
                  {
                    content: (item) => (
                      <div style={{minHeight: '200px' }}>
                        <img
                          src={item.img}
                          alt="Placeholder"
                          style={{ width: "100%",
                                  height: '180px', //setting fixed height
                                  objectFit: 'cover',
                                  borderRadius: '20px'
                                }}
                        />
                      </div>
                    ),
                  },
                  {
                    content: (item) => (
                      <div>
                        <div>{item.description}</div>
                      </div>
                    ),
                  },
                  {
                    id: "type",
                    header: " ",
                    content: (item) => item.type,
                  },
                ],
              }}
              cardsPerRow={[{ cards: 1 }, { minWidth: 700, cards: 3 }]}
              items={[
                {
                  name: "Chatbot",
                  external: false,
                  type: " ", 
                  href: "/chatbot/playground",
                  img: "../../public/images/chatbotCard.jpg",
                  description:
                    "Experiment using different models to automate your everyday tasks",
                },
                {
                  name: "Multi-Chat Playground",
                  external: false,
                  type: " ",
                  href: "/chatbot/multichat",
                  img: "https://images.unsplash.com/photo-1579546928937-641f7ac9bced?q=80&w=1878&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  description:
                    "Compare how models respond to the same prompt",
                },
                {
                  name: "Models",
                  type: " ",
                  href: "/chatbot/models",
                  img: "https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?q=80&w=1911&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  description:
                    "Explore models with AWS Bedrock, Claude, and Llama",
                },
              ]}
            />

            <Header
              variant="h1"
              description="Automate daily tasks with AI driven solutions. Optimize how you summarize, draft, and extract information."
            >
              Tasks
            </Header>
            <Cards
              cardDefinition={{
                header: (item) => (
                  <Link
                    href={item.href}
                    external={item.external}
                    fontSize="heading-m"
                  >
                    {item.name}
                  </Link>
                ),
                sections: [
                  {
                    content: (item) => <div>{item.description}</div>,
                  },
                  {
                    id: "type",
                    header: " ",
                    
                  },
                ],
              }}
              cardsPerRow={[{ cards: 1 }, { minWidth: 700, cards: 3 }]}
              items={[
                {
                  name: "Summarize Text",
                  external: false,
                  type: "Summarize the following meeting notes for me",
                  // href: `/chatbot/playground/task-playground?prompt=${encodeURIComponent(TaskPriming("memo").prompt)}`,
                  href: `/chatbot/task-playground/${uuidv4()}/${"summarize"}`, 
                
                  // sending to URL parser ^^ do taskPromptMap look up 
                  // onFollow: useHref, 
                  description:
                    "Summarize meeting notes, articles, transcripts to create concise notes.",
                },
                {
                  name: "Draft A Memo",
                  external: false,
                  type: "Draft a concise, professional memo based on the following text: ",
                  href: `/chatbot/task-playground/${uuidv4()}/${"memo"}`,
                  description:
                    "Compose concise memos through automated drafting.",
                },
                {
                  name: "Translate",
                  external: false,
                  type: "Translate the following text into",
                  href: `/chatbot/task-playground/${uuidv4()}/${"translate"}`,
                  description:
                    "Translate text into 24+ languages",
                },
                {
                  name: "Daily Planning",
                  type: "Translate the following text into" ,
                  href: `/chatbot/task-playground/${uuidv4()}/${"dailyPlanning"}`, 
                  description:
                    "Save time and let AI make a plan for your day.",
                },
                {
                  name: "Create A Meeting Agenda",
                  type: "Translate the following text into" ,
                  href: `/chatbot/task-playground/${uuidv4()}/${"meetingAgenda"}`, 
                  description:
                    "Create a strategic agenda for an upcoming meeting ",
                },
                {
                  name: "Need Some Positive Affirmation?",
                  type: "fun" , // use for categories
                  href: `/chatbot/task-playground/${uuidv4()}/${"positiveAffirmation"}`, 
                  description:
                    "Recieve uplifting affirmations o start your workday with positivity and motivation.",
                },
              ]}
            />

        
            <Container
              header={
                <Header
                  variant="h2"
                  description="Create custom solutions for your organization. Optimize your workflows with Tailored AI, Data Analytics, and Cloud Computing Soluions."
                  >
                    Create
                  </Header>
              }> 
            <Cards
              cardDefinition={{
                header: (item) => (
                  <Link
                    href={item.href}
                    external={item.external}
                    fontSize="heading-m"
                  >
                    {item.name}
                  </Link>
                ),
                sections: [
                  {
                    content: (item) => (
                    <div style={{minHeight: '200px' }}>
                      <img
                        src={item.img}
                        alt="Placeholder"
                        style={{width: "100%",
                                height: '180px', //setting fixed height
                                objectFit: 'cover',
                                borderRadius: '20px'}}
                      />
                     
                    </div>
                    ),
                  },
                  {
                    content: (item) => (
                      <div>
                        <div>{item.description}</div>
                      </div>
                    ),
                  },
                  {
                    id: "type",
                    header: " ",
                    content: (item) => item.type,
                  },
                ],
              }}
              cardsPerRow={[{ cards: 1 }, { minWidth: 700, cards: 3 }]}
              items={[
                {
                  name: "Tailored AI Solutions",
                  type: "Sagemaker",
                  external: true,
                  href: "https://aws.amazon.com/about-aws/whats-new/2023/07/amazon-aurora-postgresql-pgvector-vector-storage-similarity-search/",
                  img: "/images/welcome/sagemaker.png",
                  description:
                    "Empower your applications by integrating advanced AI capabilities effortlessly.",
                  tags: [""],
                },
                {
                  name: "Advanced Data Analytics",
                  type: " ",
                  external: true,
                  href: "https://aws.amazon.com/blogs/big-data/amazon-opensearch-services-vector-database-capabilities-explained/",
                  img: "/images/welcome/advanData.jpg",
                  description:
                    "Transform data into actionable insights, driving strategic decisions for your organization.",
                },
                {
                  name: "Prompt Engineering Guide",
                  external: true,
                  type: " ",
                  href: "https://www.promptingguide.ai/",
                  img: "/images/welcome/lambda.png",
                  description:
                    "Prompt engineering is the skill of crafting clear and specific questions to get the best answers from an AI system.",
                },
              ]}
            />
            </Container>
          </SpaceBetween>
        </ContentLayout>
      }
    ></BaseAppLayout>
  );
}
