# Neo4j Setup on VPS (46.224.96.131)

This guide will help you set up Neo4j database on your VPS and configure your application to use it.

## Step 1: Connect to Your VPS

```bash
ssh root@46.224.96.131
# or
ssh your-username@46.224.96.131
```

## Step 2: Install Docker and Docker Compose (if not already installed)

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## Step 3: Create Application Directory

```bash
sudo mkdir -p /opt/familytree
sudo chown $USER:$USER /opt/familytree
cd /opt/familytree
```

## Step 4: Clone Your Repository

```bash
# If using HTTPS
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git .

# Or if using SSH
git clone git@github.com:YOUR-USERNAME/YOUR-REPO.git .
```

## Step 5: Create .env.local File

Create the environment file with your settings:

```bash
nano .env.local
```

Add the following content (update the password):

```env
# Neo4j Configuration (Local Docker)
NEO4J_URI=neo4j://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-secure-password-here
NEO4J_DATABASE=neo4j

# Backblaze B2 Configuration
B2_KEY_ID=220f3c48d311
B2_APPLICATION_KEY=0058d001acce0468bb1a6208d3e5b981f56870e2d3
B2_REGION=us-east-005
B2_BUCKET_NAME=SereroBucket
B2_BUCKET_ID=5292708f332cb4089da30111
```

**Important:** Change `your-secure-password-here` to a strong password of your choice.

## Step 6: Update docker-compose.yml Password

Edit the docker-compose.yml file to use the same password:

```bash
nano docker-compose.yml
```

Change these two lines (use the same password as in .env.local):
- `NEO4J_AUTH=neo4j/your-password-here` 
- In healthcheck: `-p", "your-password-here"`

## Step 7: Start the Services

```bash
# Build and start all services
docker-compose up -d --build

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

## Step 8: Access Neo4j Browser

Open your browser and go to:
```
http://46.224.96.131:7474
```

Login with:
- Username: `neo4j`
- Password: (the password you set)

## Step 9: Initialize Your Database

You can now add your family tree data through the Neo4j browser or through your application.

Example Cypher query to create a test person:
```cypher
CREATE (p:Person {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1980-01-01',
    gender: 'M'
})
RETURN p
```

## Step 10: Update Local Development Environment

Update your local `.env.local` file to connect to the VPS Neo4j instance during development:

```env
NEO4J_URI=neo4j://46.224.96.131:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-secure-password-here
NEO4J_DATABASE=neo4j
```

**Or** keep using local Neo4j for development by running:
```bash
docker-compose up neo4j -d
```

And use:
```env
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password-here
NEO4J_DATABASE=neo4j
```

## Useful Commands

### Check service status:
```bash
docker-compose ps
```

### View logs:
```bash
docker-compose logs neo4j
docker-compose logs app
```

### Restart services:
```bash
docker-compose restart
```

### Stop services:
```bash
docker-compose down
```

### Backup Neo4j data:
```bash
docker-compose exec neo4j neo4j-admin database dump neo4j --to-path=/data/dumps
```

### Access Neo4j container:
```bash
docker-compose exec neo4j bash
```

## Security Considerations

1. **Firewall Configuration:**
   ```bash
   # Allow SSH, HTTP, HTTPS, and Neo4j ports
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 7474/tcp
   sudo ufw allow 7687/tcp
   sudo ufw allow 3000/tcp
   sudo ufw enable
   ```

2. **Production Security:**
   - Change the default Neo4j password to something very secure
   - Consider restricting Neo4j ports (7474, 7687) to only localhost or specific IPs
   - Use NGINX as a reverse proxy with SSL for production
   - Never commit `.env.local` to git

## Troubleshooting

### If Neo4j won't start:
```bash
docker-compose logs neo4j
docker-compose down
docker volume rm familytree_neo4j_data
docker-compose up -d
```

### If app can't connect to Neo4j:
1. Check Neo4j is running: `docker-compose ps`
2. Check Neo4j logs: `docker-compose logs neo4j`
3. Verify credentials in `.env.local` match docker-compose.yml
4. Test connection: `docker-compose exec neo4j cypher-shell -u neo4j -p your-password-here`

### If port conflicts:
Change the ports in docker-compose.yml:
```yaml
ports:
  - "7475:7474"  # Change 7474 to something else
  - "7688:7687"  # Change 7687 to something else
```
