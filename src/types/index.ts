export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ConversationData {
  messages: ConversationMessage[];
  currentMode?: 'none' | 'Support Agent' | 'Knowledge retrieval Agent' | 'Data insights Agent';
  userRole?: 'IT Admin' | 'Leadership' | 'Normal User';
  userEmail?: string;
  waitingForTicketConfirmation?: boolean;
  pendingTicketContext?: string;
}

export interface UserProfile {
  name?: string;
  email?: string;
  preferences?: {
    language?: string;
    timezone?: string;
  };
}

export interface BotConfig {
  azureOpenAI: {
    endpoint: string;
    apiKey: string;
    deploymentName: string;
  };
  botFramework: {
    appId: string;
    appPassword: string;
    tenantId?: string;
  };
  teams: {
    appId: string;
    appPassword: string;
  };
  server: {
    port: number;
    environment: string;
  };
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finishReason: string;
    index: number;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TeamsChannelInfo {
  id: string;
  name: string;
  description?: string;
}

export interface TeamsTeamInfo {
  id: string;
  name: string;
  aadGroupId?: string;
}

export interface TeamsMember {
  id: string;
  name: string;
  email?: string;
} 