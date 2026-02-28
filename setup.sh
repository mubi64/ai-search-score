#!/bin/bash

echo "🚀 AI Search Score - Quick Setup Script"
echo "========================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install postgresql@15
        brew services start postgresql@15
    else
        echo "Please install PostgreSQL manually for your system"
        exit 1
    fi
else
    echo "✅ PostgreSQL found"
fi

# Create database
echo ""
echo "📊 Creating database..."
createdb ai_search_score 2>/dev/null || echo "Database may already exist"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd server
npm install

# Setup backend .env
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Setting up backend environment..."
    cp .env.example .env
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
    rm .env.bak 2>/dev/null
    
    echo ""
    echo "⚠️  IMPORTANT: Edit server/.env and add your API keys:"
    echo "   - OPENAI_API_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo "   - PERPLEXITY_API_KEY"
    echo ""
fi

# Run migrations
echo "🗄️  Running database migrations..."
npm run migrate

cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit server/.env and add your LLM API keys"
echo "2. Start the backend: cd server && npm run dev"
echo "3. Start the frontend: npm run dev"
echo ""
echo "🌐 Frontend will run on: http://localhost:5173"
echo "🔌 Backend API will run on: http://localhost:3001"
echo ""
