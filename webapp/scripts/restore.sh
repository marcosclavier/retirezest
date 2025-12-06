#!/bin/bash

# Database Restore Script
# Restores a PostgreSQL database from backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default backup directory
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL in your .env.local file"
    exit 1
fi

# Parse DATABASE_URL
PARSED_URL=$(echo "$DATABASE_URL" | sed -E 's#postgresql://([^:]+):([^@]+)@([^:/]+):?([0-9]*)/([^?]+).*#\1 \2 \3 \4 \5#')
read -r DB_USER DB_PASSWORD DB_HOST DB_PORT DB_NAME <<< "$PARSED_URL"

# Use default port if not specified
DB_PORT=${DB_PORT:-5432}

echo -e "${YELLOW}Database Restore Utility${NC}"
echo "========================================"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "========================================"

# List available backups
echo -e "${YELLOW}Available backups:${NC}"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print NR". "$9" ("$5")"}'

if [ ! "$(ls -A $BACKUP_DIR/*.sql.gz 2>/dev/null)" ]; then
    echo -e "${RED}No backups found in $BACKUP_DIR${NC}"
    exit 1
fi

# Prompt for backup file
read -p "Enter backup number to restore (or full path): " backup_input

# If number, get corresponding file
if [[ "$backup_input" =~ ^[0-9]+$ ]]; then
    BACKUP_FILE=$(ls "$BACKUP_DIR"/*.sql.gz 2>/dev/null | sed -n "${backup_input}p")
else
    BACKUP_FILE="$backup_input"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo ""
echo -e "${RED}WARNING: This will replace all data in the database!${NC}"
echo "Backup file: $BACKUP_FILE"
echo "Target database: $DB_NAME"
echo ""
read -p "Are you sure? Type 'RESTORE' to confirm: " confirm

if [ "$confirm" != "RESTORE" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo -e "${YELLOW}Restoring database...${NC}"

export PGPASSWORD="$DB_PASSWORD"

# Drop and recreate database (if using local PostgreSQL)
# Note: This won't work for managed databases like Neon
if [ "$DB_HOST" == "localhost" ] || [ "$DB_HOST" == "127.0.0.1" ]; then
    echo "Dropping and recreating database..."
    dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" --if-exists
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
else
    echo "Warning: Cannot drop/recreate managed database"
    echo "Restoring will append to existing data"
fi

# Restore from backup
if gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q; then
    echo -e "${GREEN}Database restored successfully!${NC}"

    # Run migrations to ensure schema is up to date
    echo -e "${YELLOW}Running migrations to ensure schema is current...${NC}"
    npx prisma migrate deploy

    echo -e "${GREEN}Restore complete!${NC}"
else
    echo -e "${RED}Restore failed!${NC}"
    exit 1
fi

unset PGPASSWORD
