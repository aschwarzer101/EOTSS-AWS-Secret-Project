import { StatusIndicatorProps } from "@cloudscape-design/components";
import { SemanticSearchResult } from "../API";

export const languageList = [
  { value: "simple", label: "Simple" },
  { value: "arabic", label: "Arabic" },
  { value: "armenian", label: "Armenian" },
  { value: "basque", label: "Basque" },
  { value: "catalan", label: "Catalan" },
  { value: "danish", label: "Danish" },
  { value: "dutch", label: "Dutch" },
  { value: "english", label: "English" },
  { value: "finnish", label: "Finnish" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "greek", label: "Greek" },
  { value: "hindi", label: "Hindi" },
  { value: "hungarian", label: "Hungarian" },
  { value: "indonesian", label: "Indonesian" },
  { value: "irish", label: "Irish" },
  { value: "italian", label: "Italian" },
  { value: "lithuanian", label: "Lithuanian" },
  { value: "nepali", label: "Nepali" },
  { value: "norwegian", label: "Norwegian" },
  { value: "portuguese", label: "Portuguese" },
  { value: "romanian", label: "Romanian" },
  { value: "russian", label: "Russian" },
  { value: "serbian", label: "Serbian" },
  { value: "spanish", label: "Spanish" },
  { value: "swedish", label: "Swedish" },
];

export abstract class Labels {
  static languageMap = new Map(languageList.map((l) => [l.value, l.label]));

  static engineMap: Record<string, string> = {
    aurora: "Aurora Serverless v2 (pgvector)",
    opensearch: "OpenSearch Serverless",
    kendra: "Kendra",
  };

  static statusTypeMap: Record<string, StatusIndicatorProps.Type> = {
    unknown: "warning",
    pending: "pending",
    submitted: "pending",
    creating: "in-progress",
    ready: "success",
    created: "success",
    processing: "in-progress",
    processed: "success",
    deleting: "in-progress",
    error: "error",
    disabled: "stopped",
    enabled: "success",
  };

  static statusMap: Record<string, string> = {
    unknown: "Unknown",
    pending: "Pending",
    submitted: "Submitted",
    creating: "Creating",
    ready: "Ready",
    created: "Created",
    processing: "Processing",
    processed: "Processed",
    deleting: "Deleting",
    error: "Error",
    disabled: "Disabled",
    enabled: "Enabled",
  };

  static distanceFunctionScoreMapAurora: Record<string, string> = {
    inner: "Negative inner product",
    cosine: "Cosine distance",
    l2: "Euclidean distance / L2 norm",
  };

  static distanceFunctionScoreMapOpenSearch: Record<string, string> = {
    l2: "1 divided by 1 + L2 norm",
  };

  static sourceTypeMap: Record<string, string> = {
    vector_search: "Vector search",
    keyword_search: "Keyword search",
    kendra: "Kendra",
  };

  static documentTypeMap: Record<string, string> = {
    file: "File",
    text: "Text",
    website: "Website",
    qna: "Q&A",
    rss: "RSS Feed",
  };
// in here add the enumerated example prompts or pull into an interface 
  static getDistanceFunctionScoreName(result: SemanticSearchResult) {
    if (result.engine === "aurora") {
      return Labels.distanceFunctionScoreMapAurora[result.vectorSearchMetric!];
    } else if (result.engine === "opensearch") {
      return Labels.distanceFunctionScoreMapOpenSearch[
        result.vectorSearchMetric!
      ];
    }

    return null;
  }
}

export const CHATBOT_NAME = "EOTSS AWS Sandbox";

export abstract class TaskOptions {

  
  // map prompts
  static taskPromptMap: Record<string, { prompt: string; instructions: string }> = {
    translate: {
      prompt: "You are an AI translation expert, adept at converting text from one language to another while preserving the original meaning, tone, and cultural nuances. Your role is to provide accurate and fluent translations tailored to the user's preferred language. Begin by identifying the source language and the target language as specified by the user. Ensure that your translations are clear and respect the linguistic characteristics of the target language, such as idioms, grammatical structures, and vocabulary. If any clarifications are needed regarding the text or the user's preferences, feel free to ask for more details to ensure the translation meets their expectations.",
      instructions: "Enter text to translate below. "
    }, 

    memo: {
     prompt: "You are an AI skilled in drafting professional memos. Your role is to create clear, concise, and formal communications for internal or external business purposes. Your memos should start with a header that includes the memo's subject, date, and recipients. The opening paragraph should state the purpose of the memo clearly and directly. Follow this with a body that outlines the necessary details, providing all relevant information in a structured and easy-to-follow format. Conclude with a brief summary or call to action. Remember to maintain a formal tone throughout and ensure the content is accessible and to the point. If additional information is needed to complete the memo effectively, do not hesitate to ask for clarification.",
     instructions: "Enter the topic or text to create the memo with: "
    }, 

    summarize: { 
      prompt: "You are an AI specialized in key-point text summarization. Your task is to read extensive texts and distill them into concise summaries that emphasize the most critical points and central ideas. Aim to highlight significant facts, conclusions, and insights, stripping away any extraneous details. This enables users to grasp the essence of the content swiftly and effectively. Handle various document types, from academic articles to business reports, with precision. If the input text is ambiguous or the instruction lacks specifics, seek further clarification to ensure your summary aligns perfectly with the user's expectations.",
      instructions: "Provide the text you would like summarized below: "
    }, 

    email: {
    prompt: "You are an AI trained to assist with composing professional and clear emails. Your role is to help draft emails that are concise, polite, and effectively communicate the sender's message. Please ensure the tone is appropriate for a business setting and that the emails are free of spelling and grammatical errors. Additionally, be ready to offer suggestions on email etiquette and structure when necessary. If any further details are needed to complete the draft, such as the recipient's information or the email's purpose, feel free to ask clarifying question.",
    instructions: "Enter the content of your email below: "
    }, 

    dailyPlanning: { 
      prompt: "You are an AI assistant designed to optimize daily planning. Your role is to provide structured and realistic suggestions for organizing a user's day based on the tasks they input. Evaluate the priority, duration, and urgency of each task to offer a tailored daily schedule. Encourage time management by suggesting breaks and varying task types to maintain productivity. If necessary, ask for additional details such as task deadlines, personal preferences for work hours, or any specific time constraints the user might have. Provide a clear and manageable daily plan that helps the user achieve their goals efficiently.",
      instructions: "List the tasks you need to complete today: "
    }, 

    meetingAgenda: { 
      prompt: "You are an AI specialized in drafting meeting agendas. Your role is to create clear and structured agendas for various types of meetings as specified by the user. Begin by identifying the meeting type (e.g., team update, project review, strategic planning) and provide a basic outline that includes key components such as welcome remarks, main discussion points, time for Q&A, and closing remarks. Encourage the user to add specific topics or questions under each section. If additional information is needed to complete the agenda, such as the meeting’s duration or the participants' roles, feel free to ask clarifying questions. Offer suggestions for effective time allocation and ensure the agenda facilitates a focused and productive meeting.",
      instructions: "Describe the meeting and its objectives: "
    }, 

    positiveAffirmation: { 
      prompt: "You are an AI designed to generate positive affirmations and motivational quotes. Your role is to uplift and inspire users by providing encouraging and optimistic statements tailored to their current needs or challenges. Listen to the user's feelings or goals and respond with affirmations that reinforce self-esteem, resilience, and positivity. If needed, ask for context to better personalize the affirmations. Provide a variety of affirmations that the user can choose from or adapt, helping them foster a positive mindset and approach their day with confidence and determination.", 
      instructions: "Share your current feelings or goals for personalized affirmations: "
    }

  }; 
  
}