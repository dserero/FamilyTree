#!/bin/bash
# Manual Setup Script - Run this directly on your VPS

cd /opt/familytree

# Create docker-compose.override.yml with the Neo4j password
# Set NEO4J_PASSWORD to the value stored in your .env.local / GitHub secret
cat > docker-compose.override.yml <<ENDOFFILE
services:
  neo4j:
    environment:
      - NEO4J_AUTH=neo4j/${NEO4J_PASSWORD}
ENDOFFILE

echo "Override file created"
cat docker-compose.override.yml

# Stop existing containers
docker compose down

# Start all services
docker compose up -d

# Wait for services to initialize
echo "Waiting 15 seconds for services to start..."
sleep 15

# Check status
echo ""
echo "=== Container Status ==="
docker compose ps

echo ""
echo "=== Neo4j Logs ==="
docker compose logs --tail=30 neo4j

echo ""
echo "=== App Logs ==="
docker compose logs --tail=20 app

echo ""
echo "=== Setup Complete ==="
echo "Neo4j Browser: http://46.224.96.131:7474"
echo "Application: http://46.224.96.131:3000"
echo "Username: neo4j"
echo "Password: (see NEO4J_PASSWORD in .env.local or GitHub secrets)"
