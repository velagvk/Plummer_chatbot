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

# This script downloads placeholder icons for the Teams application manifest.

# URL for a generic blue square placeholder icon (192x192)
COLOR_ICON_URL="https://placehold.co/192x192/0078D4/FFFFFF/png?text=Bot"

# URL for a generic white square placeholder icon (32x32)
OUTLINE_ICON_URL="https://placehold.co/32x32/FFFFFF/000000/png?text=B"

# Directory where the icons should be saved
DEST_DIR="teams-app-manifest"

# Download the icons using curl
echo "Downloading color.png..."
curl -L -o "$DEST_DIR/color.png" "$COLOR_ICON_URL"

echo "Downloading outline.png..."
curl -L -o "$DEST_DIR/outline.png" "$OUTLINE_ICON_URL"

echo "Icon download complete." 