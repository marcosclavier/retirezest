# Docker Deployment Guide - Canadian Retirement Planning App

This guide explains how to run the Canadian Retirement Planning application using Docker and Docker Compose.

## Prerequisites

- **Docker Desktop** installed (includes Docker and Docker Compose)
  - Windows: [Download Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - Mac: [Download Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
  - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)

- Ensure Docker Desktop is running before proceeding

## Quick Start

### 1. Update Next.js Configuration

First, you need to enable standalone output in Next.js for Docker deployment.

**Edit `webapp/next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Add this line
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
```

### 2. Build and Run with Docker Compose

From the project root directory (`C:\Projects\retirement-app`), run:

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f
```

The application will be available at: **http://localhost:3100**

### 3. Stop the Application

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (deletes database)
docker-compose down -v
```

## Detailed Commands

### Building the Docker Image

```bash
# Build the image
docker-compose build

# Build without cache (for clean rebuild)
docker-compose build --no-cache
```

**Note on Build Times:**
- **First build:** 8-15 minutes (downloads images, installs dependencies)
- **Subsequent builds:** 10 seconds - 3 minutes (uses Docker layer caching)
- **Code-only changes:** ~2 minutes (dependencies cached)

See `DOCKER-BUILD-OPTIMIZATION.md` for detailed information on caching and performance.

### Running the Application

```bash
# Start in detached mode (background)
docker-compose up -d

# Start with logs visible
docker-compose up

# Start and rebuild if needed
docker-compose up -d --build
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# View logs for specific service
docker-compose logs retirement-app

# View last 100 lines
docker-compose logs --tail=100 -f
```

### Managing the Container

```bash
# Check container status
docker-compose ps

# Restart the container
docker-compose restart

# Stop the container
docker-compose stop

# Start stopped container
docker-compose start
```

### Accessing the Container

```bash
# Open shell in running container
docker-compose exec retirement-app sh

# Run Prisma Studio (database GUI)
docker-compose exec retirement-app npx prisma studio
# Opens at http://localhost:5555
```

### Database Operations

```bash
# View database
docker-compose exec retirement-app npx prisma studio

# Create a database migration
docker-compose exec retirement-app npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
docker-compose exec retirement-app npx prisma migrate reset
```

## Environment Variables

The default configuration uses environment variables defined in `docker-compose.yml`.

### Customizing Environment Variables

**Option 1: Edit docker-compose.yml directly**

```yaml
environment:
  - JWT_SECRET=your-custom-secret-here
  - NEXT_PUBLIC_APP_URL=http://your-domain.com:3100
```

**Option 2: Use .env file**

Create `.env` file in the project root:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NEXT_PUBLIC_APP_URL=http://localhost:3100
DATABASE_URL=file:./prisma/dev.db
```

Update `docker-compose.yml`:

```yaml
services:
  retirement-app:
    env_file:
      - .env
```

## Data Persistence

The SQLite database is stored in a Docker volume named `retirement-data`, which persists data across container restarts.

### Backup Database

```bash
# Copy database from container to local machine
docker cp retirement-app:/app/prisma/dev.db ./backup-dev.db

# Or using docker-compose
docker-compose cp retirement-app:/app/prisma/dev.db ./backup-dev.db
```

### Restore Database

```bash
# Stop the container
docker-compose down

# Remove the volume
docker volume rm retirement-app_retirement-data

# Copy backup to new location (after starting container)
docker-compose up -d
docker cp ./backup-dev.db retirement-app:/app/prisma/dev.db
docker-compose restart
```

## Production Deployment

### Security Recommendations

Before deploying to production:

1. **Change JWT Secret:**
   ```bash
   # Generate a secure random secret
   openssl rand -hex 32
   ```

2. **Update Environment Variables:**
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET`
   - Update `NEXT_PUBLIC_APP_URL` to your domain

3. **Use PostgreSQL Instead of SQLite:**
   - SQLite is fine for local development but PostgreSQL is recommended for production
   - See "Migrating to PostgreSQL" section below

### Deploying to a Server

1. **Copy files to server:**
   ```bash
   scp -r C:\Projects\retirement-app user@server:/path/to/app
   ```

2. **On the server:**
   ```bash
   cd /path/to/app
   docker-compose up -d
   ```

3. **Set up reverse proxy (Nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3100;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Migrating to PostgreSQL (Production)

For production deployments, it's recommended to use PostgreSQL instead of SQLite.

### 1. Update docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: retirement-db
    environment:
      - POSTGRES_USER=retirement_user
      - POSTGRES_PASSWORD=secure_password_here
      - POSTGRES_DB=retirement_db
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  # Next.js Application
  retirement-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: retirement-app
    depends_on:
      - postgres
    ports:
      - "3100:3000"
    environment:
      - DATABASE_URL=postgresql://retirement_user:secure_password_here@postgres:5432/retirement_db
      - JWT_SECRET=your-super-secret-jwt-key
      - NEXT_PUBLIC_APP_URL=http://localhost:3100
      - NODE_ENV=production
    restart: unless-stopped

volumes:
  postgres-data:
```

### 2. Update Prisma Schema

Edit `webapp/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 3. Rebuild and Migrate

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Container Won't Start

```bash
# View logs
docker-compose logs retirement-app

# Check container status
docker-compose ps

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Database Connection Errors

```bash
# Check if database file exists
docker-compose exec retirement-app ls -la /app/prisma/

# Re-run migrations
docker-compose exec retirement-app npx prisma migrate deploy

# Reset database (WARNING: deletes data)
docker-compose exec retirement-app npx prisma migrate reset
```

### Port Already in Use

If port 3100 is already in use, edit `docker-compose.yml`:

```yaml
ports:
  - "3101:3000"  # Use port 3101 on host instead
```

Then access at: http://localhost:3101

### Permission Errors (Linux)

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Or run with sudo
sudo docker-compose up -d
```

## Health Checks

The container includes a health check that verifies the application is responding:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' retirement-app

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' retirement-app
```

## Resource Limits

To limit container resource usage, add to `docker-compose.yml`:

```yaml
services:
  retirement-app:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Useful Docker Commands

```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# View disk usage
docker system df

# Clean up everything (be careful!)
docker system prune -a --volumes
```

## Next Steps

1. **Test the application** at http://localhost:3100
2. **Create a test account** and explore features
3. **Set up monitoring** (consider Portainer for Docker GUI)
4. **Configure backups** for the database volume
5. **Set up SSL/TLS** with Let's Encrypt (for production)

## Support

For issues or questions:
- Check the main `README.md` for application documentation
- Review logs with `docker-compose logs -f`
- Ensure Docker Desktop is running
- Verify all prerequisites are installed

---

**Created:** November 14, 2025
**Application:** Canadian Retirement Planning App
**Docker Version:** Docker 24.0+ recommended
