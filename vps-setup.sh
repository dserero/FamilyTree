#!/bin/bash

# VPS Setup Script for Family Tree Application

echo "=== Setting up Family Tree Application on VPS ==="

# Create application directory
echo "Creating application directory..."
mkdir -p /opt/familytree
cd /opt/familytree

# Clone or update repository
echo "Cloning/updating repository..."
if [ -d ".git" ]; then
    echo "Repository exists, pulling latest changes..."
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/dserero/FamilyTree.git .
fi

# Create .env.local file
echo "Creating .env.local file..."
cat > .env.local << 'EOF'
# Neo4j Configuration
NEO4J_URI=neo4j://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=9Cwa2n?!
NEO4J_DATABASE=neo4j

# Backblaze B2 Configuration
B2_KEY_ID=220f3c48d311
B2_APPLICATION_KEY=0058d001acce0468bb1a6208d3e5b981f56870e2d3
B2_REGION=us-east-005
B2_BUCKET_NAME=SereroBucket
B2_BUCKET_ID=5292708f332cb4089da30111
EOF

echo ".env.local created successfully"

# Stop any running containers
echo "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start services
echo "Building and starting Docker services..."
docker-compose up -d --build

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check status
echo ""
echo "=== Service Status ==="
docker-compose ps

echo ""
echo "=== Neo4j Logs (last 20 lines) ==="
docker-compose logs --tail=20 neo4j

echo ""
echo "=== App Logs (last 20 lines) ==="
docker-compose logs --tail=20 app

echo ""
echo "=== Setup Complete ==="
echo "Neo4j Browser: http://46.224.96.131:7474"
echo "Application: http://46.224.96.131:3000"
echo "Neo4j Username: neo4j"
echo "Neo4j Password: 9Cwa2n?!"
