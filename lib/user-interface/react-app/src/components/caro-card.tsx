import React from "react";
import Card from 'react-bootstrap/Card';
import { CardBody } from "react-bootstrap";
import Button from 'react-bootstrap/Button';
import useOnFollow from "../common/hooks/use-on-follow";
import styles from "../../styles/globals.css";

export interface ChatBotTaskCard {
  name: string;
  cardTitle: string;
  taskDescription: string;
  instructions: string;
  url: string;
  apiPrompt: string;
}

export function TaskCard(props: ChatBotTaskCard) {
    const onFollow = useOnFollow();
  return (
    
    <div className="shadow p-3 mb-5 bg-white rounded">
      <Card bg="info">
        <Card.Header></Card.Header>
        <CardBody>
          <Card.Title className="task-card-title">{props.cardTitle}</Card.Title>
          <Card.Text as= "p">{props.taskDescription}</Card.Text>
          <Button 
            as="a" 
            variant="primary" 
            href={props.url} 
            active
            onClick={onFollow}
            >
                Try it 
            </Button>
        </CardBody>
      </Card>
      </div>
      
  );
}
