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
import { CHATBOT_NAME } from "../common/constants";

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
                      <div>
                        <img
                          src={item.img}
                          alt="Placeholder"
                          style={{ width: "100%" }}
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
                  external: true,
                  type: " ", 
                  href: "/chatbot/playground",
                  img: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Z3JhZGllbnR8ZW58MHx8MHx8fDA%3D",
                  description:
                    "Experiment using different models to automate your everyday tasks",
                },
                {
                  name: "Multi-Chat Playground",
                  external: true,
                  type: " ",
                  href: "/chatbot/playground",
                  img: "https://images.unsplash.com/photo-1579546928937-641f7ac9bced?q=80&w=1878&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  description:
                    "Compare how models respond to the same prompt",
                },
                {
                  name: "Models",
                  type: "External API",
                  href: "#",
                  img: "https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?q=80&w=1911&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  description:
                    "Explore models such as AI21 Labs, OpenAI, HuggingFace Interface Endpoints etc.",
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
                    content: (item) => item.type,
                  },
                ],
              }}
              cardsPerRow={[{ cards: 1 }, { minWidth: 700, cards: 3 }]}
              items={[
                {
                  name: "Summarize Text",
                  external: true,
                  type: " ",
                  href: "chatbot/playground",
                  description:
                    "Summarize meeting notes, articles, transcripts to create concise notes.",
                },
                {
                  name: "Draft A Memo",
                  external: true,
                  type: " ",
                  href: "chatbot/playground",
                  description:
                    "Compose concise memos through automated drafting",
                },
                {
                  name: "Translate",
                  type: " ",
                  href: "chatbot/playground",
                  description:
                    "Translate and generate text in 25+ languages ",
                },
              ]}
            />

            <Header
              variant="h1"
              description="Create custom solutions for your organization. Optimize your workflows with Tailored AI, Data Analytics, and Cloud Computing Solutions."
            >
              Create
            </Header>
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
                    <div>
                      <img
                        src={item.img}
                        alt="Placeholder"
                        style={{width: "100%"}}
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
                  tags: ["Fully managed"],
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
                  name: "Cloud Computing Solutions",
                  external: true,
                  type: "Search Engine",
                  href: "https://aws.amazon.com/kendra/",
                  img: "/images/welcome/lambda.png", 
                  description:
                    "Use AWS resources to create secure and adaptable solutions for your operational demands.",
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
