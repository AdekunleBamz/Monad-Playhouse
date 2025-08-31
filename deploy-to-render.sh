#!/bin/bash

# 🚀 Monad Playhouse Render Deployment Script
# This script helps verify your setup before deploying to Render

echo "🎮 Monad Playhouse Render Deployment Check"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Please run this script from the project root"
    exit 1
fi

# Check if server directory exists
if [ ! -d "server" ]; then
    echo "❌ Error: Server directory not found"
    exit 1
fi

# Check if server package.json exists
if [ ! -f "server/package.json" ]; then
    echo "❌ Error: server/package.json not found"
    exit 1
fi

# Check if MongoDB server file exists
if [ ! -f "server/leaderboard-server-mongodb.js" ]; then
    echo "❌ Error: MongoDB server file not found"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Please create .env file with your MongoDB URI"
    echo "Copy from .env.example: cp .env.example .env"
    echo "Then edit .env with your real MongoDB URI"
else
    echo "✅ .env file found"
fi

echo ""
echo "📋 Deployment Checklist:"
echo "======================="
echo "1. ✅ Project structure verified"
echo "2. ✅ Server files present"
echo "3. ⏳ Ready for Render deployment"
echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. Go to https://render.com"
echo "2. Sign up with GitHub"
echo "3. Create new Web Service"
echo "4. Connect repository: AdekunleBamz/Monad-Playhouse"
echo "5. Configure:"
echo "   - Name: monad-playhouse-leaderboard"
echo "   - Root Directory: server"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "6. Add environment variables (see RENDER_DEPLOYMENT_GUIDE.md)"
echo "7. Deploy!"
echo ""
echo "📖 For detailed instructions, see: RENDER_DEPLOYMENT_GUIDE.md"
echo ""
echo "🎯 Your Mission 7 submission will be ready after deployment!"
