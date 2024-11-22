import { useState } from "react";
import { TaskCard } from "./caro-card";
import { Grid, Button } from "@cloudscape-design/components";
import { Mode } from "@cloudscape-design/global-styles";
import { v4 as uuidv4 } from "uuid";

interface CarouselNextProps {
    theme: Mode;
}

const CarouselNext = ({ theme }: CarouselNextProps) => {
    const [showAll, setShowAll] = useState(false);

    const taskCards = [
        {
            name: "summarize",
            cardTitle: "Summarize",
            taskDescription: "Summarize meeting notes, articles, memos.",
            instructions: "Paste your text below",
            url: `/chatbot/task-playground/${uuidv4()}/summarize`,
            apiPrompt: "You are a summarization agent...",
        },
        {
            name: "Translate",
            cardTitle: "Translate",
            taskDescription: "Translate text into 24+ languages.",
            instructions: "Paste your text below",
            url: `/chatbot/task-playground/${uuidv4()}/translate`,
            apiPrompt: "You are a summarization agent...",
        },
        {
            name: "Create A Meeting Agenda",
            cardTitle: "Create A Meeting Agenda",
            taskDescription: "Create a strategic agenda for an upcoming meeting.",
            instructions: "Describe the meeting and its objectives:",
            url: `/chatbot/task-playground/${uuidv4()}/meetingAgenda`,
            apiPrompt: "You are a summarization agent...",
        },
        {
            name: "email",
            cardTitle: "Email Composition Assistant",
            taskDescription: "Compose professional and clear emails.",
            instructions: "Enter a rough draft of your email below:",
            url: `/chatbot/task-playground/${uuidv4()}/email`,
            apiPrompt: "You are an AI trained to assist with composing professional and clear emails...",
        },
        {
            name: "memo",
            cardTitle: "Draft A Memo",
            taskDescription: "Compose concise memos through automated drafting.",
            instructions: "Enter more data about the memo you want to create:",
            url: `/chatbot/task-playground/${uuidv4()}/memo`,
            apiPrompt: "You are an AI skilled in drafting professional memos...",
        },
        {
            name: "dailyPlanning",
            cardTitle: "Daily Planning",
            taskDescription: "Save time and let AI make a plan for your day.",
            instructions: "Save time and let AI make a plan for your day.",
            url: `/chatbot/task-playground/${uuidv4()}/dailyPlanning`,
            apiPrompt: "You are an AI assistant designed to optimize daily planning...",
        },
        {
            name: "toneCustomization",
            cardTitle: "Tone Customization",
            taskDescription: "Choose what tone you want GENIE to respond in.",
            instructions: "Choose what tone you want GENIE to respond in.",
            url: `/chatbot/task-playground/${uuidv4()}/toneCustomization`,
            apiPrompt: "You are an AI language model that specializes in tailoring your responses to match a specific tone...",
        },
        {
            name: "documentFormatting",
            cardTitle: "Document Formatting",
            taskDescription: "Have AI assist you in formatting your text or document.",
            instructions: "Upload or paste the document text here, and specify any formatting guidelines:",
            url: `/chatbot/task-playground/${uuidv4()}/documentFormatting`,
            apiPrompt: "You are an AI assistant for document formatting...",
        },
        {
            name: "policyClarification",
            cardTitle: "Policy Clarification",
            taskDescription: "Ask questions about Massachusetts policies.",
            instructions: "Enter the Massachusetts policy or text needing clarification:",
            url: `/chatbot/task-playground/${uuidv4()}/policyClarification`,
            apiPrompt: "You are an AI that assists in policy clarification...",
        },
        {
            name: "positiveAffirmation",
            cardTitle: "Need Some Positive Affirmation?",
            taskDescription: "Receive uplifting affirmations to start your workday with positivity and motivation.",
            instructions: "Save time and let AI make a plan for your day.",
            url: `/chatbot/task-playground/${uuidv4()}/positiveAffirmation`,
            apiPrompt: "Receive uplifting affirmations to start your workday with positivity and motivation...",
        },
    ];

    // Show the first 3 cards initially and expand to show all cards
    const visibleCards = showAll ? taskCards : taskCards.slice(0, 3);

    return (
        <div>
            {/* Flexbox layout for cards */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap", // Allow cards to wrap onto the next row
                    justifyContent: "center", // Center-align all cards
                    gap: "1rem", // Add space between the cards
                    //padding: "2rem", // Add padding around the container
                }}
            >
                {visibleCards.map((task) => (
                    <TaskCard
                        key={task.name}
                        name={task.name}
                        cardTitle={task.cardTitle}
                        taskDescription={task.taskDescription}
                        instructions={task.instructions}
                        url={task.url}
                        apiPrompt={task.apiPrompt}
                        theme={theme}
                    />
                ))}
            </div>
            {/* Show More / Show Less Button */}
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <Button onClick={() => setShowAll(!showAll)} variant="primary">
                    {showAll ? "Show Less" : "Show More"}
                </Button>
            </div>
        </div>
    );
};    

export default CarouselNext;




// import Carousel from 'react-multi-carousel';
// import {ResponsiveType} from 'react-multi-carousel/lib/types';
// import 'react-multi-carousel/lib/styles.css';
// import {ChatBotTaskCard, TaskCard} from './caro-card';
// import Card from 'react-bootstrap/Card';
// import {CardBody, Button} from 'react-bootstrap';
// import {v4 as uuidv4} from "uuid";
// import useOnFollow from "../common/hooks/use-on-follow.ts";
// import {Mode} from "@cloudscape-design/global-styles";

// interface CarouselNextProps {
//     theme: Mode;
// }

// const CarouselNext = ({theme}: CarouselNextProps) => {
//     const BreakpointSlides: ResponsiveType = {
//         desktop: {
//             breakpoint: {max: 3000, min: 1024},
//             items: 3,
//             partialVisibilityGutter: 0
//         },
//         tablet: {
//             breakpoint: {max: 1024, min: 530},
//             items: 2,
//             partialVisibilityGutter: 0
//         },
//         mobile: {
//             breakpoint: {max: 530, min: 0},
//             items: 1,
//             partialVisibilityGutter: 0
//         },
//     };

//     return (
//         <Carousel
//             responsive={BreakpointSlides}
//             //itemClass="carousel-item"
//             //containerClass="carousel-container"
//             autoPlay={true}
//             slidesToSlide={1}
//             // additionalTransfrom={0}
//             // arrows
//             autoPlaySpeed={3000}
//             // centerMode={false}
//             draggable
//             focusOnSelect={true}
//             // infinite={false}
//             //keyBoardControl
//             //minimumTouchDrag={80}
//             pauseOnHover
//             //renderArrowsWhenDisabled={false}
//             //renderButtonGroupOutside={false}
//             //renderDotsOutside={false}
//             rewind={true}
//             rewindWithAnimation={true}
//             //rtl={false}
//             shouldResetAutoplay
//             //showDots={false}
//             //swipeable
//         >
//             <TaskCard
//                 name="summarize"
//                 cardTitle="Summarize"
//                 taskDescription="Summarize meeting notes, articles, memos."
//                 instructions="Paste your text below"
//                 url={`/chatbot/task-playground/${uuidv4()}/summarize`}
//                 apiPrompt="You are a summarization agent..."
//                 theme={theme}
//             />
//             <TaskCard
//                 name="Translate"
//                 cardTitle="Translate"
//                 taskDescription="Translate text into 24+ languages"
//                 instructions="Paste your text below"
//                 url={`/chatbot/task-playground/${uuidv4()}/translate`}
//                 apiPrompt="You are a summarization agent..."
//                 theme={theme}
//             />
//             <TaskCard
//                 name="Create A Meeting Agenda"
//                 cardTitle="Create A Meeting Agenda"
//                 taskDescription="Create a strategic agenda for an upcoming meeting"
//                 instructions="Describe the meeting and its objectives:"
//                 url={`/chatbot/task-playground/${uuidv4()}/meetingAgenda`}
//                 apiPrompt="You are a summarization agent..."
//                 theme={theme}
//             />
//             <TaskCard
//                 name="email"
//                 cardTitle="Email Composition Assistant"
//                 taskDescription="Compose professional and clear emails"
//                 instructions="Enter a rough draft of your email below:"
//                 url={`/chatbot/task-playground/${uuidv4()}/email`}
//                 apiPrompt="You are an AI trained to assist with composing professional and clear emails..."
//                 theme={theme}
//             />
//             <TaskCard
//                 name="memo"
//                 cardTitle="Draft A Memo"
//                 taskDescription="Compose concise memos through automated drafting"
//                 instructions="Enter more data about the memo you want to create: "
//                 url={`/chatbot/task-playground/${uuidv4()}/memo`}
//                 apiPrompt={`You are an AI skilled in drafting professional memos. Your role is to create clear, concise, and formal communications for internal or external business purposes. Your memos should start with a header that includes the memo's subject, date, and recipients. The opening paragraph should state the purpose of the memo clearly and directly. Follow this with a body that outlines the necessary details, providing all relevant information in a structured and easy-to-follow format. Conclude with a brief summary or call to action. Remember to maintain a formal tone throughout and ensure the content is accessible and to the point. If additional information is needed to complete the memo effectively, do not hesitate to ask for clarification.`}
//                 theme={theme}
//             />
//             <TaskCard
//                 name="dailyPlanning"
//                 cardTitle="Daily Planning"
//                 taskDescription="Save time and let AI make a plan for your day."
//                 instructions="Save time and let AI make a plan for your day."
//                 url={`/chatbot/task-playground/${uuidv4()}/dailyPlanning`}
//                 apiPrompt={`You are an AI assistant designed to optimize daily planning. Your role is to provide structured and realistic suggestions for organizing a user's day based on the tasks they input. Evaluate the priority, duration, and urgency of each task to offer a tailored daily schedule. Encourage time management by suggesting breaks and varying task types to maintain productivity. If necessary, ask for additional details such as task deadlines, personal preferences for work hours, or any specific time constraints the user might have. Provide a clear and manageable daily plan that helps the user achieve their goals efficiently.`}
//                 theme={theme}
//             />
//             <TaskCard
//                 name="documentFormatting"
//                 cardTitle="Document Formatting"
//                 taskDescription="Have AI assist you in formating your text or document."
//                 instructions="Upload or paste the document text here, and specify any formatting guidelines:"
//                 url={`/chatbot/task-playground/${uuidv4()}/documentFormatting`}
//                 apiPrompt={`You are an AI assistant for document formatting. Your role is to assist in reformatting documents to align with official templates or guidelines. Follow the provided formatting requirements, ensuring headers, footers, font styles, and spacing adhere to standard document presentation.`}
//                 theme={theme}
//             />
//             <TaskCard
//                 name="policyClarification"
//                 cardTitle="Policy Clarification"
//                 taskDescription="Ask questions about Massachusetts policies."
//                 instructions="Enter the Massachusetts policy or text needing clarification:"
//                 url={`/chatbot/task-playground/${uuidv4()}/policyClarification`}
//                 apiPrompt={`ou are an AI that assists in policy clarification. Your role is to interpret and summarize relevant sections of Massachusetts government policies and provide clear, concise answers. Ensure that explanations are accessible and aligned with official guidance, using plain language.`}
//                 theme={theme}
//             />
//             <TaskCard
//                 name="positiveAffirmation"
//                 cardTitle="Need Some Positive Affirmation?"
//                 taskDescription="Receive uplifting affirmations to start your workday with positivity and motivation."
//                 instructions="Save time and let AI make a plan for your day."
//                 url={`/chatbot/task-playground/${uuidv4()}/positiveAffirmation`}
//                 apiPrompt={`Receive uplifting affirmations to start your workday with positivity and motivation.`}
//                 theme={theme}
//             />
//         </Carousel>
//     );
// };

// export default CarouselNext;

