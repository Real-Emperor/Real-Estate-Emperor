#!/bin/bash
# Vercel build script - ensures PostgreSQL schema is used for production
# This runs before the Next.js build on Vercel

set -e

echo "🔧 Preparing production build with PostgreSQL..."

# Ensure we're using the PostgreSQL schema (not SQLite)
if [ -f "prisma/schema.prisma.prod" ]; then
  cp prisma/schema.prisma.prod prisma/schema.prisma
  echo "✅ Switched to PostgreSQL schema"
fi

# Generate Prisma client
npx prisma generate

# Run pending migrations (safe - only applies unapplied migrations)
npx prisma migrate deploy
echo "✅ Migrations applied"

# Run Next.js build
npx next build

echo "✅ Production build complete!"
