#!/bin/bash
# Deployment-Script für Docker Stack
# Verwendung: ./scripts/deploy-stack.sh

set -e

# .env laden falls vorhanden
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

echo "Building image..."
docker build -t coffin-app:latest .

echo "Deploying stack..."
docker stack deploy -c docker-compose.yaml coffin

echo "Done. App erreichbar unter http://localhost:3000"
