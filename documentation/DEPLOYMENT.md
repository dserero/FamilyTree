# VPS Deployment Setup Guide

This guide explains how to set up automatic deployment to your VPS using GitHub Actions.

## Prerequisites

-   A VPS with Docker and Docker Compose installed
-   SSH access to your VPS
-   GitHub repository with admin access

## VPS Setup

1. **Install Docker and Docker Compose on your VPS:**

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

2. **Create application directory:**
    ```bash
    sudo mkdir -p /opt/familytree
    sudo chown $USER:$USER /opt/familytree
    ```

## GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

### Required Secrets:

1. **VPS_HOST**: Your VPS IP address or domain

    - Example: `203.0.113.1` or `yourserver.com`

2. **VPS_USERNAME**: SSH username for your VPS

    - Example: `root` or `ubuntu`

3. **VPS_SSH_KEY**: Private SSH key for authentication

    - Generate on your local machine:
        ```bash
        ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/vps_deploy
        ```
    - Copy public key to VPS:
        ```bash
        ssh-copy-id -i ~/.ssh/vps_deploy.pub user@your-vps-ip
        ```
    - Copy private key content:
        ```bash
        cat ~/.ssh/vps_deploy
        ```
    - Paste the entire private key content into the secret

4. **VPS_PORT** (optional): SSH port (default: 22)
    - Example: `22` or `2222`

### Neo4j Database Secrets:

5. **NEO4J_URI**: `neo4j+s://a580520a.databases.neo4j.io`
6. **NEO4J_USERNAME**: `neo4j`
7. **NEO4J_PASSWORD**: `lVzAUmWusgu5KRLD1gwMB1zMrEzmiIdJacvhHURpVZA`
8. **NEO4J_DATABASE**: `neo4j`
9. **AURA_INSTANCEID**: `a580520a`
10. **AURA_INSTANCENAME**: `Instance02`

## How It Works

When you push to the `main` branch:

1. GitHub Actions connects to your VPS via SSH
2. Clones/pulls the latest code
3. Creates `.env.local` with your secrets
4. Stops old containers
5. Builds and starts new containers
6. Cleans up old Docker images

## Local Testing

Test your Docker setup locally before deploying:

```bash
# Build and start
docker-compose up --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

Access the application at: http://localhost:3000

## VPS Access

After deployment, access your application at:

```
http://your-vps-ip:3000
```

## Nginx Reverse Proxy (Optional)

For production with a domain name, set up Nginx:

```bash
sudo apt install nginx -y
```

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/familytree
```

Add:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/familytree /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL Certificate (Optional)

Install Let's Encrypt certificate:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## Troubleshooting

### Check deployment logs:

```bash
ssh user@your-vps-ip
cd /opt/familytree
docker-compose logs -f
```

### Check container status:

```bash
docker-compose ps
```

### Restart containers:

```bash
docker-compose restart
```

### Rebuild from scratch:

```bash
docker-compose down -v
docker-compose up --build -d
```

## Monitoring

View application logs:

```bash
docker-compose logs -f app
```

Check Docker resource usage:

```bash
docker stats
```

## Security Notes

-   Never commit `.env.local` to Git (it's in `.gitignore`)
-   Keep your SSH keys secure
-   Use strong passwords for Neo4j
-   Consider setting up a firewall (UFW)
-   Regularly update your VPS packages

## Support

For issues, check:

1. GitHub Actions workflow logs
2. VPS Docker logs: `docker-compose logs`
3. Neo4j connectivity from VPS
