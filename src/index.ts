import * as restify from 'restify';
import { BotFrameworkAdapter, MemoryStorage, UserState, ConversationState } from 'botbuilder';
import { TeamsOpenAIBot } from './bot';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.PORT || 3978, () => {
  console.log(`\n${server.name} listening to ${server.url}`);
  console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
  console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Create adapter
const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Add error handler
adapter.onTurnError = async (context, error) => {
  console.error(`\n [onTurnError] unhandled error: ${error}`);
  await context.sendTraceActivity(
    'OnTurnError Trace',
    `${error}`,
    'https://www.botframework.com/schemas/error',
    'TurnError'
  );

  // Send a message to the user
  await context.sendActivity('The bot encountered an error or bug.');
  await context.sendActivity('To continue to run this bot, please fix the bot source code.');
  
  // Clear out state
  await conversationState.clear(context);
};

// Create the main dialog and bot
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

const bot = new TeamsOpenAIBot(conversationState, userState);

// Listen for incoming requests
server.post('/api/messages', async (req, res) => {
  await adapter.processActivity(req, res, async (context) => {
    await bot.run(context);
  });
});

// Health check endpoint
server.get('/api/health', async (req, res) => {
  res.send(200, { status: 'OK', message: 'Bot is running' });
});

// Teams manifest endpoint
server.get('/api/manifest', async (req, res) => {
  res.send(200, {
    name: 'Azure OpenAI Teams Bot',
    description: 'A Teams bot powered by Azure OpenAI',
    version: '1.0.0'
  });
});

// Graceful shutdown
const signals = ['SIGTERM', 'SIGINT'];
signals.forEach((signal) => {
  process.on(signal, () => {
    console.log(`\n${signal} received, shutting down server...`);
    server.close(() => {
      console.log('Server has been shut down.');
      process.exit(0);
    });
  });
}); 