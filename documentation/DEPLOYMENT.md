# Family Tree Deployment & Configuration Guide

This document outlines the architecture and configuration for both Local Development and VPS Production environments.

## Architecture Overview

- **Database:** Neo4j running on a VPS (`46.224.96.131`).
- **App:** Next.js application running in Docker.
- **Media Storage:** Backblaze B2.

Both Local and Production environments point to the same Neo4j instance on the VPS.

---

## Environment Configuration

### 1. Local Development

For running the app on your local machine while connecting to the VPS database.

**File:** `.env.local`

```env
# Neo4j - Connection to VPS
NEO4J_URI=neo4j://46.224.96.131:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j

# Backblaze B2
B2_KEY_ID=...
B2_APPLICATION_KEY=...
...
```

**Run Command:**

```bash
docker-compose up --build
```

_Note: `docker-compose.override.yml` ensures the development server uses `Dockerfile.dev` and maps your local files for hot-reloading._

---

## 2. VPS Production

The VPS deployment is triggered by pushes to the `main` branch via GitHub Actions.

### GitHub Secrets Requirements

Go to **Settings > Secrets and variables > Actions** and ensure these are set:

| Secret           | Value                               | Description                                |
| ---------------- | ----------------------------------- | ------------------------------------------ |
| `NEO4J_URI`      | `neo4j://host.docker.internal:7687` | Important: Use this internal host for VPS. |
| `NEO4J_USERNAME` | `neo4j`                             |                                            |
| `NEO4J_PASSWORD` | `...`                               |                                            |
| `NEO4J_DATABASE` | `neo4j`                             |                                            |
| `VPS_HOST`       | `46.224.96.131`                     |                                            |
| `VPS_USERNAME`   | `root`                              |                                            |
| `VPS_SSH_KEY`    | `...`                               | Your private SSH key.                      |

### Technical Details (VPS Networking)

On Linux/VPS, Docker containers don't naturally know what `host.docker.internal` is. We have configured `docker-compose.yml` with:

```yaml
extra_hosts:
    - "host.docker.internal:host-gateway"
```

This allows the App container on the VPS to reach the Neo4j instance running on the same host's port `7687`.

---

## Common Issues & Troubleshooting

### Data Sync (Neo4j Desktop)

If you add data via `localhost:3000` but don't see it in Neo4j Desktop:

1. **Refresh the Graph:** Run `MATCH (n) RETURN n LIMIT 10` to force a data fetch.
2. **Clear Cache:** Run `CALL db.clearQueryCaches()` in the Neo4j Browser.
3. **Verify URI:** Ensure Neo4j Desktop is connected to `bolt://46.224.96.131:7687`.

### Deployment Logs

To see logs on the VPS:

```bash
ssh root@46.224.96.131
cd /opt/familytree
docker-compose logs -f app
```
