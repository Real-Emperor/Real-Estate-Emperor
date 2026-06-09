#!/bin/bash
# Setup local SQLite database for development
set -e

echo "🔧 Setting up local SQLite database..."

# Switch to SQLite schema
cp prisma/schema.prisma.local prisma/schema.prisma

# Set DATABASE_URL for SQLite
export DATABASE_URL="file:./prisma/dev.db"

# Generate Prisma client
npx prisma generate

# Create/push database schema
npx prisma db push --accept-data-loss

# Seed the database
npx tsx prisma/seed.ts

echo ""
echo "✅ Local database ready!"
echo "🔐 Login credentials:"
echo "   Admin:  admin@realestateemperor.ae / admin2024"
echo "   Owner:  demoO@realestate.ae / owner123"
echo "   Staff:  demoS@realestate.ae / staff123"
echo ""
echo "Run 'npm run dev' to start the development server."
