import React, { useState } from "react";
import {
    BreadcrumbGroup,
    ContentLayout,
    Header,
    SpaceBetween,
    Alert,
    Tabs,
    Container
} from "@cloudscape-design/components";
import styled from 'styled-components';
import useOnFollow from "../../common/hooks/use-on-follow";
import BaseAppLayout from "../../components/base-app-layout";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

const OrderedList = styled.div`
    margin: 0;
    padding: 0;
`;

const ListItem = styled.div`
    padding: 10px 0;
    display: flex;
    align-items: center;
    justify-content: start;
    font-weight: bold;
`;

const Separator = styled.hr`
    background-color: lightgray; 
    height: 1.5px;             
    border: none;            
    margin: 10px 0;
`;

const Details = styled.div`
    padding: 5px 29px 13px 29px;
    font-size: 15px;
`;

const ListDetails = styled.li`
    padding: 6px 0px 13px 0px;
    font-size: 15px;
`;

export default function GenieFeatures() {
    const onFollow = useOnFollow();
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    return (
      <BaseAppLayout
          contentType="cards"
          breadcrumbs={
              <BreadcrumbGroup
                  onFollow={onFollow}
                  items={[
                      { text: "BEACON AI", href: "/*" },
                      { text: "Features of GENIE", href: "/features" },
                  ]}
              />
          }
          content={
              <ContentLayout
                  header={<Header variant="h1">Features of GENIE</Header>}
              >
                  <SpaceBetween size="l">
                      {/* Chatbot Section */}
                      <Container header={<Header variant="h3">Chatbot</Header>}>
                          <OrderedList>
                              <ListDetails>
                                  Ask General Questions: Similar to queries you might enter into an internet search engine like Google.
                              </ListDetails>
                              <ListDetails>
                                  Query Uploaded Documents: Pose questions about a document or set of documents you’ve uploaded to GENIE.
                              </ListDetails>
                          </OrderedList>
                      </Container>

                      {/* Bottom Bar Section */}
                      <Container header={<Header variant="h3">Bottom Bar</Header>}>
                          <p>Smart Model:</p>
                          <OrderedList>
                              <ListDetails>
                                  Automatically selects the best Large Language Model (LLM) from over 10 supported LLMs to answer your questions.
                              </ListDetails>
                              <ListDetails>No configuration required!</ListDetails>
                              <ListDetails>
                                  Prefer customization? You can manually select your preferred LLM for answering questions.
                              </ListDetails>
                          </OrderedList>
                          <button
                              style={{
                                  marginTop: "10px",
                                  padding: "10px 15px",
                                  backgroundColor: "#4f4db6",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "5px",
                                  cursor: "pointer",
                              }}
                              onClick={toggleExpand}
                          >
                              {expanded ? "Hide Supported Models" : "Show Supported Models"}
                          </button>
                          {expanded && (
                              <OrderedList>
                                  <ListDetails>Claude Series by Anthropic</ListDetails>
                                  <ListDetails>Cohere's Command Models</ListDetails>
                                  <ListDetails>LLaMA Series by Meta AI</ListDetails>
                                  <ListDetails>Mistral Models</ListDetails>
                                  <ListDetails>Amazon's Titan Text Models</ListDetails>
                              </OrderedList>
                          )}
                      </Container>

                      {/* Multi-Chat Playground Section */}
                      <Container header={<Header variant="h3">Multi-Chat Playground</Header>}>
                          <p>This feature lets you compare outputs from multiple models side by side.</p>
                          <OrderedList>
                              <ListDetails>Select a model for each panel.</ListDetails>
                              <ListDetails>
                                  Choose either Basic Chat (No Workspace) or a workspace containing uploaded documents.
                              </ListDetails>
                              <ListDetails>Enter your question and view outputs from selected models.</ListDetails>
                          </OrderedList>
                      </Container>

                      {/* Document Upload Section */}
                      <Container header={<Header variant="h3">Document Upload</Header>}>
                          <p>Ways to Upload Documents:</p>
                          <OrderedList>
                              <ListDetails>Upload a Single Document</ListDetails>
                              <ListDetails>Upload Multiple Documents</ListDetails>
                          </OrderedList>
                          <p>What Are Workspaces?</p>
                          <Details>
                              Workspaces function like folders, organizing all the documents you upload.
                              To query a chatbot about specific documents, select the appropriate workspace containing those files.
                          </Details>
                      </Container>
                  </SpaceBetween>
              </ContentLayout>
          }
      />
  );
}