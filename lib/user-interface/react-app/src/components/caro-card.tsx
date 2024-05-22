import React from "react";
// import './styles.css'
import Card  from 'react-bootstrap/Card';
import { CardBody } from "react-bootstrap";
import Button from 'react-bootstrap/Button';

export interface ChatBotTaskCard{
name: string;
cardTitle: string;  
taskDescription: string; 
instructions: string;
url: string; 
apiPrompt: string; 
}

export function TaskCard(props: ChatBotTaskCard) {

    const title = props.cardTitle;
    
    const description = props.taskDescription; 
    

    
    
    
return (
    <div>
    <Card bg="info" > 
        <Card.Header>

        </Card.Header>
        <CardBody>
        <Card.Title>{props.cardTitle}</Card.Title>
        <Card.Text>
            {props.taskDescription}
        </Card.Text>
        <Button variant="primary" href = {props.url} > Try it </Button>
        </CardBody>
    </Card>
    
    </div> 

    )
        

    

}