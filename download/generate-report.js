const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, Table, TableRow,
  TableCell, WidthType, BorderStyle, ShadingType, PageBreak,
  TableOfContents, NumberFormat
} = require("docx");
const fs = require("fs");

// ── Palette: Deep Sea Blue-Gold (Finance / Investment / Premium) ──
const P = {
  primary: "#0F2027", body: "#1C2A3D", secondary: "#4A6575",
  accent: "#D4AF37", surface: "#F5F7FA",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "0F2027", headerText: "FFFFFF", accentLine: "D4AF37", innerLine: "D0D8D0", surface: "F0F4F2" },
};
const c = (hex) => hex.replace("#", "");

// ── Helpers ──
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, color: c(P.primary), font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 32 })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: c(P.primary), font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 28 })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 24 })],
  });
}

function bodyText(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } })],
  });
}

function bulletItem(text, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 60 },
    indent: { left: 480 + level * 360 },
    children: [
      new TextRun({ text: "\u2022  ", size: 22, color: c(P.accent), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}

function severityBadge(severity) {
  const colors = { "CRITICAL": "C0392B", "HIGH": "D4875A", "MEDIUM": "D4AF37", "LOW": "27AE60", "PASS": "2980B9" };
  return new TextRun({ text: ` [${severity}] `, bold: true, size: 20, color: colors[severity] || "606060", font: { ascii: "Times New Roman" } });
}

// ── Table builder ──
function makeTable(headers, rows) {
  const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const cellBorder = { top: { style: BorderStyle.SINGLE, size: 1, color: c(P.table.innerLine) }, bottom: { style: BorderStyle.SINGLE, size: 1, color: c(P.table.innerLine) }, left: NB, right: NB };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: c(P.table.innerLine) },
      insideVertical: NB,
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h => new TableCell({
          shading: { type: ShadingType.CLEAR, fill: c(P.table.headerBg) },
          borders: { top: NB, bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) }, left: NB, right: NB },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: c(P.table.headerText), font: { ascii: "Times New Roman", eastAsia: "SimHei" } })] })],
        })),
      }),
      ...rows.map((row, idx) => new TableRow({
        children: row.map(cell => new TableCell({
          shading: idx % 2 === 0 ? { type: ShadingType.CLEAR, fill: c(P.table.surface) } : { type: ShadingType.CLEAR, fill: "FFFFFF" },
          borders: cellBorder,
          margins: { top: 50, bottom: 50, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 20, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } })] })],
        })),
      })),
    ],
  });
}

// ── Cover Page (R1 style - Dark bg) ──
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function buildCover() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        verticalAlign: "top",
        borders: allNoBorders,
        shading: { type: ShadingType.CLEAR, fill: c(P.primary) },
        width: { size: 100, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({ spacing: { before: 3200 }, children: [] }),
          new Paragraph({
            spacing: { before: 800 },
            border: { top: { style: BorderStyle.SINGLE, size: 18, color: c(P.accent), space: 20 } },
            indent: { left: 1200, right: 1200 },
            children: [],
          }),
          new Paragraph({
            spacing: { before: 400, after: 100 },
            alignment: AlignmentType.LEFT,
            indent: { left: 1200, right: 1200 },
            children: [
              new TextRun({ text: "PRODUCTION READINESS", size: 72, bold: true, color: c(P.cover.titleColor), font: { ascii: "Times New Roman", eastAsia: "SimHei" } }),
            ],
          }),
          new Paragraph({
            spacing: { before: 80, after: 100 },
            alignment: AlignmentType.LEFT,
            indent: { left: 1200, right: 1200 },
            children: [
              new TextRun({ text: "ASSESSMENT REPORT", size: 72, bold: true, color: c(P.cover.titleColor), font: { ascii: "Times New Roman", eastAsia: "SimHei" } }),
            ],
          }),
          new Paragraph({
            spacing: { before: 200, after: 100 },
            alignment: AlignmentType.LEFT,
            indent: { left: 1200, right: 1200 },
            children: [
              new TextRun({ text: "Real Estate Emperor Property Management Platform", size: 28, color: c(P.accent), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }, italics: true }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 100 },
            alignment: AlignmentType.LEFT,
            indent: { left: 1200, right: 1200 },
            children: [
              new TextRun({ text: "Reliability, Scalability & Commercial Viability Audit", size: 24, color: c(P.cover.subtitleColor), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } }),
            ],
          }),
          new Paragraph({
            spacing: { before: 400 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: c(P.accent), space: 20 } },
            indent: { left: 1200, right: 1200 },
            children: [],
          }),
          new Paragraph({
            spacing: { before: 600 },
            alignment: AlignmentType.LEFT,
            indent: { left: 1200 },
            children: [
              new TextRun({ text: "Prepared: May 2026", size: 20, color: c(P.cover.metaColor), font: { ascii: "Times New Roman" } }),
            ],
          }),
          new Paragraph({
            spacing: { before: 80 },
            alignment: AlignmentType.LEFT,
            indent: { left: 1200 },
            children: [
              new TextRun({ text: "Classification: Confidential", size: 20, color: c(P.cover.metaColor), font: { ascii: "Times New Roman" } }),
            ],
          }),
        ],
      })],
    })],
  });
}

// ── Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }, size: 22, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) } },
      heading2: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) } },
      heading3: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.body) } },
    },
  },
  sections: [
    // Cover Section
    {
      properties: {
        page: { margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: [buildCover()],
    },
    // TOC Section
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children: [
        new Paragraph({
          spacing: { before: 200, after: 300 },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, color: c(P.primary), font: { ascii: "Times New Roman", eastAsia: "SimHei" } })],
        }),
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({ text: "Note: Right-click the Table of Contents and select \u201cUpdate Field\u201d to refresh page numbers.", italics: true, size: 18, color: c(P.secondary) })],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // Body Section
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Real Estate Emperor \u2014 Production Readiness Assessment  |  Page ", size: 16, color: c(P.secondary) }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: c(P.secondary) }),
            ],
          })],
        }),
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: c(P.accent) } },
            children: [new TextRun({ text: "CONFIDENTIAL", size: 14, color: c(P.accent), italics: true })],
          })],
        }),
      },
      children: [
        // ═══════════════════════════════════════════
        // EXECUTIVE SUMMARY
        // ═══════════════════════════════════════════
        heading1("Executive Summary"),
        bodyText("This report provides a comprehensive production readiness assessment of the Real Estate Emperor Property Management Platform, a Next.js-based web application built on Neon PostgreSQL and deployed via Vercel. The platform is intended for commercial sale as a SaaS product serving real estate management companies in the UAE and wider Gulf region. The assessment covers system reliability and data integrity, the transition path from demo to live production, and long-term maintenance requirements."),
        bodyText("After thorough code audit and infrastructure analysis, the overall verdict is that the platform is NOT YET READY for commercial SaaS sale in its current state. While the core feature set is impressive and functionally complete, there are 9 critical security and reliability gaps that must be resolved before any client data can be entrusted to the system. These gaps center around three fundamental areas: inadequate backup and disaster recovery, insufficient multi-tenant data isolation, and missing security hardening."),
        bodyText("The positive news is that all identified issues are architecturally fixable without rebuilding the application. The tech stack choices (Next.js, Prisma, Neon, Vercel) are sound and industry-standard. The feature set (properties, tenants, payments, expenses, maintenance, audit logs, XLSX import/export, receipts, notifications, 2FA) is competitive and well-implemented. With an estimated 3-4 weeks of focused engineering work on the critical gaps, the platform can reach commercial-grade reliability."),

        makeTable(
          ["Category", "Rating", "Critical", "High", "Medium"],
          [
            ["Backup & Disaster Recovery", "NOT READY", "2", "2", "0"],
            ["Rate Limiting & API Security", "NOT READY", "2", "2", "0"],
            ["Data Validation", "NEEDS WORK", "0", "3", "2"],
            ["Authentication Security", "NOT READY", "3", "2", "1"],
            ["Multi-Tenancy Isolation", "NOT READY", "3", "1", "1"],
            ["Error Handling & Logging", "NEEDS WORK", "0", "2", "3"],
            ["Database Constraints", "NEEDS WORK", "0", "3", "3"],
            ["Environment & Secrets", "NOT READY", "3", "1", "1"],
            ["PWA Configuration", "INCOMPLETE", "1", "1", "3"],
            ["Monitoring & Observability", "NOT READY", "2", "2", "1"],
          ]
        ),
        new Paragraph({ spacing: { before: 100, after: 200 }, children: [new TextRun({ text: "Table 1: Category Assessment Summary", italics: true, size: 18, color: c(P.secondary) })] }),

        // ═══════════════════════════════════════════
        // SECTION 1: SYSTEM RELIABILITY & DATA INTEGRITY
        // ═══════════════════════════════════════════
        heading1("1. System Reliability & Data Integrity"),

        heading2("1.1 Is the Platform Production-Ready?"),
        bodyText("In its current state, the platform is functionally complete as a demo and internal tool, but it is NOT production-ready for commercial SaaS sale. The core issue is that while the feature set works well under normal conditions, the system lacks the defensive depth required when real financial data and client trust are at stake. Production-ready means the system must gracefully handle edge cases, prevent data loss, resist attacks, and recover from failures automatically. Currently, several single points of failure could result in data loss or unauthorized access."),
        bodyText("The application uses a modern, well-supported technology stack: Next.js 16 with React 19, Prisma ORM with PostgreSQL (Neon), NextAuth v5 for authentication, and Vercel for serverless deployment. These are all solid, enterprise-capable technologies. The implementation quality of the business logic is good: role-based access control, audit logging, soft deletes, and comprehensive CRUD operations are all present. The gaps are in the infrastructure layer, not the application layer."),

        heading2("1.2 Data Integrity & Persistence"),
        bodyText("Data integrity at the database level is partially addressed. Prisma ORM provides parameterized queries that prevent SQL injection, and the PostgreSQL database on Neon enforces ACID compliance for individual transactions. Foreign key constraints exist for most relationships, and the soft-delete pattern (using deletedAt timestamps) prevents accidental permanent data loss from user actions."),
        bodyText("However, there are significant gaps in data integrity guarantees. The Payment model lacks a companyId column, meaning payment queries must join through the Tenant table, which creates both a performance concern and a data isolation risk. String enum fields (role, type, status, priority) are stored as unconstrained TEXT columns in PostgreSQL rather than using CHECK constraints or PostgreSQL ENUM types, allowing invalid values to be written directly to the database if any code path bypasses validation. The restore-from-backup endpoint does not use database transactions, meaning a failed restore midway leaves the database in an inconsistent state with some records updated and others not."),

        heading3("Critical Data Integrity Gaps"),
        bulletItem("No transaction wrapping on backup restore operations - partial restores can corrupt data"),
        bulletItem("Payment model has no companyId field - requires JOINs for company scoping, creating isolation risk"),
        bulletItem("Database enum values are not enforced at the PostgreSQL level - only application-level validation"),
        bulletItem("User email is globally unique across all companies - prevents same email in different companies (SaaS dealbreaker)"),
        bulletItem("No database-level Row-Level Security (RLS) - data isolation relies entirely on application code"),

        heading2("1.3 Backup Systems & Disaster Recovery"),
        bodyText("This is the single most critical gap in the platform. The current backup system provides a false sense of security: while there is a manual backup export (JSON download) and an automated daily cron job, the automated backup only stores metadata records in the same database it is supposedly backing up. The actual backup data (the JSON export) is generated, measured, and then discarded. If the database becomes corrupted or is accidentally deleted, all backup records are lost along with the data they reference."),
        bodyText("A proper backup system must store backup data externally, separate from the primary database. This typically means cloud object storage (AWS S3, Cloudflare R2, or Google Cloud Storage) with lifecycle policies for retention. The backup must also be encrypted at rest, tested periodically through restore drills, and geo-redundant to survive regional outages."),

        makeTable(
          ["Requirement", "Current State", "Required for Production"],
          [
            ["External backup storage", "None - metadata only in same DB", "S3/R2 with encrypted at-rest storage"],
            ["Automated daily backup", "Cron job exists but data is discarded", "Cron + actual file upload to cloud storage"],
            ["Backup verification", "None", "Automated restore-test on staging"],
            ["Geo-redundancy", "None", "Cross-region replication"],
            ["Restore with transactions", "No - partial restore corrupts data", "Prisma $transaction for atomic restore"],
            ["Backup retention policy", "30-day metadata only", "90-day minimum with offsite archival"],
            ["Point-in-time recovery", "Not available", "Neon PITR (available on Pro plan)"],
          ]
        ),
        new Paragraph({ spacing: { before: 100, after: 200 }, children: [new TextRun({ text: "Table 2: Backup & Disaster Recovery Gap Analysis", italics: true, size: 18, color: c(P.secondary) })] }),

        heading2("1.4 Data Security & Safeguards"),
        bodyText("Data security has several critical weaknesses that must be addressed before commercial deployment. The most severe is that the NEXTAUTH_SECRET (the key used to sign and encrypt all JWT session tokens) is hardcoded in a .env file that appears to be tracked in the git repository. If this repository is ever publicly exposed, an attacker can forge valid session tokens for any user, including administrators, granting full access to all company data across the entire platform."),
        bodyText("The forgot-password endpoint returns the actual reset token in the API response body, completely defeating the purpose of token-based password reset. In a proper implementation, the token should only be delivered via email, never exposed in an API response. Similarly, the setup endpoint returns plaintext passwords in the HTTP response, which could be intercepted or logged by proxy servers, CDN edge nodes, or browser developer tools."),
        bodyText("There is no CSRF (Cross-Site Request Forgery) protection on custom API routes. While NextAuth v5 provides CSRF protection for its own authentication endpoints, all other API routes (properties, tenants, payments, etc.) are unprotected. An attacker can craft a malicious webpage that makes authenticated requests to the platform on behalf of a logged-in user, potentially deleting data, creating fake payments, or resetting company data."),

        heading3("Critical Security Gaps"),
        bulletItem("NEXTAUTH_SECRET hardcoded in .env file tracked by git - all sessions are forgeable if repo is exposed"),
        bulletItem("Forgot-password endpoint returns reset token in API response - defeats email-based reset security"),
        bulletItem("Setup endpoint returns plaintext passwords in HTTP response - visible in logs and browser DevTools"),
        bulletItem("No CSRF protection on custom API routes - vulnerable to cross-site request forgery attacks"),
        bulletItem("Deactivated users retain valid JWT sessions for up to 24 hours - no immediate session invalidation"),
        bulletItem("Rate limiting fails open - if DB check fails, login is allowed instead of blocked"),
        bulletItem("No IP-based rate limiting - attackers can rotate email addresses to bypass per-email limits"),

        heading2("1.5 Versioning, Activity Logging & Rollback"),
        bodyText("The platform has a comprehensive audit logging system that tracks CREATE, UPDATE, DELETE, LOGIN, and LOGOUT actions across all entities. Each audit log entry includes the action type, entity type, entity ID, user ID, timestamp, and a JSON details field with before/after snapshots. This is well-implemented and provides good traceability for forensic analysis."),
        bodyText("However, there is no true data versioning or rollback capability. The soft-delete pattern allows recovery of deleted records (by removing the deletedAt timestamp), but there is no way to revert a record to a previous state if it was modified incorrectly. The audit logs contain before/after snapshots that could theoretically be used for manual reconstruction, but there is no automated rollback feature. For a commercial SaaS, an undo/rollback capability for the most critical operations (payment recording, tenant modifications) would significantly reduce support burden and increase customer confidence."),
        bulletItem("Audit logging: Present and comprehensive - tracks all CRUD operations with user, timestamp, and details"),
        bulletItem("Soft deletes: Implemented on properties, tenants, expenses, and maintenance - allows recovery of deleted records"),
        bulletItem("Hard deletes: Used for payments and audit logs - these cannot be recovered once deleted"),
        bulletItem("Data versioning: Not implemented - no way to revert a record to a previous state"),
        bulletItem("Automated rollback: Not implemented - manual database intervention required for data recovery"),

        heading2("1.6 Scalability"),
        bodyText("The platform can scale reliably to serve a single company with hundreds of tenants and thousands of transactions. However, scaling to multiple companies (multi-tenant SaaS) introduces several performance bottlenecks that must be addressed. The most significant is the dashboard endpoint, which makes 6+ parallel database queries and performs some filtering in JavaScript rather than at the database level. With 10+ companies each having hundreds of tenants, this endpoint will become noticeably slow."),
        bodyText("Neon PostgreSQL on the free tier provides 500MB of storage, which is sufficient for a single company but will fill quickly in a multi-tenant SaaS. Audit logs, backup records, and notifications grow indefinitely with no archival or partitioning strategy. The Pro plan ($19/month) provides 10GB storage and Point-in-Time Recovery, which is essential for production use. Connection pooling is also critical: the current implementation opens a new database connection for each serverless function invocation, which will exhaust Neon's connection limits under load."),

        makeTable(
          ["Scaling Dimension", "Current Limit", "Production Recommendation"],
          [
            ["Single company tenants", "~500 tenants comfortably", "Sufficient for most clients"],
            ["Multi-company (SaaS)", "5-10 companies", "Requires connection pooling + query optimization"],
            ["Dashboard query performance", "Fast up to ~1000 tenants", "N+1 query issue beyond that - needs optimization"],
            ["Neon storage (free tier)", "500MB", "Upgrade to Pro (10GB) for production"],
            ["Audit log growth", "Unbounded - no archival", "Implement 90-day archival policy"],
            ["Serverless function timeout", "10s (Vercel Hobby)", "Upgrade to Pro (60s) for backup/import"],
            ["Database connections", "New connection per request", "Implement Prisma connection pooling"],
          ]
        ),
        new Paragraph({ spacing: { before: 100, after: 200 }, children: [new TextRun({ text: "Table 3: Scalability Limits and Recommendations", italics: true, size: 18, color: c(P.secondary) })] }),

        // ═══════════════════════════════════════════
        // SECTION 2: TRANSITION FROM DEMO TO PRODUCTION
        // ═══════════════════════════════════════════
        heading1("2. Transition from Demo to Live Production"),

        heading2("2.1 Recommended Transition Process"),
        bodyText("The transition from demo to production involves three phases: data cleanup, data import, and validation. The platform already has the tools to support this transition, but the process should be formalized to ensure no demo data leaks into the production environment and no client data is lost during the transition."),
        bodyText("Phase 1 (Data Cleanup): Use the Reset Company Data function available in the admin dashboard under Settings. This function soft-deletes all properties, tenants, payments, expenses, maintenance records, and audit logs while preserving user accounts and company information. The admin must type RESET_ALL_DATA to confirm, providing a safety mechanism against accidental activation. This has been tested and verified working on the production database."),
        bodyText("Phase 2 (Data Import): Use the XLSX Import feature accessible from the sidebar. The recommended workflow is to first download the import template (which provides pre-formatted sheets for Properties, Tenants, Expenses, and Maintenance), fill it with the client's actual data using Excel or Google Sheets, then upload it using Replace mode. The import system auto-detects sheet types by name and provides detailed error reporting for any rows that fail validation."),
        bodyText("Phase 3 (Validation): After import, the admin should review the dashboard to verify the imported data appears correctly. Key checks include: confirming the total number of properties and tenants matches the source data, verifying rent amounts and payment records, and checking that tenants are correctly linked to their respective properties."),

        heading2("2.2 Data Provisioning & Client Onboarding"),
        bodyText("The client does NOT need to provide datasets in any specific technical format. The XLSX import template is designed for non-technical users and includes sample data rows that demonstrate the expected format. Column headers use plain English (name, phone, rent_amount) with alternative aliases supported (building, mobile, monthly_rent), making it intuitive for anyone familiar with spreadsheet software."),
        bodyText("The recommended onboarding workflow for a new client is as follows: First, create a new company account through the signup page. Then, configure the company details (name, address, phone). Next, download the XLSX import template from the Import Data page. Fill in the Properties sheet first with all buildings and units, then the Tenants sheet with all current tenants and their lease details. Upload the completed file using Replace mode. Finally, verify the dashboard shows the correct data and begin recording payments and expenses as normal."),
        bodyText("Historical demo data can be completely removed before going live. The Reset Company Data function ensures all demo records are soft-deleted and cannot appear in reports or searches. For absolute security, the database administrator can also run hard-delete queries to permanently remove soft-deleted records, though this is generally unnecessary since soft-deleted records are excluded from all application queries by default."),

        heading2("2.3 User Permissions & Role Management"),
        bodyText("The platform implements three distinct roles with appropriate permission boundaries. The Owner role has full access to all features including financial data, reports, and settings. The Admin role has the same access as Owner plus the exclusive ability to reset all company data and manage user accounts. The Staff role has limited access: they can view and manage properties, tenants, and maintenance requests, but financial data (revenue, expenses, payment amounts) is hidden and replaced with lock icons."),
        bodyText("This role system is well-designed for real estate companies where office staff should not see sensitive financial information. However, there is a notable gap: the Staff role can still create and view payments (which contain financial amounts), creating a partial bypass of the financial data restriction. This should be reviewed and tightened for commercial deployment, potentially by restricting payment creation to Owner/Admin roles or by masking amounts in the payment interface for Staff users."),

        makeTable(
          ["Feature", "Owner", "Admin", "Staff"],
          [
            ["Dashboard (financial)", "Full access", "Full access", "Hidden (lock icons)"],
            ["Properties", "Full CRUD", "Full CRUD", "Full CRUD"],
            ["Tenants", "Full CRUD", "Full CRUD", "Full CRUD"],
            ["Rent Collection", "Full access", "Full access", "Limited (amounts visible)"],
            ["Maintenance", "Full CRUD", "Full CRUD", "Full CRUD"],
            ["Expenses", "Full CRUD", "Full CRUD", "Hidden"],
            ["Reports & Analytics", "Full access", "Full access", "Hidden"],
            ["Import Data", "Access", "Access", "No access"],
            ["User Management", "No access", "Full access", "No access"],
            ["Reset Company Data", "No access", "Exclusive access", "No access"],
            ["Audit Logs", "Access", "Access", "No access"],
          ]
        ),
        new Paragraph({ spacing: { before: 100, after: 200 }, children: [new TextRun({ text: "Table 4: Role-Based Access Control Matrix", italics: true, size: 18, color: c(P.secondary) })] }),

        heading2("2.4 Deployment Workflow for Clean Transition"),
        bodyText("The recommended deployment workflow for transitioning from testing to production involves the following steps. First, ensure all code changes are committed to the main branch of the GitHub repository, which automatically triggers a Vercel deployment. Second, verify the Vercel environment variables are correctly set: DATABASE_URL pointing to the Neon PostgreSQL database, NEXTAUTH_SECRET set to a cryptographically random string (minimum 32 characters), and CRON_SECRET set for backup job authentication. Third, run the database migration against the production Neon database to ensure all schema changes are applied. Fourth, reset any demo data using the admin dashboard. Fifth, import the client's live data via the XLSX upload feature. Sixth, conduct a user acceptance test with the client to verify all features work correctly with their real data."),
        bodyText("It is critical that the NEXTAUTH_SECRET environment variable is changed from its current placeholder value to a strong, random string before any production deployment. This secret is the cryptographic key that protects all user sessions. If it remains at its default value, any attacker who knows the default can forge session tokens."),

        // ═══════════════════════════════════════════
        // SECTION 3: LONG-TERM MAINTENANCE & SUPPORT
        // ═══════════════════════════════════════════
        heading1("3. Long-Term Maintenance & Support"),

        heading2("3.1 Ongoing Maintenance Requirements"),
        bodyText("The platform requires minimal day-to-day maintenance due to its serverless architecture on Vercel. There are no servers to patch, no operating systems to update, and no capacity planning required for compute resources. The primary maintenance responsibilities fall into four categories: database management, dependency updates, monitoring and alerting, and backup verification."),
        bodyText("Database management involves monitoring Neon storage usage (upgrading the plan if approaching limits), reviewing and archiving old audit logs, and periodically verifying database performance. Dependency updates should be applied monthly, focusing on security patches (tracked via npm audit and GitHub Dependabot). The Prisma ORM and NextAuth v5 packages are actively maintained and receive regular security updates."),
        bodyText("Monitoring and alerting is currently the weakest area. There is no error tracking service integrated (Sentry, Datadog, or similar), meaning production errors are only visible through Vercel's serverless function logs, which are ephemeral and difficult to search. There is no health check endpoint that verifies database connectivity, and there is no alerting when the automated backup cron job fails. These must be addressed before commercial deployment."),

        heading2("3.2 Automatic Backup Schedule"),
        bodyText("An automated daily backup cron job is configured via vercel.json to run at 2:00 AM UTC. However, as detailed in Section 1.3, this cron job currently only records metadata (size, record count, status) without actually persisting the backup data externally. For production use, this must be upgraded to store the actual backup JSON file in cloud object storage (AWS S3, Cloudflare R2, or equivalent)."),
        bodyText("Neon PostgreSQL offers Point-in-Time Recovery (PITR) on its Pro plan, which provides continuous WAL (Write-Ahead Log) archiving and the ability to restore the database to any point in time within the retention window (typically 7-30 days). This is the single most effective disaster recovery measure available and should be enabled as part of the Neon Pro upgrade."),

        heading2("3.3 Software Updates & Security Patches"),
        bodyText("The platform uses a modern dependency tree with active maintenance. Next.js 16, React 19, and Prisma 6 are all current-generation packages with active security support. However, NextAuth v5 is in beta status, which carries inherent risk. While the beta is widely used in production applications, it does not carry the same stability guarantee as a stable release. The upgrade path to the stable release (when available) should be planned."),
        bodyText("Security patches are currently applied manually through npm update and git push, which triggers automatic Vercel redeployment. For commercial operation, automated dependency update workflows (such as GitHub Dependabot with auto-merge for patch-level updates) should be configured to ensure critical security fixes are applied promptly. A monthly review of the npm audit report and Prisma migration status is recommended."),

        heading2("3.4 Hosting Recommendations"),
        bodyText("The current hosting setup (Vercel + Neon) is appropriate for a SaaS platform targeting UAE clients. However, there are two infrastructure improvements that should be considered for production. First, upgrading from Vercel Hobby to Vercel Pro ($20/month per team member) removes the 10-second serverless function timeout, provides 60-second max duration, and enables analytics and firewall features. The 10-second timeout is a real limitation for the backup and import endpoints, which can take longer with large datasets."),
        bodyText("Second, upgrading from Neon Free to Neon Pro ($19/month) provides 10GB storage (vs 500MB), Point-in-Time Recovery, and no cold-start suspension. The cold-start behavior on the free tier means that after 5 minutes of inactivity, the first database query can take 500ms-2 seconds, which creates a noticeable delay for the first user who accesses the platform in the morning. The Pro tier keeps the database always-active."),
        bodyText("For clients in the UAE, the Vercel deployment region should ideally be set to a Middle East or at least European region to minimize latency. Currently, the deployment appears to be in the US East region (iad1), which adds approximately 200ms of round-trip latency for UAE users. Vercel supports edge functions that run closer to the user, but the database queries still route through the primary region."),

        makeTable(
          ["Component", "Current Plan", "Production Plan", "Monthly Cost"],
          [
            ["Vercel Hosting", "Hobby (Free)", "Pro", "$20/user"],
            ["Neon Database", "Free (500MB)", "Pro (10GB + PITR)", "$19"],
            ["Cloud Storage (Backups)", "Not configured", "S3/R2", "$1-5"],
            ["Error Tracking", "None", "Sentry (Team)", "$26"],
            ["Domain (Custom)", ".vercel.app", "Custom domain", "$10-15/year"],
            ["Total Estimated", "$0", "Production-ready", "~$70/month"],
          ]
        ),
        new Paragraph({ spacing: { before: 100, after: 200 }, children: [new TextRun({ text: "Table 5: Infrastructure Cost Comparison", italics: true, size: 18, color: c(P.secondary) })] }),

        heading2("3.5 Limitations & Risks"),
        bodyText("Several limitations and risks should be clearly understood before selling this system commercially. First, the platform has no billing or subscription management system. If you plan to charge clients on a recurring basis, you will need to integrate a payment processor (Stripe, Paddle, or LemonSqueezy) and implement usage metering, invoice generation, and automated account suspension for non-payment."),
        bodyText("Second, there is no email sending infrastructure. The forgot-password feature generates a reset token but returns it in the API response instead of sending it via email. For production, you need an email service (SendGrid, Resend, or AWS SES) integrated with the platform to handle password resets, payment receipts, overdue notifications, and lease renewal reminders."),
        bodyText("Third, the multi-tenancy model has a critical flaw: user emails must be globally unique across all companies. This means two different companies cannot have a user with the same email address, which is a fundamental SaaS limitation. The fix requires either scoping email uniqueness per company (using a composite unique constraint on email + companyId) or using a separate authentication system from the user profile."),
        bodyText("Fourth, there is no automated test suite. No unit tests, integration tests, or end-to-end tests exist. Every code change carries the risk of introducing regressions that will only be caught by manual testing. For a commercial product, a minimum test suite covering the critical paths (authentication, data isolation, payment recording, import/export) should be implemented."),
        bodyText("Fifth, the platform does not comply with GDPR or other data protection regulations. There is no data export functionality for user requests, no right-to-deletion implementation, no cookie consent mechanism, and no data processing agreement template. If any of your clients operate in jurisdictions with data protection laws, this must be addressed."),

        // ═══════════════════════════════════════════
        // SECTION 4: REMEDIATION ROADMAP
        // ═══════════════════════════════════════════
        heading1("4. Remediation Roadmap"),

        heading2("4.1 Priority 1: Must-Fix Before Commercial Sale (Week 1-2)"),
        bodyText("These items represent existential risks that could result in data loss, security breaches, or cross-company data leaks. None of them should take more than 1-2 days each to implement, and all are prerequisites for trusting the platform with real client data."),
        bulletItem("Fix multi-tenancy isolation: Add companyId to Payment model, scope all admin queries by company, change email uniqueness to email+companyId composite"),
        bulletItem("Implement external backup storage: Integrate Cloudflare R2 or AWS S3, upload backup JSON files on each cron run, implement encrypted at-rest storage"),
        bulletItem("Secure authentication secrets: Rotate NEXTAUTH_SECRET to a strong random value, remove .env from git tracking, validate env vars at startup, implement secret rotation documentation"),
        bulletItem("Add CSRF protection: Implement Next.js middleware with CSRF token validation for all mutating API routes"),
        bulletItem("Fix password reset security: Remove token from API response, integrate email service for token delivery, add token expiry and single-use enforcement"),

        heading2("4.2 Priority 2: Should-Fix Before Launch (Week 3)"),
        bodyText("These items are important for operational reliability and customer trust. They are not immediate security threats but represent significant risk if left unaddressed over time."),
        bulletItem("Add database transactions to backup restore: Wrap restore operations in Prisma $transaction() for atomic rollback on failure"),
        bulletItem("Implement global rate limiting middleware: Add Next.js middleware for IP-based and endpoint-specific rate limiting across all API routes"),
        bulletItem("Integrate error tracking: Add Sentry for structured error reporting, performance monitoring, and alerting"),
        bulletItem("Add health check endpoint with DB connectivity: Verify database is reachable before reporting healthy status"),
        bulletItem("Upgrade to Neon Pro: Enable PITR, 10GB storage, and no cold-start suspension"),
        bulletItem("Upgrade to Vercel Pro: Remove 10s serverless timeout, enable analytics and firewall"),

        heading2("4.3 Priority 3: Should-Have for SaaS Maturity (Week 4+)"),
        bodyText("These items represent the difference between a functional product and a professionally managed SaaS. They should be implemented within the first month of commercial operation."),
        bulletItem("Integrate email service (Resend or SendGrid): Enable password reset emails, payment receipts, overdue notices, and lease renewal reminders"),
        bulletItem("Add Zod schema validation to all API routes: Replace ad-hoc if-checks with typed, validated request schemas"),
        bulletItem("Implement automated test suite: Unit tests for auth and data isolation, integration tests for critical API paths, E2E tests for core user flows"),
        bulletItem("Add billing/subscription system: Integrate Stripe for recurring payments, usage metering, and automated account management"),
        bulletItem("Implement GDPR compliance: Data export, right-to-deletion, cookie consent, and data processing agreement"),
        bulletItem("Add database-level constraints: PostgreSQL CHECK constraints for enum fields, composite indexes for common queries"),

        // ═══════════════════════════════════════════
        // SECTION 5: FINAL VERDICT
        // ═══════════════════════════════════════════
        heading1("5. Final Verdict"),

        bodyText("The Real Estate Emperor Property Management Platform has a strong foundation: a modern tech stack, comprehensive feature set, and well-designed user interface. The business logic is sound, the role-based access control is thoughtful, and the data import/export capabilities make client onboarding straightforward. These are significant achievements that should not be understated."),
        bodyText("However, the platform is not yet ready for commercial SaaS sale. The 9 critical gaps identified in this report, particularly around backup and disaster recovery, multi-tenant data isolation, and authentication security, represent risks that no responsible business should accept when entrusting client financial data to a system. The good news is that all of these issues are fixable within an estimated 3-4 weeks of focused engineering work, and none require rethinking the fundamental architecture."),
        bodyText("The recommended path forward is clear: invest 2 weeks in fixing the Priority 1 items (multi-tenancy isolation, external backups, authentication security, CSRF protection, password reset security), then 1 week on Priority 2 items (error tracking, health checks, infrastructure upgrades), and then launch with a plan to address Priority 3 items within the first month of operation. With these fixes in place, the platform will be well-positioned to serve as a reliable, commercially viable property management solution for the UAE market."),

        makeTable(
          ["Timeline", "Milestone", "Status After"],
          [
            ["Week 1-2", "Priority 1 fixes complete", "Commercially viable (with caveats)"],
            ["Week 3", "Priority 2 fixes complete", "Operationally reliable"],
            ["Week 4+", "Priority 3 features added", "SaaS-mature platform"],
          ]
        ),
        new Paragraph({ spacing: { before: 100, after: 200 }, children: [new TextRun({ text: "Table 6: Recommended Implementation Timeline", italics: true, size: 18, color: c(P.secondary) })] }),

        bodyText("The total estimated infrastructure cost for a production-ready deployment is approximately $70 per month (Vercel Pro + Neon Pro + S3 storage + Sentry), which is extremely competitive for a SaaS platform and leaves healthy margin for pricing the service at a profit."),
      ],
    },
  ],
});

// ── Generate ──
const OUTPUT = "/home/z/my-project/download/Production-Readiness-Assessment-Report.docx";
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUTPUT, buf);
  console.log("Generated:", OUTPUT);
  console.log("Size:", (buf.length / 1024).toFixed(1), "KB");
});
