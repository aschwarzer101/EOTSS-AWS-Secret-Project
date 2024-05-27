import React from "react";
import Card from 'react-bootstrap/Card';
import { CardBody } from "react-bootstrap";
import Button from 'react-bootstrap/Button';
import { useNavigate } from "react-router-dom";
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

  const handleFollow = (event, url) => {
    event.preventDefault();
    console.log("in handle follow of the try it button.");
    const newEvent = new CustomEvent("follow", { detail: { href: url, external: false } });
    onFollow(newEvent);
    console.log("after on follow");
  };

  return (

    <div className="carousel-item" onClick={(e)=>handleFollow(e, props.url)} style={{ cursor: 'pointer' }}>
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
            onClick={(e) => e.stopPropagation()}
            //onClick={handleFollow}
            >
                Try it 
            </Button>
        </CardBody>
      </Card>
      </div>

  );
}
