import * as restify from 'restify';
import { BotFrameworkAdapter, MemoryStorage, UserState, ConversationState } from 'botbuilder';
import { TeamsOpenAIBot } from './bot';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// =================================================================
// ===                 ENHANCED DEBUGGING CONFIG                ===
// =================================================================
console.log('\n=== BOT CONFIGURATION DEBUG ===');
console.log('BOT_ID:', process.env.BOT_ID ? `${process.env.BOT_ID.substring(0, 8)}...` : 'NOT SET');
console.log('BOT_PASSWORD:', process.env.BOT_PASSWORD ? 'SET (length: ' + process.env.BOT_PASSWORD.length + ')' : 'NOT SET');
console.log('PORT:', process.env.PORT || '3978 (default)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('================================\n');

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.PORT || 3978, () => {
  console.log(`\n${server.name} listening to ${server.url}`);
  console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
  console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Create adapter
const adapter = new BotFrameworkAdapter({
  appId: process.env.BOT_ID,
  appPassword: process.env.BOT_PASSWORD,
  channelAuthTenant: process.env.BOT_TENANT_ID
});

// =================================================================
// ===              ENHANCED ADAPTER DEBUGGING                  ===
// =================================================================
console.log('\n=== ADAPTER CONFIGURATION DEBUG ===');
console.log('Adapter Configuration Created Successfully');
console.log('====================================\n');

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
  console.log('\n=== INCOMING REQUEST DEBUG ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Headers:', {
    'authorization': req.headers.authorization ? 'Bearer ***' : 'MISSING',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent'],
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'host': req.headers.host
  });
  console.log('Request Body Keys:', Object.keys(req.body || {}));
  
  // =================================================================
  // ===              ENHANCED JWT TOKEN DEBUGGING                ===
  // =================================================================
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const [header, payload, signature] = token.split('.');
      const decodedHeader = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
      
      console.log('\n--- COMPREHENSIVE JWT DEBUG ---');
      console.log('JWT Header:', decodedHeader);
      console.log('JWT Payload Claims:');
      console.log('  Issuer (iss):', decodedPayload.iss);
      console.log('  Audience (aud):', decodedPayload.aud);
      console.log('  Tenant ID (tid):', decodedPayload.tid || 'undefined');
      console.log('  App ID (appid):', decodedPayload.appid || 'undefined');
      console.log('  Subject (sub):', decodedPayload.sub || 'undefined');
      console.log('  Service URL (serviceurl):', decodedPayload.serviceurl || 'undefined');
      console.log('  Expiration (exp):', decodedPayload.exp ? new Date(decodedPayload.exp * 1000).toISOString() : 'undefined');
      console.log('  Not Before (nbf):', decodedPayload.nbf ? new Date(decodedPayload.nbf * 1000).toISOString() : 'undefined');
      console.log('  Issued At (iat):', decodedPayload.iat ? new Date(decodedPayload.iat * 1000).toISOString() : 'undefined');
      console.log('  All Available Claims:', Object.keys(decodedPayload));
      
      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      const isExpired = decodedPayload.exp && decodedPayload.exp < now;
      const isNotYetValid = decodedPayload.nbf && decodedPayload.nbf > now;
      console.log('  Token Status:');
      console.log('    Current Unix Time:', now);
      console.log('    Is Expired:', isExpired);
      console.log('    Is Not Yet Valid:', isNotYetValid);
      console.log('    Is Valid Time Window:', !isExpired && !isNotYetValid);
      
      // Compare with adapter configuration
      console.log('  Configuration Comparison:');
      console.log('    JWT Audience:', decodedPayload.aud);
      console.log('    Expected App ID (from env):', process.env.BOT_ID);
      console.log('    JWT App ID (appid claim):', decodedPayload.appid);
      console.log('    Audience matches Expected:', decodedPayload.aud === process.env.BOT_ID);
      console.log('-----------------------------\n');
    } else {
      console.log('❌ NO AUTHORIZATION HEADER FOUND');
      console.log('Available headers:', Object.keys(req.headers));
    }
  } catch (err) {
    console.error('❌ Error decoding JWT for debugging:', err);
  }

  // =================================================================
  // ===                ADAPTER PROCESSING DEBUG                  ===
  // =================================================================
  console.log('\n=== ADAPTER PROCESSING ===');
  console.log('About to call adapter.processActivity...');
  
  await adapter.processActivity(req, res, async (context) => {
    console.log('\n--- CONTEXT DEBUG ---');
    console.log('✅ Successfully entered processActivity callback');
    console.log('Activity Details:');
    console.log('  Type:', context.activity.type);
    console.log('  Channel ID:', context.activity.channelId);
    console.log('  Service URL:', context.activity.serviceUrl);
    console.log('  From ID:', context.activity.from?.id);
    console.log('  From Name:', context.activity.from?.name);
    console.log('  Recipient ID:', context.activity.recipient?.id);
    console.log('  Recipient Name:', context.activity.recipient?.name);
    console.log('  Text:', context.activity.text);
    console.log('  Conversation ID:', context.activity.conversation?.id);
    console.log('  Conversation Tenant ID:', context.activity.conversation?.tenantId);
    console.log('-------------------\n');
    
    console.log('🤖 About to run bot logic...');
    await bot.run(context);
    console.log('✅ Bot logic completed successfully');
    
  }).catch((err) => {
    console.error('\n=== ADAPTER ERROR DETAILS ===');
    console.error('❌ Error in adapter.processActivity:');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Code:', err.code);
    console.error('Error Status:', err.status);
    console.error('Error Body:', err.body);
    console.error('Full Error Object:', err);
    console.error('Error Stack:', err.stack);
    console.error('=============================\n');
    
    // Send more detailed error response
    const errorResponse = {
      error: 'Bot processing failed',
      message: err.message,
      timestamp: new Date().toISOString()
    };
    res.send(500, errorResponse);
  });
  
  console.log('=== REQUEST PROCESSING COMPLETE ===\n');
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