# Neo4j Database Backups

## Where snapshots are stored

All snapshots are saved on the server at:

```
/opt/neo4j-backups/
```

Files in that directory:
| File | Description |
|---|---|
| `neo4j-YYYY-MM-DD_HH-MM-SS.dump` | A snapshot of the database at that timestamp |
| `backup.sh` | The script that creates snapshots |
| `backup.log` | Log of every backup run (success/failure, file sizes) |

## Schedule

Backups run automatically every night at **3:00 AM** via cron.  
The last **14 snapshots** (2 weeks) are kept. Older ones are deleted automatically.

## How it works

1. Neo4j service is stopped (~10 seconds downtime)
2. `neo4j-admin database dump` creates a `.dump` file in `/opt/neo4j-backups/`
3. Neo4j service is restarted
4. Dump files older than 14 days are deleted

## Checking backup status

```bash
# View recent backup logs
cat /opt/neo4j-backups/backup.log

# List all snapshots
ls -lh /opt/neo4j-backups/neo4j-*.dump
```

## Running a manual backup

```bash
bash /opt/neo4j-backups/backup.sh
```

## Restoring from a snapshot

```bash
# 1. Stop Neo4j
systemctl stop neo4j

# 2. Copy the snapshot you want to restore and rename it to neo4j.dump
cp /opt/neo4j-backups/neo4j-2026-04-25_08-32-33.dump /tmp/neo4j.dump

# 3. Load it (replace the live database)
neo4j-admin database load neo4j --from-path=/tmp --overwrite-destination=true

# 4. Restart Neo4j
systemctl start neo4j
```

## Important notes

- The database runs as a **native systemd service** on this server — it is NOT inside Docker.
- **`docker-compose down` does not affect the database** at all.
- The live database files live at `/var/lib/neo4j/data/databases/neo4j/`.
- To check that Neo4j is running: `systemctl status neo4j`
