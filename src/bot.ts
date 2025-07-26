import {
  ActivityTypes,
  BotFrameworkAdapter,
  MemoryStorage,
  TurnContext,
  UserState,
  ConversationState,
  StatePropertyAccessor,
  MessageFactory,
  CardFactory,
  TeamsActivityHandler,
  TeamsInfo,
  TeamInfo,
  ChannelInfo
} from 'botbuilder';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import * as dotenv from 'dotenv';
import { ConversationData, ConversationMessage } from './types';
import axios from 'axios';

dotenv.config();

export class TeamsOpenAIBot extends TeamsActivityHandler {
  private conversationDataAccessor: StatePropertyAccessor<ConversationData>;
  private userProfileAccessor: StatePropertyAccessor<any>;
  private openAIClient: OpenAIClient;
  private conversationState: ConversationState;
  private userState: UserState;

  constructor(conversationState: ConversationState, userState: UserState) {
    super();

    // Store state references
    this.conversationState = conversationState;
    this.userState = userState;

    // Initialize Azure OpenAI client
    this.openAIClient = new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT!,
      new AzureKeyCredential(process.env.AZURE_OPENAI_API_KEY!)
    );

    // Create state property accessors
    this.conversationDataAccessor = conversationState.createProperty<ConversationData>('ConversationData');
    this.userProfileAccessor = userState.createProperty('UserProfile');

    // Handle members added to conversation
    this.onMembersAdded(async (context: TurnContext, next: () => Promise<void>) => {
      const membersAdded = context.activity.membersAdded ?? [];
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await this.sendWelcomeMessage(context);
        }
      }
      await next();
    });

    // Handle message activities
    this.onMessage(async (context: TurnContext, next: () => Promise<void>) => {
      // Get conversation state
      const conversationData = await this.conversationDataAccessor.get(context, { 
        messages: [], 
        currentMode: 'none',
        userRole: undefined,
        userEmail: undefined,
        waitingForTicketConfirmation: false,
        pendingTicketContext: undefined
      });

      // Handle card submissions for role selection
      if (context.activity.value && context.activity.value.action === 'selectRole') {
        conversationData.userRole = context.activity.value.role;
        await this.conversationDataAccessor.set(context, conversationData);
        await this.conversationState.saveChanges(context);
        console.log('Role set to:', context.activity.value.role);
        await this.sendModeSelectionCard(context, context.activity.value.role);
        return; // Stop processing after handling the card
      }

      // Handle card submissions for mode selection
      if (context.activity.value && context.activity.value.action === 'selectMode') {
        conversationData.currentMode = context.activity.value.mode;
        await this.conversationDataAccessor.set(context, conversationData);
        await this.conversationState.saveChanges(context);
        console.log('Mode set to:', context.activity.value.mode);
        
        // Send custom message based on selected agent
        let responseMessage: string;
        switch (context.activity.value.mode) {
          case 'Support Agent':
            responseMessage = "Hi, I am your IT support Agent, how may I help you today?";
            break;
          case 'Data insights Agent':
            responseMessage = "Hi, I am your Data insights Agent, how may I help you today?";
            break;
          case 'Knowledge retrieval Agent':
            responseMessage = "Hi, I am your Knowledge retrieval Agent, how may I help you today?";
            break;
          default:
            responseMessage = `You have selected **${context.activity.value.mode}**. How can I help you today?`;
        }
        
        await context.sendActivity(responseMessage);
        return; // Stop processing after handling the card
      }

      await this.handleMessage(context);
      await this.conversationState.saveChanges(context);
      await next();
    });

    /**
     * Teams-specific channel or team events can be handled here if needed.
     * Uncomment and adjust the following handlers if your bot scenario requires them
     * and ensure the appropriate SDK methods are available in your botbuilder version.
     */
    // Example:
    // this.onTeamsChannelCreated(async (context: TurnContext, channelInfo: ChannelInfo, teamInfo: TeamInfo, next: () => Promise<void>) => {
    //   await this.sendChannelCreatedMessage(context, channelInfo, teamInfo);
    //   await next();
    // });
  }

  private async sendModeSelectionCard(context: TurnContext, userRole: string): Promise<void> {
    const modeCard = CardFactory.adaptiveCard({
      type: 'AdaptiveCard',
      version: '1.2',
      body: [
        {
          type: 'TextBlock',
          text: `Welcome ${userRole}! 👋`,
          size: 'Large',
          weight: 'Bolder'
        },
        {
          type: 'TextBlock',
          text: 'Please select how you would like to use the assistant:',
          wrap: true
        }
      ],
      actions: [
        {
          type: 'Action.Submit',
          title: 'Support Agent',
          data: { action: 'selectMode', mode: 'Support Agent' }
        },
        {
          type: 'Action.Submit',
          title: 'Knowledge retrieval Agent',
          data: { action: 'selectMode', mode: 'Knowledge retrieval Agent' }
        },
        {
          type: 'Action.Submit',
          title: 'Data insights Agent',
          data: { action: 'selectMode', mode: 'Data insights Agent' }
        }
      ]
    });

    await context.sendActivity({ attachments: [modeCard] });
  }

  private async sendWelcomeMessage(context: TurnContext): Promise<void> {
    const welcomeCard = CardFactory.adaptiveCard({
      type: 'AdaptiveCard',
      version: '1.2',
      body: [
        {
          type: 'TextBlock',
          text: 'Welcome to the AI Assistant! 🤖',
          size: 'Large',
          weight: 'Bolder'
        },
        {
          type: 'TextBlock',
          text: 'Please select your role to get started:',
          wrap: true
        },
        {
          type: 'TextBlock',
          text: '• **IT Admin**: Full access to all ticket analytics and system management',
          wrap: true,
          size: 'Small'
        },
        {
          type: 'TextBlock',
          text: '• **Leadership**: Can view analytics for all tickets across the organization',
          wrap: true,
          size: 'Small'
        },
        {
          type: 'TextBlock',
          text: '• **Normal User**: Can view analytics only for tickets you have created',
          wrap: true,
          size: 'Small'
        }
      ],
      actions: [
        {
          type: 'Action.Submit',
          title: 'IT Admin',
          data: { action: 'selectRole', role: 'IT Admin' }
        },
        {
          type: 'Action.Submit',
          title: 'Leadership',
          data: { action: 'selectRole', role: 'Leadership' }
        },
        {
          type: 'Action.Submit',
          title: 'Normal User',
          data: { action: 'selectRole', role: 'Normal User' }
        }
      ]
    });

    await context.sendActivity({ attachments: [welcomeCard] });
  }

  private async handleMessage(context: TurnContext): Promise<void> {
    // 1. Handle the incoming card submission
    if (context.activity.value && context.activity.value.action === 'saveTicket') {
      await context.sendActivity('⚙️ Processing ticket submission...');
      await context.sendActivity('Submitting your ticket, please wait a moment...');
      
      const formData = context.activity.value;
      
      // Call our new method to trigger the Power Automate flow
      const flowResponse = await this.triggerTicketFlow(context, formData);

      if (flowResponse && flowResponse.ticketId) {
        // SUCCESS: The flow ran and returned a ticket ID.
        const confirmationMessage = `### ✅ IT Support Ticket Created\n\nThank you! Your ticket has been successfully created with **Ticket ID: ${flowResponse.ticketId}**. An IT technician will be in touch shortly.`;
        await context.sendActivity(confirmationMessage);
      } else {
        // FAILURE: Something went wrong.
        const errorMessage = '❌ There was an error creating your ticket. Please try again or contact the IT Help Desk directly.';
        await context.sendActivity(errorMessage);
      }
      
      return; // Stop processing
    }

    // Add a guard clause to ensure text exists
    if (!context.activity.text) {
      return;
    }
    
    const text = context.activity.text.toLowerCase().trim();

    // Handle commands first, regardless of mode
    if (text === '/help') {
      await this.sendHelpMessage(context);
      return;
    }

    if (text === '/clear') {
      await this.clearConversationHistory(context);
      return;
    }

    // Get conversation state to check the mode
    const conversationData = await this.conversationDataAccessor.get(context, { 
      messages: [], 
      currentMode: 'none',
      userRole: undefined,
      userEmail: undefined,
      waitingForTicketConfirmation: false,
      pendingTicketContext: undefined
    });

    console.log('Current mode for user query:', conversationData.currentMode);
    console.log('User query:', context.activity.text);

    // Route based on the selected mode
    switch (conversationData.currentMode) {
      case 'Knowledge retrieval Agent':
        await context.sendActivity("🔍 Thinking...");
        await context.sendActivity("This is a placeholder for searching internal documents. This feature is coming soon!");
        return;
      case 'Data insights Agent':
        console.log('Executing analytics case for query:', context.activity.text);
        
        // Check if user has selected a role
        if (!conversationData.userRole) {
          await context.sendActivity('Please select your role first by using the welcome card.');
          return;
        }
        
        await context.sendActivity('🧠 Analyzing your request, please wait a moment...');
        try {
          // Get user email (try from Teams, fallback to default)
          let userEmail = 'unknown@example.com';
          try {
            if (context.activity.channelId === 'msteams') {
              const member = await TeamsInfo.getMember(context, context.activity.from.id);
              userEmail = member.email || member.userPrincipalName || 'unknown@example.com';
            } else {
              // For emulator testing, use a default email
              userEmail = 'vkumar9174@plummer.com';
            }
          } catch (emailError) {
            console.log('Could not get user email, using default');
          }
          
          console.log(`Analytics request for ${conversationData.userRole} (${userEmail})`);
          
          // Prepare the history to be sent to the analytics service
          const history = conversationData.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));

          const analyticsResponse = await axios.post('http://127.0.0.1:5001/analyze', {
            query: context.activity.text,
            history: history,
            user_role: conversationData.userRole,
            user_email: userEmail
          });
          
          console.log('Full analytics response:', JSON.stringify(analyticsResponse.data, null, 2));
      
          if (analyticsResponse.data && analyticsResponse.data.result) {
            // Send the text result back to the user
            console.log('Analytics service response:', analyticsResponse.data.result);
            await context.sendActivity(analyticsResponse.data.result);
          } else {
            console.log('No result in analytics response:', analyticsResponse.data);
            await context.sendActivity("Sorry, I couldn't get an analysis for that. Please try rephrasing your question.");
          }
        } catch (error: any) {
          console.error('Error calling analytics service:', error.message);
          await context.sendActivity('Sorry, the analytics service is currently unavailable. Please try again later.');
        }
        return;
      case 'Support Agent':
      default:
        console.log('Executing general purpose/default case for mode:', conversationData.currentMode);
        
        // Check if we're waiting for ticket confirmation
        if (conversationData.waitingForTicketConfirmation) {
          const userText = context.activity.text.toLowerCase().trim();
          if (userText.includes('yes') || userText.includes('sure') || userText.includes('go ahead') || 
              userText.includes('okay') || userText.includes('ok') || userText.includes('please')) {
            // User confirmed - analyze conversation and create ticket
            conversationData.waitingForTicketConfirmation = false;
            await this.conversationDataAccessor.set(context, conversationData);
            
            await context.sendActivity('🔍 Analyzing conversation...');
            await context.sendActivity('Perfect! Let me analyze our conversation and prepare a ticket for you...');
            
            const extractedDetails = await this.extractTicketDetailsFromConversation(conversationData.messages);
            await this.sendTicketForm(context, extractedDetails);
            return;
          } else if (userText.includes('no') || userText.includes('not') || userText.includes('cancel')) {
            // User declined
            conversationData.waitingForTicketConfirmation = false;
            await this.conversationDataAccessor.set(context, conversationData);
            await context.sendActivity("No problem! Feel free to ask if you need any other assistance.");
            return;
          }
          // If unclear response, continue with normal flow
        }

        // Add user message to history
        conversationData.messages.push({
          role: 'user',
          content: context.activity.text,
          timestamp: new Date().toISOString()
        });

        try {
          // Classify the user's intent using AI
          await context.sendActivity('🤔 Understanding your request...');
          const intentClassification = await this.classifyUserIntent(context.activity.text, conversationData.messages);
          console.log('User intent classified as:', intentClassification.responseType);

          let response: string;

          switch (intentClassification.responseType) {
            case 'direct_ticket':
              // User wants to create a ticket immediately
              await context.sendActivity('📝 Preparing ticket form...');
              const directTicketDetails = await this.extractTicketDetailsFromConversation(conversationData.messages);
              await this.sendTicketForm(context, directTicketDetails);
              return;

            case 'technical_support':
              // Provide technical support with ticket option
              await context.sendActivity('🔧 Generating technical solution...');
              response = await this.generateTechnicalSupportResponse(context.activity.text, conversationData.messages);
              
              // Set flag to wait for ticket confirmation
              conversationData.waitingForTicketConfirmation = true;
              break;

            case 'ticket_status_inquiry':
                          // User is asking about their ticket status
            await context.sendActivity('🔍 Searching for your tickets...');
            await context.sendActivity('Let me check your ticket status, please wait a moment...');
              
              // Get user email (try from Teams, fallback to default)
              let userEmail = 'unknown@example.com';
              try {
                if (context.activity.channelId === 'msteams') {
                  const member = await TeamsInfo.getMember(context, context.activity.from.id);
                  userEmail = member.email || member.userPrincipalName || 'unknown@example.com';
                } else {
                  // For emulator testing, use a default email
                  userEmail = 'vkumar9174@plummer.com';
                }
              } catch (emailError) {
                console.log('Could not get user email, using default');
              }
              
              console.log(`Fetching tickets for ${userEmail}`);
              
              // Fetch user's tickets from Power Automate
              const userTickets = await this.fetchUserTickets(userEmail);
              
              // Process the ticket inquiry with OpenAI
              response = await this.processTicketStatusInquiry(context.activity.text, userTickets, conversationData.messages);
              break;

            case 'general_conversation':
            default:
              // Regular conversational response
              await context.sendActivity('💭 Thinking...');
              response = await this.generateOpenAIResponse(context.activity.text, conversationData.messages);
              break;
          }

          // Add bot response to history
          conversationData.messages.push({
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString()
          });

          // Keep only last 10 messages to manage context length
          if (conversationData.messages.length > 10) {
            conversationData.messages = conversationData.messages.slice(-10);
          }
          
          await this.conversationDataAccessor.set(context, conversationData);
          await context.sendActivity(response);

        } catch (error) {
          console.error('Error in intelligent response generation:', error);
          await context.sendActivity('Sorry, I encountered an error while processing your request. Please try again.');
        }
        break; 
    }
    
    // Save conversation state after processing
    await this.conversationState.saveChanges(context);
  }

  private async triggerTicketFlow(context: TurnContext, formData: any): Promise<any> {
    // 1. Your Power Automate Flow URL
    const powerAutomateUrl = 'https://prod-19.westus.logic.azure.com:443/workflows/880a6044d7e84af299a58fd28f6441af/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=2bw8qjIiWBW9qvZLLxlMhgVLR7e48pOnPaZ9AyMLB7A';

    // Set default user details for emulator or in case of failure
    let creatorEmail = 'vkumar9174@plummer.com';
    let creatorDisplayName = 'Emulator User';

    try {
        // Only try to fetch Teams user details if the bot is running in a real Teams channel
        if (context.activity.channelId === 'msteams') {
            console.log("Running in Teams, attempting to fetch member details...");
            const member = await TeamsInfo.getMember(context, context.activity.from.id);
            creatorEmail = member.email || member.userPrincipalName || 'vkumar9174@plummer.com'; // Fallback just in case
            creatorDisplayName = member.name || 'Teams User'; // Fallback just in case
        } else {
            console.log("Running in Emulator, using default user details.");
        }

        // 3. Construct the JSON payload that your Power Automate flow expects.
        const ticketPayload = {
            title: formData.ticketTitle,
            supportRequest: formData.supportRequest,
            ticketType: "Technical Support", // You can make this a field in your card later
            ticketClass: "Software", // You can make this a field in your card later
            itTechScope: formData.scope,
            itTechImpact: formData.impact,
            assignedToEmail: "", // Leave empty or assign to a default queue/person
            status: "New",
            creatorDisplayName: creatorDisplayName,
            creatorEmail: creatorEmail,
            // The bot doesn't need to send all these individual fields if you use the
            // "Get user profile" action in Power Automate. Sending the email is enough.
            creatorFirstName: creatorDisplayName.split(' ')[0], 
            creatorLastName: creatorDisplayName.split(' ').slice(1).join(' '),
            creatorJobTitle: "",
            creatorDepartment: "",
            creatorOffice: "",
            creatorMobilePhone: "",
            createdForEmail: creatorEmail, // Defaulting to the creator. Can be changed.
            indexId: 0,
            vLeadership: "No",
            ticketNotes: formData.ticketNotes,
            attachments: []
        };

        // 4. Send the POST request to Power Automate
        console.log('Sending data to Power Automate:', ticketPayload);
        const response = await axios.post(powerAutomateUrl, ticketPayload, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('Power Automate responded successfully.');
        return response.data; // This will contain { status: "Success", ticketId: 12345 }
    } catch (error: any) {
        console.error('Error in triggerTicketFlow:', error.response?.data || error.message);
        return null; // Return null to indicate failure
    }
  }

  private async sendTicketForm(context: TurnContext, details: { 
    title: string; 
    impact: string; 
    supportRequest?: string;
    scope?: string;
  } = { title: '', impact: 'Slight' }): Promise<void> {
    const userRequest = context.activity.text;
    const ticketFormCard = CardFactory.adaptiveCard({
      "type": "AdaptiveCard",
      "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
      "version": "1.2",
      "body": [
          {
              "type": "ColumnSet",
              "columns": [
                  {
                      "type": "Column",
                      "width": "auto",
                      "items": [
                          {
                              "type": "Image",
                              "url": "https://raw.githubusercontent.com/microsoft/botframework-sdk/main/icon.png",
                              "size": "Small",
                              "altText": "Plummer Logo"
                          }
                      ]
                  },
                  {
                      "type": "Column",
                      "width": "stretch",
                      "items": [
                          {
                              "type": "TextBlock",
                              "text": "Plummer IT Ticket System",
                              "weight": "Bolder",
                              "size": "Medium"
                          },
                          {
                              "type": "TextBlock",
                              "text": "Welcome Vijay Kumar",
                              "isSubtle": true,
                              "spacing": "None"
                          }
                      ]
                  }
              ]
          },
          {
              "type": "TextBlock",
              "text": "Ticket Title",
              "weight": "Bolder"
          },
          {
              "type": "Input.Text",
              "id": "ticketTitle",
              "placeholder": "Title your support request (Limited to 35 characters)",
              "maxLength": 35,
              "value": details.title
          },
          {
            "type": "TextBlock",
            "text": "Support Request",
            "weight": "Bolder"
          },
          {
            "type": "Input.Text",
            "id": "supportRequest",
            "isMultiline": true,
            "value": details.supportRequest || userRequest,
            "placeholder": "Please describe what support you need"
          },
          {
            "type": "ColumnSet",
            "columns": [
                {
                    "type": "Column",
                    "width": "stretch",
                    "items": [
                        { "type": "TextBlock", "text": "Scope", "weight": "Bolder" },
                        {
                            "type": "Input.ChoiceSet", "id": "scope", "value": details.scope || "Access",
                            "choices": [
                                { "title": "Access (New, Mod, Del, Reset, etc)", "value": "Access" },
                                { "title": "Account (New, Mod, Del, etc.)", "value": "Account" },
                                { "title": "Asset Recovery (Hardware Returns)", "value": "Asset Recovery" },
                                { "title": "Audio/Video (Conf Rooms, Peripheral, etc)", "value": "Audio/Video" },
                                { "title": "Authentication (Login, Account, MFA, PW, etc)", "value": "Authentication" },
                                { "title": "Data (Sync, Backup, Restore, Transfer, etc)", "value": "Data" },
                                { "title": "Facility (Security, Power, Cabling, etc)", "value": "Facility" }
                            ]
                        }
                    ]
                },
                {
                    "type": "Column", "width": "stretch",
                    "items": [
                        { "type": "TextBlock", "text": "Impact", "weight": "Bolder" },
                        {
                            "type": "Input.ChoiceSet", "id": "impact", "value": details.impact,
                            "choices": [
                                { "title": "No productivity loss", "value": "None" },
                                { "title": "Slight loss of productivity", "value": "Slight" },
                                { "title": "Some loss of productivity", "value": "Some" },
                                { "title": "Significant loss of productivity", "value": "Significant" },
                                { "title": "Unable to work", "value": "Blocking" },
                                { "title": "Improve productivity", "value": "Improvement" }
                            ]
                        }
                    ]
                }
            ]
        },
        {
          "type": "TextBlock",
          "text": "Ticket Notes - Submit Additional Notes Here",
          "weight": "Bolder"
        },
        {
          "type": "Input.Text",
          "id": "ticketNotes",
          "isMultiline": true,
          "placeholder": "Enter any additional notes here"
        }
      ],
      "actions": [
        {
          "type": "Action.Submit",
          "title": "Save Ticket",
          "style": "positive",
          "data": {
            "action": "saveTicket"
          }
        }
      ]
    });
    await context.sendActivity({ attachments: [ticketFormCard] });
  }

  private async classifyUserIntent(userQuery: string, conversationHistory: ConversationMessage[]): Promise<{
    responseType: 'technical_support' | 'general_conversation' | 'direct_ticket' | 'ticket_status_inquiry';
    reasoning: string;
  }> {
    try {
      // Get recent conversation context
      const recentContext = conversationHistory
        .slice(-4) // Last 4 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const classificationPrompt = `You are an intelligent IT support assistant that classifies user queries to determine the appropriate response strategy.

RECENT CONVERSATION:
${recentContext}

CURRENT USER QUERY: "${userQuery}"

Analyze the user's query and classify it into one of these categories:

1. **technical_support**: User has a technical problem that needs troubleshooting steps AND might require an IT ticket if solutions don't work
   - Examples: "My computer is slow", "I can't access email", "Software won't open", "Network issues"
   
2. **general_conversation**: General questions, greetings, or non-technical queries
   - Examples: "Hello", "How are you?", "What can you do?", "Thank you"
   
3. **direct_ticket**: User explicitly wants to create a ticket immediately
   - Examples: "Create a ticket", "I need to raise a ticket", "File a support request"

4. **ticket_status_inquiry**: User is asking about the status of their existing tickets or wants to check their submitted tickets
   - Examples: "What's the status of my ticket?", "Check my ticket status", "Has my ticket been resolved?", "Show me my tickets", "What tickets do I have open?"

IMPORTANT: Only classify as 'technical_support' if the user describes an actual technical problem that would benefit from troubleshooting steps.

Respond with ONLY a JSON object in this format:
{
  "responseType": "technical_support|general_conversation|direct_ticket|ticket_status_inquiry",
  "reasoning": "Brief explanation of why you chose this classification"
}`;

      const result = await this.openAIClient.getChatCompletions(
        process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
        [{ role: 'system', content: classificationPrompt }],
        { maxTokens: 150, temperature: 0.1 }
      );

      const jsonResponse = result.choices[0]?.message?.content;
      if (jsonResponse) {
        const jsonMatch = jsonResponse.match(/{.*}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('Intent classification:', parsed);
          return {
            responseType: parsed.responseType || 'general_conversation',
            reasoning: parsed.reasoning || 'Default classification'
          };
        }
      }
    } catch (error) {
      console.error('Error in intent classification:', error);
    }
    
    // Fallback classification
    return {
      responseType: 'general_conversation',
      reasoning: 'Fallback due to classification error'
    };
  }

  private async fetchUserTickets(userEmail: string): Promise<any[]> {
    try {
      const powerAutomateUrl = 'https://prod-76.westus.logic.azure.com:443/workflows/c3aff0f092ae4d7ba7dcb3b2b6b8a6f8/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-xtL9wYiVsStTJdMnBmptAzXAuVvLEAtWauvTqqP3_g';
      
      console.log('Fetching tickets for user:', userEmail);
      
      const response = await axios.post(powerAutomateUrl, {
        creatorEmail: userEmail
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Power Automate tickets response:', response.data);
      
      // Assuming the response contains an array of tickets
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching user tickets:', error.response?.data || error.message);
      return [];
    }
  }

  private async processTicketStatusInquiry(userQuery: string, tickets: any[], conversationHistory: ConversationMessage[]): Promise<string> {
    try {
      // Format ticket data for AI processing - handle SharePoint data format
      const ticketSummary = tickets.length > 0 
        ? tickets.map((ticket, index) => {
            // Handle SharePoint Status object format
            const status = ticket.Status?.Value || ticket.Status?.value || ticket.Status || 'N/A';
            const assignedTo = ticket.Assigned?.Title || ticket.Assigned?.DisplayName || ticket.AssignedTo || 'Unassigned';
            
            return `Ticket ${index + 1}:
- ID: ${ticket.ID || ticket.id || 'N/A'}
- Title: ${ticket.Title || ticket.title || 'N/A'}
- Status: ${status}
- Created: ${ticket.Created || ticket.created || ticket.modified || 'N/A'}
- Description: ${ticket.Description || ticket.description || ticket.Support_Request || 'N/A'}
- Priority: ${ticket.Priority?.Value || ticket.Priority?.value || ticket.Priority || 'N/A'}
- Assigned To: ${assignedTo}
- Last Modified: ${ticket.modified || ticket.Modified || 'N/A'}`;
          }).join('\n\n')
        : 'No tickets found for this user.';

      // Add conversation history context
      const conversationContext = conversationHistory
        .slice(-3) // Last 3 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const systemPrompt = `You are a helpful IT support assistant that answers questions about user tickets.

CONVERSATION HISTORY:
${conversationContext}

USER'S TICKETS:
${ticketSummary}

USER'S QUESTION: "${userQuery}"

Instructions:
- Answer the user's question about their tickets based on the provided ticket data
- Be specific and reference ticket IDs, titles, and statuses when relevant
- If no tickets are found, politely explain that no tickets were found for their account
- If they ask about a specific ticket that doesn't exist, let them know
- Provide helpful information about ticket statuses and next steps
- Be professional and concise
- For status values like "1. New", "2. In Progress", etc., use the descriptive part (e.g., "New", "In Progress")

Provide a helpful response to their question:`;

      const result = await this.openAIClient.getChatCompletions(
        process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
        [{ role: 'system', content: systemPrompt }],
        {
          maxTokens: 500,
          temperature: 0.3,
          topP: 0.95,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      );

      return result.choices[0]?.message?.content || 'I apologize, but I couldn\'t process your ticket inquiry at this time.';
    } catch (error) {
      console.error('Error processing ticket status inquiry:', error);
      return 'I encountered an error while checking your ticket status. Please try again later.';
    }
  }

  private async generateTechnicalSupportResponse(userQuery: string, conversationHistory: ConversationMessage[]): Promise<string> {
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      {
        role: 'system',
        content: `You are a professional IT Help Desk agent. Your role is to provide helpful troubleshooting steps for technical issues.

IMPORTANT: After providing your technical solution, you MUST end your response with exactly this text:

"---

If these steps don't resolve the issue, I can help you create an IT support ticket. Would you like me to prepare a ticket for you?"

Guidelines:
- Provide clear, step-by-step troubleshooting instructions
- Be professional and helpful
- Focus on common solutions first
- Always end with the ticket creation offer using the exact text above`
      }
    ];

    // Add conversation history
    conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    const result = await this.openAIClient.getChatCompletions(
      process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages,
      {
        maxTokens: 500,
        temperature: 0.7,
        topP: 0.95,
        frequencyPenalty: 0,
        presencePenalty: 0
      }
    );

    return result.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a technical response at this time.';
  }

  private async extractTicketDetailsFromConversation(conversationHistory: ConversationMessage[]): Promise<{ 
    title: string; 
    supportRequest: string; 
    impact: string;
    scope: string;
  }> {
    try {
      // Create a summary of the conversation focused on the technical issue
      const conversationSummary = conversationHistory
        .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && !msg.content.includes('Would you like me to prepare a ticket')))
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const extractionPrompt = `You are an expert at analyzing IT support conversations to extract ticket information.

CONVERSATION HISTORY:
${conversationSummary}

Based on this conversation, extract the following information for an IT support ticket:

1. **ticketTitle**: A concise, professional title (max 35 characters)
2. **supportRequest**: A detailed description combining the user's problem and any troubleshooting attempted
3. **impact**: Choose from: "None", "Slight", "Some", "Significant", "Blocking", "Improvement"
4. **scope**: Choose from: "Access", "Account", "Asset Recovery", "Audio/Video", "Authentication", "Data", "Facility"

Consider:
- What is the main technical problem?
- What troubleshooting was already attempted?
- How severely is this affecting the user's work?
- What category does this fall under?

Return ONLY a valid JSON object:
{
  "ticketTitle": "Brief description of issue",
  "supportRequest": "Detailed description including problem and attempted solutions",
  "impact": "Impact level",
  "scope": "Most appropriate scope category"
}`;

      const result = await this.openAIClient.getChatCompletions(
        process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
        [{ role: 'system', content: extractionPrompt }],
        { maxTokens: 400, temperature: 0.1 }
      );

      const jsonResponse = result.choices[0]?.message?.content;
      if (jsonResponse) {
        const jsonMatch = jsonResponse.match(/{.*}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            title: parsed.ticketTitle || 'IT Support Request',
            supportRequest: parsed.supportRequest || 'User needs technical assistance',
            impact: parsed.impact || 'Some',
            scope: parsed.scope || 'Access'
          };
        }
      }
    } catch (error) {
      console.error('Error extracting ticket details from conversation:', error);
    }
    
    // Fallback
    const userMessages = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ');
    
    return {
      title: 'IT Support Request',
      supportRequest: userMessages || 'User needs technical assistance',
      impact: 'Some',
      scope: 'Access'
    };
  }

  private async extractTicketDetails(userMessage: string): Promise<{ title: string; impact: string }> {
    try {
      const systemPrompt = `You are an intelligent text analysis assistant for an IT Help Desk. Your task is to analyze the following user's request and extract key information to pre-fill a support ticket.

The user's request is:
"${userMessage}"

Analyze the request and extract the following fields:
1.  ticketTitle: A short, descriptive title for the issue (max 5-7 words).
2.  impact: Analyze the user's sentiment and situation to determine the impact level. Choose ONLY from the following exact values: "None", "Slight", "Some", "Significant", "Blocking", "Improvement".

Return the result ONLY as a valid JSON object. Do not add any other text, explanation, or markdown formatting.

Example 1:
User Request: "Hi, I need to file a ticket. My monitor is flickering and it's making it hard to focus."
{"ticketTitle": "Flickering Monitor Issue", "impact": "Some"}

Example 2:
User Request: "I can't log in to the finance portal, I am completely blocked."
{"ticketTitle": "Cannot log in to finance portal", "impact": "Blocking"}
`;
      
      const result = await this.openAIClient.getChatCompletions(
        process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
        [{ role: 'system', content: systemPrompt }],
        { maxTokens: 100, temperature: 0.1 }
      );

      const jsonResponse = result.choices[0]?.message?.content;
      if (jsonResponse) {
        const jsonMatch = jsonResponse.match(/{.*}/s);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                title: parsed.ticketTitle || '',
                impact: parsed.impact || 'Slight'
            };
        }
      }
    } catch (error) {
      console.error('Error extracting ticket details from OpenAI:', error);
    }
    return { title: '', impact: 'Slight' };
  }

  private async generateOpenAIResponse(userMessage: string, conversationHistory: ConversationMessage[]): Promise<string> {
    try {
      // Prepare messages for OpenAI
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        {
          role: 'system',
          content: 'You are a friendly and professional IT Help Desk agent. Your primary goal is to assist users with their IT-related issues, such as software problems, hardware troubleshooting, network connectivity, and account access. Provide clear, step-by-step instructions. If you cannot solve a problem, you should advise the user on how to create a formal support ticket.'
        }
      ];

      // Add conversation history
      conversationHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      const result = await this.openAIClient.getChatCompletions(
        process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
        messages,
        {
          maxTokens: 500,
          temperature: 0.7,
          topP: 0.95,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      );

      return result.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response at this time.';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  private async sendHelpMessage(context: TurnContext): Promise<void> {
    const helpCard = CardFactory.adaptiveCard({
      type: 'AdaptiveCard',
      version: '1.0',
      body: [
        {
          type: 'TextBlock',
          text: '🤖 Azure OpenAI Teams Bot Help',
          size: 'Large',
          weight: 'Bolder'
        },
        {
          type: 'TextBlock',
          text: 'I\'m powered by Azure OpenAI and can help you with various tasks:',
          wrap: true
        },
        {
          type: 'TextBlock',
          text: '**Commands:**\n• `/help` - Show this help message\n• `/clear` - Clear conversation history\n\n**Features:**\n• Natural language conversations\n• Context-aware responses\n• Professional workplace assistance\n• Integration with Teams channels',
          wrap: true
        }
      ]
    });

    await context.sendActivity({ attachments: [helpCard] });
  }

  private async clearConversationHistory(context: TurnContext): Promise<void> {
    await this.conversationDataAccessor.set(context, { messages: [] });
    await context.sendActivity('✅ Conversation history cleared! I\'m ready for a fresh start.');
  }

  private async sendChannelCreatedMessage(context: TurnContext, channelInfo: ChannelInfo, teamInfo: TeamInfo): Promise<void> {
    const message = `Channel **${channelInfo.name}** was created in team **${teamInfo.name}**. I\'m here to help!`;
    await context.sendActivity(message);
  }

  private async sendChannelRenamedMessage(context: TurnContext, channelInfo: ChannelInfo, teamInfo: TeamInfo): Promise<void> {
    const message = `Channel was renamed to **${channelInfo.name}** in team **${teamInfo.name}**.`;
    await context.sendActivity(message);
  }

  private async sendTeamRenamedMessage(context: TurnContext, teamInfo: TeamInfo): Promise<void> {
    const message = `Team was renamed to **${teamInfo.name}**.`;
    await context.sendActivity(message);
  }

  private async sendTeamMemberAddedMessage(context: TurnContext, member: any, teamInfo: TeamInfo): Promise<void> {
    const message = `Welcome **${member.name}** to team **${teamInfo.name}**! I\'m here to help with any questions.`;
    await context.sendActivity(message);
  }
} 