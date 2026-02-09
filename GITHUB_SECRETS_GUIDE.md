# GitHub Secrets Setup Guide

## How to Access Your GitHub Secrets

1. **Go to your repository on GitHub:**
   - Navigate to: https://github.com/dserero/FamilyTree

2. **Access Settings:**
   - Click on **Settings** tab (at the top of your repository)
   
3. **Go to Secrets:**
   - In the left sidebar, expand **Secrets and variables**
   - Click on **Actions**

4. **View/Edit Secrets:**
   - You'll see all your repository secrets listed
   - Click **New repository secret** to add new ones
   - Click on a secret name to update it (you can only update, not view the value)

## Required Secrets for Your Project

Based on your current workflow, here are the secrets you need:

### VPS Connection Secrets

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `VPS_HOST` | Your VPS IP address | `46.224.96.131` |
| `VPS_USERNAME` | SSH username for VPS | `root` or your username |
| `VPS_SSH_KEY` | Private SSH key for authentication | Your private key content |
| `VPS_PORT` | SSH port (optional, defaults to 22) | `22` |

### Neo4j Database Secrets (UPDATED - Remove old Aura secrets)

**Old secrets to REMOVE:**
- ❌ `NEO4J_URI` (old value: `neo4j+s://a580520a.databases.neo4j.io`)
- ❌ `AURA_INSTANCEID`
- ❌ `AURA_INSTANCENAME`

**New secrets to ADD/UPDATE:**

| Secret Name | Description | Value |
|------------|-------------|-------|
| `NEO4J_URI` | Neo4j connection URI | `neo4j://neo4j:7687` (for Docker) |
| `NEO4J_USERNAME` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | Your chosen password |
| `NEO4J_DATABASE` | Database name | `neo4j` |

### Backblaze B2 Secrets

| Secret Name | Description | Current Value |
|------------|-------------|---------------|
| `B2_KEY_ID` | Backblaze key ID | `220f3c48d311` |
| `B2_APPLICATION_KEY` | Backblaze app key | `0058d001acce0468bb1a6208d3e5b981f56870e2d3` |
| `B2_REGION` | Backblaze region | `us-east-005` |
| `B2_BUCKET_NAME` | Bucket name | `SereroBucket` |
| `B2_BUCKET_ID` | Bucket ID | `5292708f332cb4089da30111` |

## Step-by-Step: Adding/Updating Secrets

### 1. Update Neo4j Secrets

Since you're now using a self-hosted Neo4j on your VPS:

```
Secret: NEO4J_URI
Value: neo4j://neo4j:7687
```

```
Secret: NEO4J_USERNAME
Value: neo4j
```

```
Secret: NEO4J_PASSWORD
Value: [choose a strong password - same as in docker-compose.yml]
```

```
Secret: NEO4J_DATABASE
Value: neo4j
```

### 2. Verify VPS Secrets

Make sure these are set:

```
Secret: VPS_HOST
Value: 46.224.96.131
```

```
Secret: VPS_USERNAME
Value: root
(or whatever username you use to SSH)
```

```
Secret: VPS_SSH_KEY
Value: [Your private SSH key - starts with -----BEGIN ... KEY-----]
```

### 3. Verify B2 Secrets

These should already be set based on your `.env.local` file.

## How to Generate SSH Key for VPS_SSH_KEY

If you need to create a new SSH key:

```bash
# Generate a new SSH key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/vps_deploy

# Copy the public key to your VPS
ssh-copy-id -i ~/.ssh/vps_deploy.pub root@46.224.96.131

# Display the private key to copy to GitHub
cat ~/.ssh/vps_deploy
```

Copy the ENTIRE output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`) and paste it as the `VPS_SSH_KEY` secret.

## Quick Checklist

Before deploying, verify you have all these secrets:

- [ ] VPS_HOST
- [ ] VPS_USERNAME  
- [ ] VPS_SSH_KEY
- [ ] NEO4J_URI (updated to `neo4j://neo4j:7687`)
- [ ] NEO4J_USERNAME
- [ ] NEO4J_PASSWORD (your new password)
- [ ] NEO4J_DATABASE
- [ ] B2_KEY_ID
- [ ] B2_APPLICATION_KEY
- [ ] B2_REGION
- [ ] B2_BUCKET_NAME
- [ ] B2_BUCKET_ID

## Remove Old Secrets

You can safely delete these old Neo4j Aura secrets:
- `AURA_INSTANCEID`
- `AURA_INSTANCENAME`

## Testing Your Secrets

After updating secrets:

1. Push a commit to the `main` branch
2. Go to **Actions** tab in GitHub
3. Watch the deployment workflow run
4. Check if it completes successfully

## Troubleshooting

**Can't find Settings tab?**
- You need admin/owner access to the repository
- Make sure you're logged in as the repository owner

**Secrets not appearing in workflow?**
- Secrets are never displayed in logs for security
- Check workflow run logs for connection errors
- Verify secret names match exactly (case-sensitive)

**Deployment fails?**
- Check the Actions tab for error messages
- Verify VPS_SSH_KEY is complete (including header/footer)
- Ensure VPS allows SSH from GitHub Actions IPs

## Security Best Practices

1. **Never commit secrets to git** - Always use GitHub Secrets or `.env.local` (which is gitignored)
2. **Use strong passwords** - Especially for NEO4J_PASSWORD
3. **Rotate keys regularly** - Update SSH keys and API keys periodically
4. **Limit access** - Only give repository access to trusted collaborators
