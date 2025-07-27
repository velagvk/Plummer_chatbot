# Microsoft Teams Chatbot with Azure OpenAI & Analytics

A Microsoft Teams chatbot powered by Azure OpenAI that provides intelligent conversations, ticket analytics, and IT support assistance in a professional workplace environment.

## 🌟 Features

### Core Bot Features
- 🤖 **AI-Powered Conversations**: Powered by Azure OpenAI for natural language understanding
- 💬 **Context-Aware Responses**: Maintains conversation history for better context
- 🏢 **Teams Integration**: Seamlessly integrates with Microsoft Teams channels
- 📱 **Adaptive Cards**: Rich interactive messages with cards and buttons
- 🔧 **Command System**: Built-in commands for help and conversation management

### Advanced Agent Features
- 🎯 **Support Agent**: IT support assistance with technical troubleshooting
- 📚 **Knowledge Retrieval Agent**: Search internal documents (coming soon)
- 📊 **Data Insights Agent**: Comprehensive ticket analytics and insights
- 🎫 **Smart Ticket Creation**: AI-powered ticket form generation
- 📈 **Ticket Status Inquiry**: Real-time ticket status checking
- 🤔 **Thinking Messages**: Progressive feedback during processing

### Analytics Capabilities
- 📊 **Ticket Analytics**: Advanced analytics on IT tickets with role-based access
- 🔍 **Intelligent Query Processing**: Natural language queries for data insights
- 👥 **Role-Based Access**: Different data access levels for IT Admin, Leadership, and Normal Users
- 📈 **Real-time Data**: Live ticket status and analytics from Power Automate integration

## 📋 Prerequisites

### For Teams Bot (Node.js)
- Node.js (v16 or higher)
- npm or yarn
- TypeScript
- Bot Framework Emulator (for local testing)

### For Analytics Service (Python)
- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Azure Services
1. **Azure OpenAI Service**: Create an Azure OpenAI resource
2. **Model Deployment**: Deploy a GPT model (e.g., GPT-4)
3. **Bot Registration**: Register your bot in Azure Bot Service
4. **Teams App**: Create a Teams app in Teams Developer Portal
5. **Power Automate**: Flows for ticket creation and retrieval

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/velagvk/Plummer_chatbot.git
cd Plummer_chatbot
```

### 2. Setup Teams Bot (Node.js)

#### Install Dependencies
```bash
npm install
```

#### Configure Environment Variables
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
BOT_ID=your-bot-app-id
BOT_PASSWORD=your-bot-app-password
BOT_TENANT_ID=your-tenant-id

# Teams Configuration
TEAMS_APP_ID=your-teams-app-id
TEAMS_APP_PASSWORD=your-teams-app-password

# Server Configuration
PORT=3978
NODE_ENV=development
```

### 3. Setup Analytics Service (Python)

#### Create Virtual Environment
```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate
```

#### Install Python Dependencies
```bash
pip install flask pandas requests python-dotenv azure-openai
```

#### Configure Analytics Service
The analytics service reads from the same `.env` file and requires:
- Azure OpenAI configuration
- Access to your Power Automate flows for ticket data
- IT-Tickets.csv file for ticket analytics

## 🔧 Running the Application

### Option 1: Run Both Services Separately

#### Terminal 1: Start the Analytics Service (Python)
```bash
# Activate virtual environment
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# Start the Python Flask analytics service
python analytics_service.py

# You should see output like:
# * Running on http://127.0.0.1:5001
# * Debug mode: off
# * Press CTRL+C to quit
```

**The analytics service will run on `http://localhost:5001`**

**Key endpoints:**
- `POST /analyze` - Process analytics queries
- `GET /health` - Health check endpoint

#### Terminal 2: Start the Teams Bot (Node.js)
```bash
# Build TypeScript
npm run build

# Start the bot server
npm start

# You should see output like:
# restify listening to http://[::]:3978
# Get Bot Framework Emulator: https://aka.ms/botframework-emulator
```

**The bot will run on `http://localhost:3978`**

### Option 2: Development Mode (Recommended)

#### Terminal 1: Analytics Service (Python with Debug)
```bash
# Activate virtual environment
source .venv/bin/activate

# Run with Python debug mode for development
export FLASK_ENV=development  # Enable auto-reload
python analytics_service.py

# The server will automatically restart when you make changes to analytics_service.py
```

#### Terminal 2: Bot Development Server (Node.js with Auto-reload)
```bash
# Start with nodemon for automatic reloading
npm run dev

# This will automatically restart when you make changes to TypeScript files
```

### Option 3: Using Docker (Production)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### 🔍 Verify Both Services Are Running

#### Check Python Analytics Service
```bash
# Test if analytics service is responding
curl http://localhost:5001/health

# Should return: {"status": "healthy", "service": "analytics"}

# Test analytics endpoint
curl -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me all tickets", 
    "user_role": "IT Admin",
    "user_email": "admin@company.com",
    "history": []
  }'
```

#### Check Bot Service
```bash
# Test if bot service is responding
curl http://localhost:3978/api/messages

# Should return bot framework response
```

#### Check Both Services at Once
```bash
# Check what's running on the required ports
lsof -i :5001  # Analytics service
lsof -i :3978  # Bot service

# Should show Python and Node processes
```

## 🧪 Testing

### Test with Bot Framework Emulator
1. Download [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator)
2. Open emulator and connect to `http://localhost:3978/api/messages`
3. Test different agent types:
   - Select "Support Agent" for IT support
   - Select "Data insights Agent" for analytics
   - Select "Knowledge retrieval Agent" for document search

### Test Analytics Service Directly
```bash
# Test analytics endpoint
curl -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me open tickets",
    "user_role": "IT Admin",
    "user_email": "user@company.com",
    "history": []
  }'
```

## 🎯 Usage Guide

### Bot Commands
- `/help` - Show help information
- `/clear` - Clear conversation history

### Agent Types

#### 🎯 Support Agent
- Technical troubleshooting assistance
- Step-by-step problem resolution
- Automatic ticket creation for unresolved issues
- Real-time thinking messages during processing

#### 📊 Data Insights Agent  
- Natural language queries for ticket analytics
- Role-based data access (IT Admin, Leadership, Normal User)
- Real-time ticket status updates
- Advanced filtering and reporting

#### 📚 Knowledge Retrieval Agent
- Internal document search (coming soon)
- Knowledge base integration
- FAQ and documentation lookup

### Sample Queries for Data Insights Agent

```
"Show me all open tickets"
"How many tickets were created this month?"
"What's the status of my tickets?"
"Show tickets assigned to John Smith"
"What are the most common ticket types?"
```

## 🔒 Security & Role-Based Access

### User Roles
- **IT Admin**: Full access to all tickets and analytics
- **Leadership**: Access to organizational analytics and reports
- **Normal User**: Access only to their own tickets

### Data Protection
- Environment variables for sensitive configuration
- Role-based data filtering in analytics service
- Secure Power Automate integration
- No secrets in repository (uses placeholder values)

## 🛠️ Development

### Project Structure
```
Plummer_chatbot/
├── src/
│   ├── bot.ts              # Main bot logic
│   ├── index.ts            # Bot server startup
│   ├── types/index.ts      # TypeScript type definitions
│   └── utils/config.ts     # Configuration utilities
├── analytics_service.py    # Python analytics service
├── IT-Tickets.csv         # Sample ticket data
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── env.example            # Environment template
└── README.md              # This file
```

### Key Features Implementation

#### Progressive Thinking Messages
The bot shows real-time feedback:
- 🤔 "Understanding your request..."
- 🔍 "Analyzing conversation..."
- 🔧 "Generating technical solution..."
- 📊 "Processing analytics query..."

#### Intent Classification
AI-powered classification routes queries to appropriate handlers:
- Technical support issues
- Ticket status inquiries  
- General conversations
- Direct ticket creation requests

#### Ticket Integration
- Power Automate flows for ticket CRUD operations
- Automatic form pre-filling from conversation context
- Real-time status updates

## 🐛 Troubleshooting

### Common Issues

#### Bot Not Responding
```bash
# Check if both services are running
curl http://localhost:3978/api/messages  # Bot service
curl http://localhost:5001/health        # Analytics service

# Check environment variables
echo $AZURE_OPENAI_ENDPOINT
echo $AZURE_OPENAI_API_KEY
```

#### Analytics Service Issues
```bash
# Check Python environment
python --version
pip list | grep flask

# Test analytics service
python analytics_service.py
```

#### Port Conflicts
```bash
# Check what's running on ports
lsof -i :3978  # Bot service
lsof -i :5001  # Analytics service

# Kill processes if needed
kill -9 <PID>
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=botbuilder:*
export NODE_ENV=development
npm run dev
```

## 🚀 Deployment

### Azure Deployment
1. Deploy bot service to Azure App Service
2. Deploy analytics service to Azure Container Instances or App Service
3. Configure environment variables in Azure
4. Update Power Automate flows with production URLs

### Environment Variables for Production
```env
NODE_ENV=production
PORT=443
AZURE_OPENAI_ENDPOINT=https://your-prod-resource.openai.azure.com/
# ... other production configs
```

## 📚 API Documentation

### Analytics Service Endpoints

#### POST /analyze
Analyze tickets based on natural language query
```json
{
  "query": "Show me open tickets",
  "user_role": "IT Admin",
  "user_email": "user@company.com",
  "history": []
}
```

#### GET /health
Health check endpoint for monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Test both bot and analytics services
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support:
- 📖 Check Microsoft Teams documentation
- 🔗 Review Azure OpenAI documentation  
- 🐛 Open an issue in this repository
- 💬 Contact the development team

---

**Made with ❤️ for intelligent IT support and analytics** 