#!/bin/bash

# Database Migration Helper Script
# This script helps manage Prisma database migrations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL in your .env.local file"
    exit 1
fi

# Function to display usage
usage() {
    echo "Usage: $0 {dev|deploy|status|reset}"
    echo ""
    echo "Commands:"
    echo "  dev     - Create and apply migration in development"
    echo "  deploy  - Apply pending migrations in production"
    echo "  status  - Check migration status"
    echo "  reset   - Reset database (WARNING: deletes all data)"
    echo ""
    exit 1
}

# Function to run development migration
run_dev() {
    echo -e "${YELLOW}Creating and applying development migration...${NC}"

    read -p "Enter migration name: " migration_name

    if [ -z "$migration_name" ]; then
        echo -e "${RED}Migration name cannot be empty${NC}"
        exit 1
    fi

    npx prisma migrate dev --name "$migration_name"

    echo -e "${GREEN}Migration created and applied successfully!${NC}"
}

# Function to deploy migrations
run_deploy() {
    echo -e "${YELLOW}Deploying pending migrations...${NC}"

    # Check if there are pending migrations
    if ! npx prisma migrate status | grep -q "pending"; then
        echo -e "${GREEN}No pending migrations${NC}"
        exit 0
    fi

    echo "Pending migrations found:"
    npx prisma migrate status

    read -p "Apply these migrations? (y/N): " confirm

    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Migration cancelled"
        exit 0
    fi

    npx prisma migrate deploy

    echo -e "${GREEN}Migrations deployed successfully!${NC}"
}

# Function to check migration status
check_status() {
    echo -e "${YELLOW}Checking migration status...${NC}"
    npx prisma migrate status
}

# Function to reset database
reset_database() {
    echo -e "${RED}WARNING: This will delete ALL data in the database!${NC}"
    read -p "Are you sure you want to reset the database? Type 'RESET' to confirm: " confirm

    if [ "$confirm" != "RESET" ]; then
        echo "Database reset cancelled"
        exit 0
    fi

    echo -e "${YELLOW}Resetting database...${NC}"
    npx prisma migrate reset --force

    echo -e "${GREEN}Database reset successfully!${NC}"
}

# Main script logic
case "${1:-}" in
    dev)
        run_dev
        ;;
    deploy)
        run_deploy
        ;;
    status)
        check_status
        ;;
    reset)
        reset_database
        ;;
    *)
        usage
        ;;
esac
