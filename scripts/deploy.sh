#!/bin/bash

# Meta Ads Spy Deployment Script
# Usage: ./scripts/deploy.sh [platform]
# Platforms: heroku, railway, vercel, docker

set -e

PLATFORM=${1:-heroku}

echo "🚀 Deploying Meta Ads Spy to $PLATFORM..."

case $PLATFORM in
  "heroku")
    echo "📦 Deploying to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
      echo "❌ Heroku CLI not found. Please install it first:"
      echo "   brew install heroku/brew/heroku"
      exit 1
    fi
    
    # Login check
    if ! heroku auth:whoami &> /dev/null; then
      echo "🔐 Please login to Heroku first:"
      heroku login
    fi
    
    # Create app if needed
    if [ -z "$HEROKU_APP_NAME" ]; then
      read -p "Enter Heroku app name: " HEROKU_APP_NAME
    fi
    
    # Create app (will skip if exists)
    heroku create $HEROKU_APP_NAME || true
    
    # Set environment variables
    echo "🔧 Setting environment variables..."
    heroku config:set NODE_ENV=production --app $HEROKU_APP_NAME
    
    if [ -f .env ]; then
      echo "📄 Found .env file, setting variables from file..."
      heroku config:set $(cat .env | grep -v '^#' | xargs) --app $HEROKU_APP_NAME
    else
      echo "⚠️  No .env file found. Please set environment variables manually:"
      echo "   heroku config:set META_ACCESS_TOKEN=your_token --app $HEROKU_APP_NAME"
      echo "   heroku config:set META_APP_ID=your_app_id --app $HEROKU_APP_NAME"
      echo "   heroku config:set META_APP_SECRET=your_app_secret --app $HEROKU_APP_NAME"
    fi
    
    # Deploy
    echo "🚀 Deploying to Heroku..."
    git push heroku main
    
    # Open app
    echo "✅ Deployment complete!"
    heroku open --app $HEROKU_APP_NAME
    ;;
    
  "railway")
    echo "🚂 Railway deployment guide:"
    echo "1. Go to https://railway.app"
    echo "2. Connect your GitHub account"
    echo "3. Select your meta-ads-spy repository"
    echo "4. Set environment variables in Railway dashboard:"
    echo "   - META_ACCESS_TOKEN"
    echo "   - META_APP_ID"
    echo "   - META_APP_SECRET"
    echo "5. Deploy automatically on git push"
    ;;
    
  "vercel")
    echo "⚡ Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
      echo "📦 Installing Vercel CLI..."
      npm i -g vercel
    fi
    
    # Deploy
    vercel --prod
    ;;
    
  "docker")
    echo "🐳 Building Docker image..."
    
    # Build image
    docker build -t meta-ads-spy .
    
    echo "✅ Docker image built successfully!"
    echo "To run locally:"
    echo "   docker run -p 3000:3000 --env-file .env meta-ads-spy"
    echo ""
    echo "To deploy to cloud:"
    echo "   1. Tag image: docker tag meta-ads-spy your-registry/meta-ads-spy"
    echo "   2. Push: docker push your-registry/meta-ads-spy"
    echo "   3. Deploy to your cloud provider"
    ;;
    
  *)
    echo "❌ Unknown platform: $PLATFORM"
    echo "Available platforms: heroku, railway, vercel, docker"
    exit 1
    ;;
esac

echo "🎉 Deployment process completed for $PLATFORM!"