import * as React from "react";
import Form from "@cloudscape-design/components/form";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";

export default function FeedbackForm() {
  return (
    <Container header={<Header>Container header</Header>}>
      <form onSubmit={e => e.preventDefault()}>
        <Form
          variant="embedded"
          actions={
            <SpaceBetween
              direction="horizontal"
              size="xs"
            >
              <Button formAction="none" variant="link">
                Cancel
              </Button>
              <Button variant="primary">Submit</Button>
            </SpaceBetween>
          }
          header={
            <Header variant="h3">Form header</Header>
          }
        >
          Form fields come here.
        </Form>
      </form>
    </Container>
  );
}