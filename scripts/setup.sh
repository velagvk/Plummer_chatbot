#!/bin/bash

# Microsoft Teams OpenAI Bot Setup Script

echo "🤖 Setting up Microsoft Teams OpenAI Bot..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your configuration values"
else
    echo "✅ .env file already exists"
fi

# Create dist directory
mkdir -p dist

# Build the project
echo "🔨 Building TypeScript code..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your Azure OpenAI and Teams configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Test with Bot Framework Emulator at http://localhost:3978/api/messages"
echo ""
echo "For deployment instructions, see README.md" 