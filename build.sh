#!/bin/bash

# Build script for Countdown Timer App

set -e

echo "🔨 Building Countdown Timer App..."

# Check if .env file exists
if [ ! -f ".env" ] && [ ! -f "app/.env" ]; then
    echo "⚠️  Warning: No .env file found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo "📝 Please update .env with your actual values"
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🎨 Building frontend..."
cd app/frontend
npm install
npm run build
cd ../..

# Build extension
echo "🔌 Building extension..."
cd extensions/countdown-timer
npm install
npm run build
cd ../..

echo "✅ Build complete!"
echo ""
echo "📁 Build outputs:"
echo "   - Frontend: app/frontend/dist/"
echo "   - Extension: extensions/countdown-timer/assets/"






