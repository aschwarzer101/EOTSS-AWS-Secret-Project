import { ChatInputState } from "./types";
import { ChabotInputModality } from "./types";
import { useContext, useEffect, useState } from "react";
import {
  ChatBotConfiguration,
  ChatBotHistoryItem,
  ChatBotMessageType,
  FeedbackData,
} from "./types";
import { SpaceBetween, StatusIndicator } from "@cloudscape-design/components";
import ChatInputPanel, { ChatScrollState } from "./chat-input-panel";
import TaskPriming from "./task";
import { CHATBOT_NAME, TaskOptions } from "../../common/constants";
import styles from "../../styles/chat.module.scss";
import { AppContext } from "../../common/app-context";
import { ApiClient } from "../../common/api-client/api-client";
// MANIAC IDEA 