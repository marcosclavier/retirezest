# Database Migrations Guide

Guide for managing database schema changes with Prisma Migrate.

## Quick Reference

```bash
# Create and apply migration (development)
./scripts/migrate.sh dev

# Apply pending migrations (production)
./scripts/migrate.sh deploy

# Check migration status
./scripts/migrate.sh status

# Reset database (WARNING: deletes all data)
./scripts/migrate.sh reset
```

## Migration Workflow

### Development

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration**:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
3. **Review generated SQL** in `prisma/migrations/`
4. **Test migration** locally
5. **Commit migration files** to git

### Staging/Production

1. **Deploy migrations**:
   ```bash
   npx prisma migrate deploy
   ```
2. **Verify deployment**:
   ```bash
   npx prisma migrate status
   ```

## Migration Commands

### Create Migration (Development)

```bash
npx prisma migrate dev --name add_user_avatar
```

Creates a new migration and applies it immediately.

### Deploy Migration (Production)

```bash
npx prisma migrate deploy
```

Applies all pending migrations without prompting.

### Check Status

```bash
npx prisma migrate status
```

Shows which migrations have been applied and which are pending.

### Reset Database

```bash
npx prisma migrate reset
```

Drops database, recreates it, and applies all migrations. **Deletes all data!**

### Create Migration Without Applying

```bash
npx prisma migrate dev --create-only
```

Generates migration file but doesn't apply it.

## Best Practices

1. **Always backup before migrating production**
2. **Test migrations on staging first**
3. **Use descriptive migration names**
4. **Review generated SQL before applying**
5. **Never edit migrations after they're applied**
6. **Keep migrations small and focused**
7. **Plan for rollback if migration fails**

## Common Scenarios

### Adding a New Field

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  // Add new field
  phone     String?  // Optional field is safe to add
  createdAt DateTime @default(now())
}
```

```bash
npx prisma migrate dev --name add_user_phone
```

### Adding a Required Field

⚠️ **Caution**: Adding a required field to a table with existing data requires a multi-step migration.

**Step 1**: Add as optional field
```prisma
model User {
  phone String? // Add as optional first
}
```

**Step 2**: Populate data
```sql
UPDATE "User" SET phone = 'default-value' WHERE phone IS NULL;
```

**Step 3**: Make required
```prisma
model User {
  phone String // Now make required
}
```

### Renaming a Field

⚠️ **Caution**: Prisma treats renames as drop + create, which loses data.

**Safe approach**: Use raw SQL migration

1. Create migration with `--create-only`
2. Edit SQL to use `ALTER TABLE ... RENAME COLUMN`
3. Apply migration

### Adding an Index

```prisma
model User {
  email String @unique

  @@index([email]) // Add index
}
```

```bash
npx prisma migrate dev --name add_email_index
```

### Removing a Field

⚠️ **Caution**: Ensure no code references this field first.

```prisma
model User {
  // Remove field
  // oldField String
}
```

### Changing Field Type

⚠️ **Caution**: May lose data or fail if incompatible.

```prisma
model User {
  // Change String to Int (risky!)
  age Int // was String
}
```

**Safe approach**:
1. Add new field with new type
2. Migrate data
3. Remove old field

## Rollback Strategies

### No Built-in Rollback

Prisma Migrate doesn't support automatic rollback. Options:

1. **Restore from backup**
2. **Create reverse migration manually**
3. **Use database transaction** (not always possible)

### Manual Rollback

1. **Backup database** before migration
2. If migration fails, **restore from backup**
3. Fix migration issue
4. Try again

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Vercel Deployment

Add to `package.json`:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

## Troubleshooting

### Migration Fails

1. **Check error message** for details
2. **Review migration SQL** for syntax errors
3. **Check database permissions**
4. **Verify DATABASE_URL** is correct
5. **Restore from backup** if needed

### Schema Drift

If schema doesn't match migrations:

```bash
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma
```

### Baseline Existing Database

For databases with existing schema:

```bash
npx prisma db pull # Pull schema from database
npx prisma migrate dev --name initial_migration
```

## Related Documentation

- [Database Documentation](./DATABASE.md)
- [Backup and Restore Guide](./BACKUP-RESTORE.md)
- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

*Last Updated*: 2025-12-05
