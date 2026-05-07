#!/bin/bash

# GSPE Deployment Script (Registry-First)
# Usage: ./deploy.sh [up|down|logs|pull]

COMMAND=${1:-up}
IMAGE_NAME="ghcr.io/alfimaulanaa/gspe-deployment:latest"

case $COMMAND in
  "up")
    echo "🚀 Pulling latest image..."
    docker pull $IMAGE_NAME
    echo "🚀 Starting services..."
    docker-compose up -d
    echo "🔄 Running database migrations..."
    docker exec gspe-app npx prisma db push
    echo "✅ Deployment complete!"
    ;;
  "pull")
    echo "🚀 Pulling latest image..."
    docker pull $IMAGE_NAME
    ;;
  "down")
    echo "🛑 Stopping services..."
    docker-compose down
    ;;
  "logs")
    docker-compose logs -f app
    ;;
  *)
    echo "Usage: $0 [up|down|logs|pull]"
    exit 1
    ;;
esac
