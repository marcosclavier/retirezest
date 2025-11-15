# Docker Build Optimization Guide

## Why the First Build is Slow

The first build of your retirement app takes a long time (typically 5-15 minutes) because Docker needs to:

1. **Download base images** (~50-100 MB)
   - `node:20-alpine` image (downloaded 3 times for multi-stage build)

2. **Install all dependencies** (~200-500 MB)
   - All npm packages from `package.json`
   - Prisma and its dependencies

3. **Build the Next.js application**
   - TypeScript compilation
   - Next.js optimization and bundling
   - Generate standalone output

4. **Generate Prisma Client**
   - Database client code generation

## Docker Layer Caching

Docker caches each step (layer) of the build. On subsequent builds:

### ✅ **What Gets Cached (Fast)**

If you haven't changed these, Docker reuses cached layers:

1. **Base image downloads** - Instant (already on disk)
2. **Dependencies installation** - Instant (if package.json unchanged)
3. **Prisma generation** - Instant (if schema unchanged)
4. **Build output** - Only rebuilds if code changed

### ⚠️ **What Triggers Rebuild (Slow)**

Changes to these files invalidate cache from that point forward:

1. **package.json or package-lock.json changed**
   - Reinstalls ALL dependencies (~2-5 minutes)
   - Triggers rebuild of everything after

2. **Application code changed** (app/, components/, lib/)
   - Skips dependency install (cached ✅)
   - Only rebuilds Next.js (~1-3 minutes)

3. **Prisma schema changed**
   - Regenerates Prisma client (~30 seconds)
   - Rebuilds app

4. **Dockerfile changed**
   - Depends on what changed
   - May invalidate multiple layers

## Typical Build Times

### First Build (Cold Cache)
```
Stage 1 (Dependencies): 3-5 minutes
Stage 2 (Builder):      4-8 minutes
Stage 3 (Runner):       10-30 seconds
───────────────────────────────────
Total:                  ~8-15 minutes
```

### Subsequent Builds (Warm Cache)

**No changes (complete cache hit):**
```
Total: 5-10 seconds (just verification)
```

**Code change only (dependencies cached):**
```
Stage 1 (Dependencies): 5 seconds (cached)
Stage 2 (Builder):      1-3 minutes (rebuild)
Stage 3 (Runner):       10 seconds
───────────────────────────────────
Total:                  ~2-4 minutes
```

**Dependency change (package.json):**
```
Stage 1 (Dependencies): 2-4 minutes (reinstall)
Stage 2 (Builder):      2-4 minutes (rebuild)
Stage 3 (Runner):       10 seconds
───────────────────────────────────
Total:                  ~5-9 minutes
```

## How to Check Cache Usage

When building, watch for these messages:

```bash
docker-compose build

# You'll see:
# ✅ CACHED - Using layer from cache (instant)
# ⚠️  RUN - Executing step (takes time)
```

Example output with good caching:
```
[+] Building 15.2s (18/18) FINISHED
 => [deps 1/4] CACHED from library/node:20-alpine
 => [deps 2/4] CACHED WORKDIR /app
 => [deps 3/4] CACHED COPY package*.json
 => [deps 4/4] RUN npm ci                    <- Only this runs
 => [builder 1/5] CACHED from deps
 => [builder 2/5] CACHED COPY --from=deps
 => [builder 3/5] RUN npm run build          <- And this
```

## Build Optimization Tips

### 1. Don't Rebuild Unnecessarily

```bash
# ❌ BAD - Rebuilds every time
docker-compose up -d --build

# ✅ GOOD - Only rebuild if Dockerfile changed
docker-compose up -d

# Only rebuild when needed:
docker-compose build
docker-compose up -d
```

### 2. Use BuildKit for Better Caching

Enable Docker BuildKit for parallel builds and better caching:

**Windows (PowerShell):**
```powershell
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1
docker-compose build
```

**Linux/Mac:**
```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
docker-compose build
```

**Permanent (add to docker-compose.yml):**
```yaml
version: '3.8'

x-build-config: &build-config
  DOCKER_BUILDKIT: 1

services:
  retirement-app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        <<: *build-config
```

### 3. Check What's Taking Time

Use `--progress=plain` to see detailed build output:

```bash
docker-compose build --progress=plain
```

This shows exactly which steps are slow.

### 4. Pre-download Base Images

Speed up first build by pre-downloading images:

```bash
docker pull node:20-alpine
```

### 5. Clean Old Layers (If Disk Space Low)

```bash
# Remove dangling layers
docker image prune

# Remove all unused images (be careful!)
docker image prune -a

# Remove build cache (starts fresh)
docker builder prune
```

## Understanding the Multi-Stage Build

Your Dockerfile uses 3 stages to optimize caching:

```dockerfile
# Stage 1: deps - Install dependencies ONLY
# This layer is cached unless package.json changes
FROM node:20-alpine AS deps
COPY package*.json ./
RUN npm ci

# Stage 2: builder - Build application
# Uses cached deps, only rebuilds if code changes
FROM node:20-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: runner - Production runtime
# Minimal final image with only what's needed
FROM node:20-alpine AS runner
COPY --from=builder /app/.next ./next
```

This means:
- **Dependencies** (largest, slowest) are cached separately
- **Code changes** don't reinstall dependencies
- **Final image** is small (~200-300 MB vs 800+ MB)

## Cache Efficiency By File Type

| Change Type | Cache Hit? | Rebuild Time | Frequency |
|-------------|------------|--------------|-----------|
| No changes | ✅ 100% | 5-10s | Most common |
| Code only (.tsx, .ts) | ✅ Deps cached | 1-3 min | Common |
| package.json | ❌ Rebuild deps | 5-9 min | Rare |
| Dockerfile | ⚠️ Partial | Varies | Very rare |
| .env changes | ✅ No rebuild | 0s | Common |

## Real-World Build Time Examples

### Scenario 1: First Build (Fresh Machine)
```bash
$ docker-compose build

[+] Building 612.3s (32/32) FINISHED
 => [deps] downloading node:20-alpine        45.2s
 => [deps] npm ci                            198.7s
 => [builder] npm run build                  312.4s
 => [runner] copying files                   12.1s
 => exporting to image                       43.9s

Total: ~10 minutes
```

### Scenario 2: Code Change (Dashboard Update)
```bash
$ docker-compose build

[+] Building 87.4s (32/32) FINISHED
 => [deps 1/4] CACHED                        0.1s
 => [deps 2/4] CACHED                        0.1s
 => [deps 3/4] CACHED                        0.1s
 => [deps 4/4] CACHED                        0.1s
 => [builder] npm run build                  78.2s
 => [runner] copying files                   5.1s
 => exporting to image                       3.8s

Total: ~90 seconds
```

### Scenario 3: No Changes (Verification)
```bash
$ docker-compose build

[+] Building 8.2s (32/32) FINISHED
 => [deps 1/4] CACHED                        0.1s
 => [deps 2/4] CACHED                        0.1s
 => ... (all CACHED)
 => exporting to image                       0.2s

Total: ~8 seconds
```

## Common Questions

**Q: Why does `docker-compose up --build` always take time?**
A: The `--build` flag forces a rebuild even if nothing changed. Use `docker-compose up -d` instead (rebuilds only if Dockerfile changed).

**Q: Can I speed up the initial build?**
A: Yes, use BuildKit, ensure good internet connection, and pre-download base images. But the first build will always be slower.

**Q: How do I know if caching is working?**
A: Look for "CACHED" in build output. If you see "RUN" for package install on every build, caching isn't working properly.

**Q: Does stopping/starting containers rebuild?**
A: No! These commands DON'T rebuild:
- `docker-compose stop`
- `docker-compose start`
- `docker-compose restart`
- `docker-compose down` (without `-v`)
- `docker-compose up -d` (if image exists)

**Q: What clears the cache?**
A: These commands clear cache:
- `docker-compose down -v` (removes volumes, not build cache)
- `docker builder prune` (clears build cache)
- `docker system prune -a` (clears everything)
- Changing Dockerfile or .dockerignore

## Monitoring Cache Hit Rate

To see cache statistics:

```bash
# View build cache
docker builder du

# Example output:
ID          RECLAIMABLE  SIZE      LAST ACCESSED
abc123...   true         1.2GB     2 hours ago
def456...   false        340MB     5 minutes ago

Total:      1.54GB
Reclaimable: 1.2GB
```

## Best Practices for Development

**Daily Development Workflow:**
```bash
# Day 1 - First build (slow, ~10 min)
docker-compose build
docker-compose up -d

# Day 2 - Code changes (fast, ~2 min)
# Edit code...
docker-compose up -d --build

# Day 3 - No changes (very fast, ~10 sec)
docker-compose up -d
```

**When to Force Rebuild:**
```bash
# Added new npm package
npm install new-package
docker-compose build --no-cache  # Force clean build
docker-compose up -d

# Or just:
docker-compose up -d --build     # Smart rebuild
```

## Conclusion

**First build:** Slow (8-15 minutes) - This is normal!
**Subsequent builds:** Fast (10 seconds - 3 minutes) - Thanks to caching

Docker's layer caching makes the build process efficient after the initial setup. The multi-stage Dockerfile is specifically designed to maximize cache hits and minimize rebuild times.

**Key Takeaway:** Be patient with the first build. Every build after that will be significantly faster due to Docker's intelligent caching system.

---

**Document Created:** November 14, 2025
**Application:** Canadian Retirement Planning App
