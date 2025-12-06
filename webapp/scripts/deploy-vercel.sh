#!/bin/bash

# Vercel Deployment Script for RetireZest
# This script helps deploy the application to Vercel

set -e

echo "🚀 RetireZest Vercel Deployment Script"
echo "======================================="
echo ""

# Check if Vercel CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

# Step 1: Build Check
echo "📦 Step 1: Running production build check..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 2: Authentication Check
echo "🔐 Step 2: Checking Vercel authentication..."
if npx vercel whoami &> /dev/null; then
    VERCEL_USER=$(npx vercel whoami)
    echo "✅ Already authenticated as: $VERCEL_USER"
else
    echo "📝 Please authenticate with Vercel..."
    npx vercel login
fi

echo ""

# Step 3: Environment Variables Checklist
echo "⚙️  Step 3: Environment Variables Checklist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Before deploying, ensure these environment variables are set in Vercel:"
echo ""
echo "Required:"
echo "  ✓ DATABASE_URL           - PostgreSQL connection string"
echo "  ✓ JWT_SECRET            - Min 32 characters (use: openssl rand -base64 32)"
echo "  ✓ NEXTAUTH_SECRET       - Min 32 characters (use: openssl rand -base64 32)"
echo "  ✓ NEXTAUTH_URL          - Your production URL (e.g., https://your-app.vercel.app)"
echo "  ✓ NODE_ENV              - Set to 'production'"
echo "  ✓ NEXT_PUBLIC_APP_URL   - Your production URL"
echo ""
echo "Optional:"
echo "  ○ SENTRY_DSN            - Sentry error tracking"
echo "  ○ SENTRY_ORG            - Sentry organization"
echo "  ○ SENTRY_PROJECT        - Sentry project name"
echo ""

read -p "Have you configured all required environment variables in Vercel? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please configure environment variables first:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Select your project (or create new)"
    echo "3. Go to Settings → Environment Variables"
    echo "4. Add all required variables"
    echo ""
    echo "For detailed instructions, see: docs/VERCEL-DEPLOYMENT.md"
    exit 1
fi

echo ""

# Step 4: Database Setup
echo "🗄️  Step 4: Database Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Choose your database option:"
echo "  1. Vercel Postgres (Recommended for new projects)"
echo "  2. External PostgreSQL (Neon, Supabase, AWS RDS, etc.)"
echo "  3. Already configured"
echo ""
read -p "Select option (1-3): " -n 1 -r DB_OPTION
echo ""

if [ "$DB_OPTION" = "1" ]; then
    echo "📖 To set up Vercel Postgres:"
    echo "   1. Go to your Vercel dashboard"
    echo "   2. Select 'Storage' tab"
    echo "   3. Click 'Create Database' → 'Postgres'"
    echo "   4. DATABASE_URL will be automatically added"
    echo ""
    read -p "Press Enter when database is created..."
elif [ "$DB_OPTION" = "2" ]; then
    echo "📖 Ensure you've:"
    echo "   1. Created a PostgreSQL database on your provider"
    echo "   2. Added DATABASE_URL to Vercel environment variables"
    echo "   3. Connection string includes '?sslmode=require'"
    echo ""
    read -p "Press Enter when ready..."
fi

echo ""

# Step 5: Deploy
echo "🚀 Step 5: Deploying to Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Deploy to production? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo "Deploying to production..."
npx vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next Steps:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Run database migrations:"
    echo "   npx vercel env pull .env.production"
    echo "   DATABASE_URL=\"<production-db-url>\" npx prisma migrate deploy"
    echo ""
    echo "2. Test your deployment:"
    echo "   - Visit your production URL"
    echo "   - Test user registration and login"
    echo "   - Run a retirement simulation"
    echo "   - Check /api/health/ready endpoint"
    echo ""
    echo "3. Set up monitoring:"
    echo "   - Check Vercel Analytics dashboard"
    echo "   - Configure Sentry alerts (if enabled)"
    echo ""
    echo "See docs/VERCEL-DEPLOYMENT.md for detailed post-deployment steps."
else
    echo "❌ Deployment failed. Check error messages above."
    exit 1
fi
