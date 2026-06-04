#!/bin/bash
# Development script that switches to SQLite for local development
# This allows running the app locally without PostgreSQL

set -e

echo "🔧 Setting up local development with SQLite..."

# Switch to SQLite schema for local dev
cp prisma/schema.prisma.local prisma/schema.prisma

# Update .env for local SQLite
export DATABASE_URL="file:./prisma/dev.db"

# Generate Prisma client for SQLite
npx prisma generate

# Push schema if database doesn't exist or needs update
npx prisma db push --accept-data-loss 2>/dev/null || true

# Seed if no users exist
USER_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0")
if [[ "$USER_COUNT" == *"0"* ]] || [[ -z "$USER_COUNT" ]]; then
  echo "🌱 Seeding database..."
  npx tsx prisma/seed.ts
fi

echo "✅ Local development ready!"
echo "🔐 Login credentials:"
echo "   Admin:  admin@alreef.ae / admin2024"
echo "   Owner:  owner@alreef.ae / owner123"
echo "   Staff:  staff@alreef.ae / staff123"
echo ""

# Start dev server
npx next dev -p 3000 2>&1 | tee dev.log
