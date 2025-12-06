#!/bin/bash

# Database Backup Script
# Creates a backup of the PostgreSQL database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default backup directory
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL in your .env.local file"
    exit 1
fi

# Parse DATABASE_URL
# Format: postgresql://user:password@host:port/database
PARSED_URL=$(echo "$DATABASE_URL" | sed -E 's#postgresql://([^:]+):([^@]+)@([^:/]+):?([0-9]*)/([^?]+).*#\1 \2 \3 \4 \5#')
read -r DB_USER DB_PASSWORD DB_HOST DB_PORT DB_NAME <<< "$PARSED_URL"

# Use default port if not specified
DB_PORT=${DB_PORT:-5432}

echo -e "${YELLOW}Database Backup Utility${NC}"
echo "========================================"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "========================================"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

echo -e "${YELLOW}Creating backup...${NC}"
echo "Backup file: $BACKUP_FILE_GZ"

# Create backup using pg_dump
export PGPASSWORD="$DB_PASSWORD"

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl -F p | gzip > "$BACKUP_FILE_GZ"; then
    echo -e "${GREEN}Backup created successfully!${NC}"
    echo "File: $BACKUP_FILE_GZ"
    echo "Size: $(du -h "$BACKUP_FILE_GZ" | cut -f1)"

    # Keep only last 7 backups
    echo -e "${YELLOW}Cleaning up old backups (keeping last 7)...${NC}"
    ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm

    echo -e "${GREEN}Backup complete!${NC}"
else
    echo -e "${RED}Backup failed!${NC}"
    exit 1
fi

unset PGPASSWORD
