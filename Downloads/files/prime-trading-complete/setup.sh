#!/bin/bash
set -e

echo "🚀 PRIME TRADING - Setup"
echo ""

echo "1️⃣  Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed"
    exit 1
fi
echo "✅ Node.js $(node -v)"

echo ""
echo "2️⃣  Installing dependencies..."
npm install --legacy-peer-deps

echo ""
echo "3️⃣  Creating .env.local..."
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo "✅ Created .env.local"
    echo "⚠️  Edit .env.local with your Stripe keys"
fi

echo ""
echo "4️⃣  Ready to go!"
echo ""
echo "Next steps:"
echo "1. npm run dev       (test locally)"
echo "2. vercel           (deploy to Vercel)"
echo ""
