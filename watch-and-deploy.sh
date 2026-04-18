#!/bin/bash
# watch-and-deploy.sh
# Polls the remote git repo every 60 seconds.
# When a new commit is detected on 'main', pulls and rebuilds the Docker container.

APP_DIR="/root/projects/FamilyTree"
BRANCH="main"
LOG_FILE="/var/log/familytree-watcher.log"
CHECK_INTERVAL=60  # seconds between checks

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

cd "$APP_DIR" || { log "ERROR: Cannot cd into $APP_DIR"; exit 1; }

log "=== Watcher started. Polling every ${CHECK_INTERVAL}s ==="

while true; do
    # Fetch without merging
    git fetch origin "$BRANCH" --quiet 2>&1 | tee -a "$LOG_FILE"

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse "origin/$BRANCH")

    if [ "$LOCAL" != "$REMOTE" ]; then
        log "New commit detected: $LOCAL -> $REMOTE"
        log "Pulling changes..."
        git pull origin "$BRANCH" >> "$LOG_FILE" 2>&1

        log "Rebuilding and restarting containers..."
        docker compose -f docker-compose.yml down >> "$LOG_FILE" 2>&1
        docker compose -f docker-compose.yml up -d --build >> "$LOG_FILE" 2>&1

        if [ $? -eq 0 ]; then
            log "Deployment successful."
        else
            log "ERROR: docker-compose failed. Check logs above."
        fi

        # Clean up dangling images older than 24h
        docker system prune -f --filter "until=24h" >> "$LOG_FILE" 2>&1
    fi

    sleep "$CHECK_INTERVAL"
done
