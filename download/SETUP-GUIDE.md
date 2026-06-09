# Real Estate Emperor Property Dashboard - Production Setup Guide

## Quick Setup (5 Minutes) - When Client Says YES

This guide walks you through setting up a production-ready instance for a new client.

### Step 1: Create Vercel Postgres Database

1. Go to https://vercel.com/dashboard
2. Click on **real-estate-emperor** project
3. Go to **Storage** tab
4. Click **Create Database** → Select **Postgres (Neon)**
5. Choose the free tier (Hobby) or paid tier based on client needs
6. Click **Create** - this automatically:
   - Creates a PostgreSQL database
   - Sets the `DATABASE_URL` environment variable
   - Sets `POSTGRES_URL` and related variables

### Step 2: Run Database Migrations

After creating the database, you need to run the migration to create all tables:

1. Go to your project's **Settings** → **Environment Variables**
2. Verify `DATABASE_URL` is set (it should be auto-set by Vercel Postgres)
3. Also verify `NEXTAUTH_SECRET` is set (already added by us)
4. In a terminal with the Vercel CLI:
   ```bash
   # Pull the environment variables
   vercel env pull .env.local --token YOUR_VERCEL_TOKEN

   # Run the migration
   npx prisma migrate deploy
   ```

   OR use the Vercel dashboard:
   - Go to your project → **Deployments** → **...** menu → **Redeploy**
   - The migration should run automatically via the postinstall hook

### Step 3: Seed the Database

Use the API endpoint to seed demo data (or skip this for a clean start):

```bash
# Seed with demo data (for client demo)
curl -X POST https://real-estate-emperor.vercel.app/api/seed \
  -H "Content-Type: application/json"

# OR seed with the admin setup only (clean start for production)
# The seed endpoint creates: Company + 3 default users (admin, owner, staff)
```

### Step 4: Verify It Works

1. Visit https://real-estate-emperor.vercel.app
2. Login with:
   - **Admin**: admin@alreef.ae / admin2024
   - **Owner**: demoO@realestate.ae / owner123
   - **Staff**: demoS@realestate.ae / staff123

---

## What Was Built

### Production-Ready Infrastructure

| Feature | Status | Details |
|---------|--------|---------|
| PostgreSQL Database | ✅ | Via Vercel Postgres (Neon) - auto-backups, scaling |
| Authentication | ✅ | NextAuth.js v5 with JWT sessions, bcrypt password hashing |
| Role-Based Access | ✅ | Owner, Admin, Staff - enforced at API level |
| API Layer | ✅ | 20+ REST API routes with proper error codes |
| Audit Logging | ✅ | Every CREATE, UPDATE, DELETE, LOGIN is logged |
| Soft Deletes | ✅ | Data never permanently lost - can be recovered |
| Data Import | ✅ | Bulk import via /api/import (replace or append mode) |
| XLSX Export | ✅ | Full 6-sheet export in Reports section |
| Multi-Language | ✅ | English, Arabic (RTL), Bengali, Urdu |
| WhatsApp Integration | ✅ | 5-language payment reminders |

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/callback/credentials | Login | Public |
| GET/PUT | /api/company | Company info | Auth |
| GET/POST | /api/properties | List/Create properties | Auth |
| GET/PUT/DELETE/PATCH | /api/properties/[id] | Property CRUD | Auth (Delete: Owner/Admin) |
| GET/POST | /api/tenants | List/Create tenants | Auth |
| GET/PUT/DELETE | /api/tenants/[id] | Tenant CRUD | Auth (Delete: Owner/Admin) |
| GET/POST | /api/payments | List/Create payments | Auth |
| GET/POST | /api/expenses | List/Create expenses | Owner/Admin |
| GET/PUT/DELETE | /api/expenses/[id] | Expense CRUD | Owner/Admin |
| GET/POST | /api/maintenance | List/Create maintenance | Auth |
| GET/PUT/DELETE | /api/maintenance/[id] | Maintenance CRUD | Auth (Delete: Owner/Admin) |
| GET | /api/dashboard | Dashboard data | Auth |
| GET | /api/reports | P&L report data | Owner/Admin |
| POST | /api/import | Bulk data import | Owner/Admin |
| POST | /api/seed | Seed demo data | Owner/Admin |
| GET/POST | /api/reset-requests | Password reset requests | GET: Admin, POST: Public |
| PATCH | /api/reset-requests/[id] | Resolve/dismiss request | Admin |
| GET/POST | /api/users | List/Create users | Admin |
| GET/PUT/DELETE | /api/users/[id] | User CRUD | Admin |
| POST | /api/users/reset-password | Reset user password | Admin |

### Data Security

- **Passwords**: Hashed with bcrypt (12 salt rounds)
- **Sessions**: JWT-based, 24-hour expiry, signed with NEXTAUTH_SECRET
- **API Protection**: All routes require authentication
- **Soft Deletes**: Deleted data is recoverable (deletedAt timestamp)
- **Audit Trail**: Every data change is logged with before/after snapshots
- **Role Enforcement**: Staff cannot access financial data or delete records

### Importing Client Data

When a client provides their data in Excel format, you can import it via the API:

```bash
curl -X POST https://real-estate-emperor.vercel.app/api/import \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SESSION_TOKEN" \
  -d '{
    "mode": "replace",
    "data": {
      "properties": [
        {"name": "Building A", "type": "apartment", "address": "...", "totalUnits": 15, "floors": 5}
      ],
      "tenants": [
        {"name": "John Doe", "phone": "050-123-4567", "propertyId": "...", "rentAmount": 3000, ...}
      ],
      "expenses": [...],
      "maintenance": [...]
    }
  }'
```

Modes:
- **replace**: Soft-deletes all existing data, then imports new data
- **append**: Adds to existing data without removing anything

### Setting Up for a New Client

For each new client, the recommended workflow is:

1. **Create a new Vercel project** (or use the same one with a different database)
2. **Set up Vercel Postgres** for that project
3. **Run migrations** to create tables
4. **Import client data** via the /api/import endpoint
5. **Change default passwords** for all users
6. **Update company info** via Settings → Company (or /api/company)
7. **Hand over credentials** to the client

### Backup & Recovery

Vercel Postgres (Neon) provides:
- **Automatic daily backups** on paid plans
- **Point-in-time recovery** on paid plans
- **Branching** for safe schema changes
- Free tier includes basic backups

For additional safety, you can export data via the XLSX export feature in Reports.

---

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@ep-xxx.neon.tech/dbname |
| NEXTAUTH_SECRET | JWT signing key | (auto-generated, already set) |

Both are already configured on Vercel. DATABASE_URL will be set automatically when you create Vercel Postgres.
