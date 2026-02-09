# Quick Setup: Neo4j on VPS

## Step 1: Update GitHub Secrets

Go to: https://github.com/dserero/FamilyTree/settings/secrets/actions

Click "New repository secret" or update existing ones:

### Neo4j Secrets
```
Name: NEO4J_URI
Value: neo4j://neo4j:7687
```

```
Name: NEO4J_USERNAME
Value: neo4j
```

```
Name: NEO4J_PASSWORD
Value: FamilyTree2026!Secure
(or choose your own strong password)
```

```
Name: NEO4J_DATABASE
Value: neo4j
```

### VPS Connection Secrets (if not already set)
```
Name: VPS_HOST
Value: 46.224.96.131
```

```
Name: VPS_USERNAME
Value: root
```

```
Name: VPS_SSH_KEY
Value: [Your SSH private key]
```

### Backblaze B2 Secrets (should already be set)
- B2_KEY_ID
- B2_APPLICATION_KEY
- B2_REGION
- B2_BUCKET_NAME
- B2_BUCKET_ID

## Step 2: Deploy to VPS

### Option A: Automatic Deployment (Recommended)
Just push your code to the main branch:

```bash
git add .
git commit -m "Configure Neo4j on VPS"
git push origin main
```

The GitHub Actions workflow will automatically:
1. SSH into your VPS
2. Pull the latest code
3. Create .env.local with all secrets
4. Start Neo4j and the app with docker-compose

### Option B: Manual Deployment
SSH into your VPS and run:

```bash
ssh root@46.224.96.131

cd /opt/familytree
git pull origin main
docker-compose down
docker-compose up -d --build
```

## Step 3: Verify Neo4j is Running

```bash
ssh root@46.224.96.131

# Check if containers are running
docker-compose ps

# Should show both:
# - familytree-neo4j (port 7474, 7687)
# - familytree-app (port 3000)

# Check Neo4j logs
docker-compose logs neo4j

# Check app logs
docker-compose logs app
```

## Step 4: Access Neo4j Browser

Open in your browser:
```
http://46.224.96.131:7474
```

Login with:
- Username: `neo4j`
- Password: (the password you set in GitHub secrets)

## Step 5: Test Your Application

Open in your browser:
```
http://46.224.96.131:3000
```

The app should now connect to Neo4j successfully!

## Troubleshooting

### App can't connect to Neo4j?

Check the environment variables on VPS:
```bash
ssh root@46.224.96.131
cd /opt/familytree
cat .env.local
```

Should show:
```
NEO4J_URI=neo4j://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=YourPassword
NEO4J_DATABASE=neo4j
```

### Neo4j won't start?

```bash
# Check logs
docker-compose logs neo4j

# Restart Neo4j
docker-compose restart neo4j

# If needed, remove and recreate
docker-compose down
docker volume rm familytree_neo4j_data
docker-compose up -d
```

### Check if services can communicate:

```bash
# From inside the app container, ping Neo4j
docker-compose exec app ping neo4j

# Test Neo4j connection from app container
docker-compose exec app wget -O- http://neo4j:7474
```

## Important Notes

1. **Password must match** - The `NEO4J_PASSWORD` in GitHub secrets will be written to `.env.local` on VPS
2. **Docker network** - Both containers use `familytree-network`, so app connects via service name `neo4j`
3. **Data persistence** - Neo4j data is stored in Docker volume `neo4j_data` and persists across restarts
4. **First startup** - Neo4j takes ~30 seconds to initialize on first run

## Security Recommendations

### After deployment, restrict Neo4j access:

Edit docker-compose.yml on VPS to only expose Neo4j locally:

```yaml
ports:
  - "127.0.0.1:7474:7474"  # Only localhost can access browser
  - "127.0.0.1:7687:7687"  # Only localhost can access Bolt
```

Or set up firewall rules:
```bash
# Allow only localhost to access Neo4j ports
sudo ufw deny 7474
sudo ufw deny 7687
sudo ufw allow 3000
sudo ufw enable
```

This way, only your app (in the same Docker network) can access Neo4j, not the public internet.
