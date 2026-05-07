#!/bin/bash

# GSPE Deployment Script
# Usage: ./deploy.sh [up|down|logs|restart]

COMMAND=${1:-up}

case $COMMAND in
  "up")
    echo "🚀 Starting GSPE Deployment..."
    docker-compose up -d --build
    echo "🔄 Running database migrations..."
    docker exec gspe-app npx prisma db push
    echo "✅ Deployment complete!"
    ;;
  "down")
    echo "🛑 Stopping services..."
    docker-compose down
    ;;
  "logs")
    docker-compose logs -f app
    ;;
  "restart")
    echo "🔄 Restarting services..."
    docker-compose restart app
    ;;
  *)
    echo "Usage: $0 [up|down|logs|restart]"
    exit 1
    ;;
esac
