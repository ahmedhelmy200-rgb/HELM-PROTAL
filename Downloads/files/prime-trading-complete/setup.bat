@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 PRIME TRADING - Setup
echo.

echo 1️⃣  Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not installed
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION%

echo.
echo 2️⃣  Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo 3️⃣  Creating .env.local...
if not exist ".env.local" (
    copy .env.local.example .env.local >nul
    echo ✅ Created .env.local
    echo ⚠️  Edit .env.local with your Stripe keys
)

echo.
echo 4️⃣  Ready to go!
echo.
echo Next steps:
echo 1. npm run dev       (test locally)
echo 2. vercel           (deploy to Vercel)
echo.
pause
