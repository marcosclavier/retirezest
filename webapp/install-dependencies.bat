@echo off
REM Canadian Retirement Planning App - Dependency Installation Script
echo ======================================
echo Installing Additional Dependencies
echo ======================================
echo.

cd /d "%~dp0"

echo Installing Prisma and database tools...
call npm install prisma @prisma/client

echo.
echo Installing form libraries...
call npm install react-hook-form @hookform/resolvers zod

echo.
echo Installing authentication libraries...
call npm install jose bcryptjs
call npm install --save-dev @types/bcryptjs

echo.
echo Installing chart and utility libraries...
call npm install recharts date-fns clsx tailwind-merge

echo.
echo All dependencies installed!
echo.

echo Next steps:
echo 1. Generate Prisma client: npx prisma generate
echo 2. Run database migrations: npx prisma migrate dev --name init
echo 3. Start development server: npm run dev
echo.
echo ======================================
echo Installation Complete!
echo ======================================
pause
