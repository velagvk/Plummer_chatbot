import * as dotenv from 'dotenv';
import { BotConfig } from '../types';

dotenv.config();

export function getConfig(): BotConfig {
  return {
    azureOpenAI: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!
    },
    botFramework: {
      appId: process.env.MICROSOFT_APP_ID!,
      appPassword: process.env.MICROSOFT_APP_PASSWORD!,
      tenantId: process.env.MICROSOFT_APP_TENANT_ID
    },
    teams: {
      appId: process.env.TEAMS_APP_ID!,
      appPassword: process.env.TEAMS_APP_PASSWORD!
    },
    server: {
      port: parseInt(process.env.PORT || '3978'),
      environment: process.env.NODE_ENV || 'development'
    }
  };
}

export function validateConfig(config: BotConfig): void {
  const requiredFields = [
    'azureOpenAI.endpoint',
    'azureOpenAI.apiKey',
    'azureOpenAI.deploymentName',
    'botFramework.appId',
    'botFramework.appPassword',
    'teams.appId',
    'teams.appPassword'
  ];

  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj: any, key) => obj?.[key], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${field}`);
    }
  }
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
} 