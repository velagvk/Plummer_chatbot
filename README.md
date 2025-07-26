# Microsoft Teams Chatbot with Azure OpenAI

A Microsoft Teams chatbot powered by Azure OpenAI that provides intelligent conversations and assistance in a professional workplace environment.

## Features

- 🤖 **AI-Powered Conversations**: Powered by Azure OpenAI for natural language understanding
- 💬 **Context-Aware Responses**: Maintains conversation history for better context
- 🏢 **Teams Integration**: Seamlessly integrates with Microsoft Teams channels
- 📱 **Adaptive Cards**: Rich interactive messages with cards and buttons
- 🔧 **Command System**: Built-in commands for help and conversation management
- 🛡️ **Professional Environment**: Designed for workplace use with appropriate responses

## Prerequisites

Before you begin, ensure you have the following:

### Azure OpenAI Setup
1. **Azure OpenAI Service**: Create an Azure OpenAI resource in your Azure subscription
2. **Model Deployment**: Deploy a GPT model (e.g., GPT-3.5-turbo or GPT-4) in your Azure OpenAI service
3. **API Keys**: Get your Azure OpenAI endpoint and API key

### Microsoft Teams Setup
1. **Bot Registration**: Register your bot in the Azure Bot Service
2. **Teams App**: Create a Teams app in the Teams Developer Portal
3. **Azure AD App**: Register an Azure AD application for authentication

### Development Environment
- Node.js (v16 or higher)
- npm or yarn
- Visual Studio Code (recommended)
- Bot Framework Emulator (for local testing)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd teams-openai-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Azure OpenAI Configuration
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your-azure-openai-api-key
   AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

   # Bot Framework Configuration
   MICROSOFT_APP_ID=your-bot-app-id
   MICROSOFT_APP_PASSWORD=your-bot-app-password
   MICROSOFT_APP_TENANT_ID=your-tenant-id

   # Teams Configuration
   TEAMS_APP_ID=your-teams-app-id
   TEAMS_APP_PASSWORD=your-teams-app-password

   # Server Configuration
   PORT=3978
   NODE_ENV=development
   ```

## Development

### Local Development

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Test with Bot Framework Emulator**
   - Download and install [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator)
   - Open the emulator and connect to `http://localhost:3978/api/messages`
   - Start chatting with your bot

### Building for Production

1. **Build the TypeScript code**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Deployment

### Option 1: Azure Bot Service (Recommended)

1. **Deploy to Azure**
   ```bash
   # Using Azure CLI
   az webapp up --name your-bot-name --resource-group your-resource-group --runtime "NODE|18-lts"
   ```

2. **Configure environment variables in Azure**
   - Go to your Azure Web App
   - Navigate to Configuration > Application settings
   - Add all environment variables from your `.env` file

3. **Update bot messaging endpoint**
   - In Azure Bot Service, update the messaging endpoint to: `https://your-app-name.azurewebsites.net/api/messages`

### Option 2: Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t teams-openai-bot .
   ```

2. **Run container**
   ```bash
   docker run -p 3978:3978 --env-file .env teams-openai-bot
   ```

## Teams App Deployment

### 1. Update Manifest

1. Edit `teams-app-manifest/manifest.json`
2. Replace placeholders:
   - `{{TEAMS_APP_ID}}` with your Teams app ID
   - `{{BOT_DOMAIN}}` with your bot's domain

### 2. Create App Package

1. **Add icons** to the `teams-app-manifest/` directory:
   - `color.png` (192x192px)
   - `outline.png` (32x32px)

2. **Zip the manifest folder**:
   ```bash
   cd teams-app-manifest
   zip -r ../teams-app-package.zip .
   ```

### 3. Install in Teams

1. **For testing**: Upload the zip file in Teams Developer Portal
2. **For production**: Submit for review in Teams App Store

## Usage

### Bot Commands

- `/help` - Show help information and available commands
- `/clear` - Clear conversation history
- **Natural conversation** - Ask questions or have conversations

### Teams Integration

The bot automatically:
- Welcomes new team members
- Responds to channel events (creation, renaming)
- Maintains conversation context
- Provides rich interactive responses

## Configuration

### Azure OpenAI Settings

You can customize the AI behavior by modifying the `generateOpenAIResponse` method in `src/bot.ts`:

```typescript
const result = await this.openAIClient.getChatCompletions(
  process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  messages,
  {
    maxTokens: 500,        // Maximum response length
    temperature: 0.7,      // Creativity (0.0-1.0)
    topP: 0.95,           // Nucleus sampling
    frequencyPenalty: 0,   // Reduce repetition
    presencePenalty: 0     // Encourage new topics
  }
);
```

### Conversation History

The bot maintains conversation history for context. You can adjust the history length in `src/bot.ts`:

```typescript
// Keep only last 10 messages to manage context length
if (conversationData.messages.length > 10) {
  conversationData.messages = conversationData.messages.slice(-10);
}
```

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check Azure OpenAI API key and endpoint
   - Verify bot registration in Azure Bot Service
   - Ensure messaging endpoint is correct

2. **Teams app not loading**
   - Verify manifest.json is valid
   - Check validDomains in manifest
   - Ensure HTTPS is used for production

3. **Authentication errors**
   - Verify Microsoft App ID and password
   - Check Azure AD app registration
   - Ensure proper permissions are granted

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=botbuilder:*
```

## Security Considerations

- Store sensitive configuration in environment variables
- Use Azure Key Vault for production secrets
- Implement proper authentication and authorization
- Regularly rotate API keys and passwords
- Monitor bot usage and implement rate limiting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the [Microsoft Teams documentation](https://docs.microsoft.com/en-us/microsoftteams/platform/)
- Review [Azure OpenAI documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
- Open an issue in this repository

## References

- [Microsoft Teams Bot Framework](https://dev.botframework.com/)
- [Azure OpenAI Service](https://azure.microsoft.com/en-us/services/cognitive-services/openai-service/)
- [Teams Toolkit](https://docs.microsoft.com/en-us/microsoftteams/platform/toolkit/overview)
- [Bot Framework SDK](https://github.com/microsoft/botbuilder-js) 