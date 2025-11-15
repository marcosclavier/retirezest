#!/bin/bash

# Canadian Retirement Planning App - Dependency Installation Script
echo "======================================"
echo "Installing Additional Dependencies"
echo "======================================"
echo ""

# Navigate to the correct directory
cd "$(dirname "$0")"

echo "📦 Installing Prisma and database tools..."
npm install prisma @prisma/client

echo ""
echo "📝 Installing form libraries..."
npm install react-hook-form @hookform/resolvers zod

echo ""
echo "🔐 Installing authentication libraries..."
npm install jose bcryptjs
npm install --save-dev @types/bcryptjs

echo ""
echo "📊 Installing chart and utility libraries..."
npm install recharts date-fns clsx tailwind-merge

echo ""
echo "✅ All dependencies installed!"
echo ""

echo "📋 Next steps:"
echo "1. Generate Prisma client: npx prisma generate"
echo "2. Run database migrations: npx prisma migrate dev --name init"
echo "3. Start development server: npm run dev"
echo ""
echo "======================================"
echo "Installation Complete!"
echo "======================================"
