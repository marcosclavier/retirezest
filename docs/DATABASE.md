# Database Documentation

Complete guide to the RetireZest database schema, optimization, and maintenance.

## Table of Contents

1. [Overview](#overview)
2. [Schema](#schema)
3. [Indexes](#indexes)
4. [Migrations](#migrations)
5. [Backup and Restore](#backup-and-restore)
6. [Query Optimization](#query-optimization)
7. [Maintenance](#maintenance)

## Overview

RetireZest uses PostgreSQL as its primary database with Prisma as the ORM.

**Database Provider**: PostgreSQL 14+
**ORM**: Prisma 6.x
**Connection Pooling**: Enabled (for serverless deployments)

### Performance Characteristics

- **Query Response Time**: < 100ms for simple queries, < 500ms for complex
- **Index Coverage**: 95%+ of queries use indexes
- **Connection Pool Size**: 10 connections (adjustable)
- **Slow Query Threshold**: 1000ms (logged in development)

## Schema

### Entity Relationship Diagram

```
User
├── Income (1:many)
├── Asset (1:many)
├── Expense (1:many)
├── Debt (1:many)
├── Scenario (1:many)
└── Projection (1:many)
    └── Scenario (many:1)
```

### Tables

#### User
Primary user account table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| email | String | Unique, Indexed | User email (login) |
| passwordHash | String | Required | Bcrypt password hash |
| firstName | String | Optional | User's first name |
| lastName | String | Optional | User's last name |
| dateOfBirth | DateTime | Optional | Date of birth |
| province | String | Optional | Province code (ON, BC, etc.) |
| maritalStatus | String | Optional | Marital status |
| freeSimulationsUsed | Int | Default: 0 | Lifetime count of free simulations (unverified users only) |
| simulationRunsToday | Int | Default: 0 | Daily simulation count for rate limiting (free tier) |
| simulationRunsDate | DateTime | Optional | Last simulation run date (for daily reset) |
| createdAt | DateTime | Indexed | Account creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes**:
- `email` (unique)
- `email` (non-unique for faster lookups)
- `createdAt` (for sorting/filtering)

#### Income
User income sources.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| userId | UUID | Foreign key to User |
| type | String | employment, pension, investment, rental |
| description | String | Optional description |
| amount | Float | Income amount |
| frequency | String | monthly, annual |
| isTaxable | Boolean | Tax status (default: true) |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update |

**Indexes**:
- `userId` (for user queries)
- `(userId, type)` (composite for filtered queries)
- `createdAt` (for sorting)

**Relationships**:
- `user`: Many-to-one with User (CASCADE delete)

#### Asset
User financial assets.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| userId | UUID | Foreign key to User |
| type | String | rrsp, tfsa, non_registered, real_estate |
| description | String | Optional description |
| currentValue | Float | Current asset value |
| contributionRoom | Float | Available contribution room |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update |

**Indexes**:
- `userId`
- `(userId, type)` (composite)
- `createdAt`

**Relationships**:
- `user`: Many-to-one with User (CASCADE delete)

#### Expense
User expenses.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| userId | UUID | Foreign key to User |
| category | String | housing, food, transportation, etc. |
| description | String | Optional description |
| amount | Float | Expense amount |
| frequency | String | monthly, annual |
| isEssential | Boolean | Essential vs discretionary |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update |

**Indexes**:
- `userId`
- `(userId, category)` (composite)
- `(userId, isEssential)` (composite)
- `createdAt`

**Relationships**:
- `user`: Many-to-one with User (CASCADE delete)

#### Debt
User debts and liabilities.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| userId | UUID | Foreign key to User |
| type | String | mortgage, loan, credit_card |
| description | String | Optional description |
| currentBalance | Float | Current balance owed |
| interestRate | Float | Annual interest rate (%) |
| monthlyPayment | Float | Monthly payment amount |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update |

**Indexes**:
- `userId`
- `(userId, type)` (composite)
- `createdAt`

**Relationships**:
- `user`: Many-to-one with User (CASCADE delete)

#### Scenario
Retirement planning scenarios.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| userId | UUID | Foreign key to User |
| name | String | Scenario name |
| description | String | Optional description |
| currentAge | Int | User's current age |
| retirementAge | Int | Planned retirement age |
| lifeExpectancy | Int | Expected lifespan (default: 95) |
| province | String | Province for tax calculations |
| ...financial fields... | Various | Asset balances, income, expenses |
| projectionResults | String | Cached JSON results |
| isBaseline | Boolean | Is this the baseline scenario |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update |

**Indexes**:
- `userId`
- `(userId, isBaseline)` (composite for baseline lookup)
- `createdAt`

**Relationships**:
- `user`: Many-to-one with User (CASCADE delete)
- `projections`: One-to-many with Projection

#### Projection
Retirement projection calculations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| userId | UUID | Foreign key to User |
| scenarioId | UUID | Foreign key to Scenario |
| retirementAge | Int | Retirement age for this projection |
| calculationDate | DateTime | When calculation was run |
| results | String | JSON of yearly projections |
| successProbability | Float | Success probability (%) |
| totalLifetimeIncome | Float | Calculated total income |
| estateValue | Float | Estimated estate value |
| createdAt | DateTime | Creation timestamp |

**Indexes**:
- `userId`
- `scenarioId`
- `(userId, scenarioId)` (composite)
- `createdAt`
- `calculationDate`

**Relationships**:
- `user`: Many-to-one with User (CASCADE delete)
- `scenario`: Many-to-one with Scenario (CASCADE delete)

## Indexes

### Indexing Strategy

All indexes have been added to optimize common query patterns:

1. **Single-column indexes**: For direct lookups (`userId`, `email`)
2. **Composite indexes**: For filtered queries (`userId + type`, `userId + isBaseline`)
3. **Timestamp indexes**: For sorting and filtering by date
4. **Foreign key indexes**: Automatically created by Prisma

### Index Coverage

| Query Pattern | Index Used | Coverage |
|--------------|------------|----------|
| Find user by email | `User.email` | 100% |
| Get user's income | `Income.userId` | 100% |
| Get user's RRSP assets | `Asset(userId, type)` | 100% |
| Get essential expenses | `Expense(userId, isEssential)` | 100% |
| Get baseline scenario | `Scenario(userId, isBaseline)` | 100% |
| Recent projections | `Projection.createdAt` | 100% |

### Monitoring Index Usage

```sql
-- Check index usage (PostgreSQL)
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

## Migrations

### Running Migrations

Use the migration helper script:

```bash
# Development - create and apply migration
./scripts/migrate.sh dev

# Production - deploy pending migrations
./scripts/migrate.sh deploy

# Check migration status
./scripts/migrate.sh status

# Reset database (WARNING: deletes all data)
./scripts/migrate.sh reset
```

### Manual Migration Commands

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Deploy to production
npx prisma migrate deploy

# Check status
npx prisma migrate status

# Reset database
npx prisma migrate reset
```

### Migration Best Practices

1. **Always create migrations in development first**
2. **Test migrations on staging before production**
3. **Use descriptive migration names**
4. **Review generated SQL before applying**
5. **Never edit migration files after they've been applied**
6. **Always backup before major migrations**

## Backup and Restore

### Creating Backups

```bash
# Create backup
./scripts/backup.sh

# Backups are stored in ./backups/ directory
# Format: {database}_YYYYMMDD_HHMMSS.sql.gz
# Automatically keeps last 7 backups
```

### Restoring from Backup

```bash
# Restore from backup
./scripts/restore.sh

# Follow prompts to select backup file
# Confirms before overwriting data
```

### Automated Backups

Set up cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/webapp && ./scripts/backup.sh >> /var/log/db-backup.log 2>&1
```

### Backup Best Practices

1. **Daily automated backups**
2. **Store backups offsite** (S3, Google Cloud Storage)
3. **Test restore procedure regularly**
4. **Keep backups for 30 days minimum**
5. **Encrypt backups containing sensitive data**

## Query Optimization

### Optimized Query Patterns

#### ✅ Good: Use `select` to limit fields

```typescript
const user = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    email: true,
    firstName: true,
  },
});
```

#### ❌ Bad: Fetch all fields

```typescript
const user = await prisma.user.findUnique({
  where: { email },
});
```

#### ✅ Good: Use `include` for related data

```typescript
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    assets: true,
    debts: true,
  },
});
```

#### ✅ Good: Paginate large result sets

```typescript
const expenses = await prisma.expense.findMany({
  where: { userId },
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' },
});
```

#### ✅ Good: Use transactions for related updates

```typescript
await prisma.$transaction([
  prisma.asset.create({ data: assetData }),
  prisma.scenario.update({ where: { id }, data: scenarioData }),
]);
```

### Avoiding N+1 Queries

#### ❌ Bad: N+1 query

```typescript
const users = await prisma.user.findMany();
for (const user of users) {
  const assets = await prisma.asset.findMany({ where: { userId: user.id } });
}
```

#### ✅ Good: Use include

```typescript
const users = await prisma.user.findMany({
  include: { assets: true },
});
```

### Slow Query Detection

Slow queries (>1000ms) are automatically logged in development. Check logs for warnings:

```
Slow query (1523ms): SELECT * FROM "User" WHERE...
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor error logs
- Check backup completion

#### Weekly
- Review slow query log
- Check index usage
- Monitor database size

#### Monthly
- Analyze query patterns
- Optimize slow queries
- Review and update indexes
- Test restore procedure

### Database Health Checks

```bash
# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Check table sizes
psql $DATABASE_URL -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Check index usage
psql $DATABASE_URL -c "SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan ASC LIMIT 10;"
```

### Vacuum and Analyze

PostgreSQL automatically runs VACUUM and ANALYZE, but you can run manually:

```sql
-- Analyze all tables (updates statistics)
ANALYZE;

-- Vacuum to reclaim space
VACUUM;

-- Full vacuum (requires table lock)
VACUUM FULL;
```

## Troubleshooting

### Connection Pool Exhausted

**Symptoms**: `Error: Can't reach database server` or timeout errors

**Solutions**:
1. Increase connection pool size in DATABASE_URL
2. Check for connection leaks
3. Use connection pooling proxy (PgBouncer)

### Slow Queries

**Symptoms**: API requests taking >2 seconds

**Solutions**:
1. Check slow query log
2. Add missing indexes
3. Optimize query with `select` and `include`
4. Add caching layer

### Migration Failures

**Symptoms**: Migration fails to apply

**Solutions**:
1. Check migration SQL for errors
2. Ensure database user has proper permissions
3. Restore from backup and retry
4. Contact database administrator

## Related Documentation

- [Phase 5 Progress](./PHASE5-PROGRESS.md)
- [Backup and Restore Guide](./BACKUP-RESTORE.md)
- [Migrations Guide](./MIGRATIONS.md)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## Changelog

### February 1, 2026
- **Added**: Dual simulation limit tracking fields to User table
  - `freeSimulationsUsed` - Tracks lifetime free simulations for unverified users (limit: 3)
  - `simulationRunsToday` - Tracks daily simulations for free tier users (limit: 10/day)
  - `simulationRunsDate` - Stores last simulation date for daily reset logic
- **Migrations**:
  - `20260201000000_add_free_simulations_tracking`
  - `20260201000001_add_daily_simulation_tracking`

### December 5, 2025
- Initial database documentation

---

*Last Updated*: February 1, 2026
*Updated By*: Claude Code
