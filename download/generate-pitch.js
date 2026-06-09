const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, PageNumber, Footer, BorderStyle, WidthType,
  ShadingType, PageBreak, SectionType } = require("docx");
const fs = require("fs");

// ── Palette: IG-1 Ink Gold (finance/real estate premium) ──
const P = {
  primary: "1A1A1A",
  body: "2C2C2C",
  secondary: "6B6B6B",
  accent: "C5A028",
  surface: "FAF8F3",
  coverBg: "1A1A1A",
  coverTitle: "FFFFFF",
  coverSub: "C5A028",
  coverMeta: "B0B8C0",
  coverFooter: "687078",
  tableBg: "C5A028",
  tableText: "FFFFFF",
  tableLine: "D6C096",
  tableSurface: "FAF8F3",
};

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ── Helper functions ──
function spacer(twips) {
  return new Paragraph({ spacing: { before: twips }, children: [] });
}

function heading1EN(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, color: P.primary, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })],
  });
}

function heading2EN(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true, size: 28, color: P.primary, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })],
  });
}

function bodyEN(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    ...opts,
    children: [new TextRun({ text, size: 24, color: P.body, font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } })],
  });
}

function bodyBoldEN(label, text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    children: [
      new TextRun({ text: label, bold: true, size: 24, color: P.primary, font: { ascii: "Times New Roman" } }),
      new TextRun({ text, size: 24, color: P.body, font: { ascii: "Times New Roman" } }),
    ],
  });
}

function heading1BN(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, color: P.primary, font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" } })],
  });
}

function heading2BN(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true, size: 28, color: P.primary, font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" } })],
  });
}

function bodyBN(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    ...opts,
    children: [new TextRun({ text, size: 24, color: P.body, font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" } })],
  });
}

function bodyBoldBN(label, text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    children: [
      new TextRun({ text: label, bold: true, size: 24, color: P.primary, font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" } }),
      new TextRun({ text, size: 24, color: P.body, font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" } }),
    ],
  });
}

function accentLine() {
  return new Paragraph({
    indent: { left: 0, right: 0 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
    spacing: { after: 200 },
    children: [],
  });
}

function sectionDivider() {
  return new Paragraph({
    indent: { left: 1500, right: 1500 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: P.tableLine, space: 12 } },
    spacing: { before: 400, after: 400 },
    children: [],
  });
}

// ── Build Cover (R1-style, dark background) ──
function buildCover() {
  const titleLines = ["Property Dashboard", "Proposal"];
  const children = [];

  children.push(spacer(3000));

  // Accent line
  children.push(new Paragraph({
    indent: { left: 800, right: 800 },
    border: { top: { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 20 } },
    children: [],
  }));

  children.push(spacer(400));

  // Title
  for (const line of titleLines) {
    children.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      indent: { left: 800 },
      spacing: { line: 920, lineRule: "atLeast" },
      children: [new TextRun({ text: line, size: 80, bold: true, color: P.coverTitle, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })],
    }));
  }

  children.push(spacer(300));

  // Subtitle
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 800 },
    spacing: { line: 400, lineRule: "atLeast" },
    children: [new TextRun({ text: "Real Estate Emperor Property Management L.L.C.", size: 28, color: P.coverSub, font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" } })],
  }));

  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 800 },
    spacing: { line: 400, after: 60 },
    children: [new TextRun({ text: "\u0627\u0644\u0631\u064A\u0641 \u0627\u0644\u062C\u0646\u0648\u0628\u064A \u0644\u0644\u0639\u0642\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0639\u0627\u0645\u0629 \u0630.\u0645.\u0645", size: 24, color: P.coverMeta, font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" } })],
  }));

  children.push(spacer(1600));

  // Accent line bottom
  children.push(new Paragraph({
    indent: { left: 800, right: 800 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 16 } },
    children: [],
  }));

  children.push(spacer(200));

  // Prepared for
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 800 },
    children: [new TextRun({ text: "Prepared for: ", size: 20, color: P.coverFooter, font: { ascii: "Times New Roman" } }), new TextRun({ text: "Shafiul Azam Alhaj Abdul Sukkur", size: 22, bold: true, color: P.coverTitle, font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" } })],
  }));

  // Date
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 800 },
    spacing: { before: 80 },
    children: [new TextRun({ text: "May 2026", size: 20, color: P.coverFooter, font: { ascii: "Times New Roman" } })],
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        verticalAlign: "top",
        shading: { type: ShadingType.CLEAR, fill: P.coverBg },
        margins: { left: 800, right: 800, top: 0, bottom: 0 },
        borders: allNoBorders,
        children,
      })],
    })],
  });
}

// ── Price Table ──
function buildPriceTableEN() {
  const headerCell = (text) => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: P.tableBg },
    margins: { top: 80, bottom: 80, left: 160, right: 160 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.tableBg },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.tableBg },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
    },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 22, color: P.tableText, font: { ascii: "Times New Roman" } })] })],
  });

  const dataCell = (text, bold = false, fill = "FFFFFF") => new TableCell({
    shading: { type: ShadingType.CLEAR, fill },
    margins: { top: 80, bottom: 80, left: 160, right: 160 },
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
    },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold, size: 22, color: P.body, font: { ascii: "Times New Roman" } })] })],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [headerCell("Item"), headerCell("Standard Rate"), headerCell("Your Rate"), headerCell("Savings")] }),
      new TableRow({ children: [dataCell("One-Time Setup", true, P.tableSurface), dataCell("5,000 AED"), dataCell("3,000 AED", true), dataCell("2,000 AED")] }),
      new TableRow({ children: [dataCell("Monthly Maintenance", true), dataCell("1,500 AED"), dataCell("1,000 AED", true), dataCell("500 AED/mo")] }),
    ],
  });
}

function buildPriceTableBN() {
  const headerCell = (text) => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: P.tableBg },
    margins: { top: 80, bottom: 80, left: 160, right: 160 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.tableBg },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.tableBg },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
    },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 22, color: P.tableText, font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" } })] })],
  });

  const dataCell = (text, bold = false, fill = "FFFFFF") => new TableCell({
    shading: { type: ShadingType.CLEAR, fill },
    margins: { top: 80, bottom: 80, left: 160, right: 160 },
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
    },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold, size: 22, color: P.body, font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" } })] })],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [headerCell("\u0986\u0987\u099F\u09C7\u09AE"), headerCell("\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1\u09BE\u09B0\u09CD\u09A1 \u09B0\u09C7\u099F"), headerCell("\u0986\u09AA\u09A8\u09BE\u09B0 \u09B0\u09C7\u099F"), headerCell("\u09B8\u0981\u09B6\u09CD\u09B0\u09DF")] }),
      new TableRow({ children: [dataCell("\u098F\u0995\u0995\u09BE\u09B2\u09C0\u09A8 \u09B8\u09C7\u099F\u0986\u09AA", true, P.tableSurface), dataCell("5,000 \u09A6\u09BF\u09B0\u09B9\u09BE\u09AE"), dataCell("3,000 \u09A6\u09BF\u09B0\u09B9\u09BE\u09AE", true), dataCell("2,000 \u09A6\u09BF\u09B0\u09B9\u09BE\u09AE")] }),
      new TableRow({ children: [dataCell("\u09AE\u09BE\u09B8\u09BF\u0995 \u09B0\u0995\u09CD\u09B7\u09A3\u09BE\u09AC\u09C7\u0995\u09CD\u09B7\u09A3", true), dataCell("1,500 \u09A6\u09BF\u09B0\u09B9\u09BE\u09AE"), dataCell("1,000 \u09A6\u09BF\u09B0\u09B9\u09BE\u09AE", true), dataCell("500 \u09A6\u09BF\u09B0\u09B9\u09BE\u09AE/\u09AE\u09BE\u09B8")] }),
    ],
  });
}

// ── Build English Section ──
function buildEnglishSection() {
  const content = [];

  content.push(heading1EN("1. The Problem You Live With Every Day"));

  content.push(bodyEN("You manage multiple buildings with dozens of tenants. Every month, you chase rent payments manually, track who paid and who did not in spreadsheets or notebooks, and struggle to remember which contract is expiring. When a tenant is late, you have to call them one by one. When you need to know your profit, you spend hours calculating. If your staff handles the books, you worry about whether financial data is being accessed properly. This is not just inefficient \u2014 it is costing you money, time, and peace of mind."));

  content.push(heading1EN("2. The Solution: Property Dashboard"));

  content.push(bodyEN("A custom-built digital dashboard designed exclusively for Real Estate Emperor. Accessible from any device \u2014 your phone, tablet, or laptop \u2014 it puts your entire property operation in one place. No more notebooks. No more guesswork. Just clarity."));

  content.push(heading2EN("What It Does"));

  content.push(bodyBoldEN("Real-Time Payment Tracking: ", "See instantly who paid, who is late, and who is partial. Color-coded status board \u2014 green for paid, red for overdue. No searching, no guessing."));
  content.push(bodyBoldEN("One-Tap WhatsApp Reminders: ", "A single tap sends a professional, pre-written WhatsApp reminder to any overdue tenant in any language. No more awkward phone calls."));
  content.push(bodyBoldEN("Tenant Scoring System: ", "Every tenant gets a reliability score based on payment history. Know at a glance who your reliable tenants are and who needs attention."));
  content.push(bodyBoldEN("Contract Tracker: ", "Automatic alerts before any lease expires. Never be surprised by a vacancy again."));
  content.push(bodyBoldEN("Profit & Loss Reports: ", "Instant monthly and annual financial reports. Revenue, expenses, net profit \u2014 all calculated automatically."));
  content.push(bodyBoldEN("4 Languages Built In: ", "English, Arabic, Bengali, and Urdu. Your staff and your tenants can use it in their preferred language."));
  content.push(bodyBoldEN("Role-Based Access: ", "The owner and admin see everything including financials. Staff see only what they need \u2014 no financial data exposure."));

  content.push(heading2EN("Technical Excellence"));

  content.push(bodyEN("Built with enterprise-grade technology used by Fortune 500 companies: Next.js framework, cloud-hosted on Vercel\u2019s global network, encrypted data storage, and military-grade security. Accessible 24/7 from any device with an internet connection. No installation needed \u2014 it works in any web browser."));

  content.push(heading1EN("3. Investment"));

  content.push(bodyEN("This is a premium custom system. The standard market rate for a solution of this caliber is 5,000 AED setup plus 1,500 AED monthly. However, as a valued relationship, I am offering you a significant discount:"));

  content.push(spacer(100));
  content.push(buildPriceTableEN());
  content.push(spacer(100));

  content.push(bodyEN("You save 2,000 AED upfront and 500 AED every single month. That is 8,000 AED in savings over the first year alone."));

  content.push(heading2EN("What the Monthly Fee Covers"));

  content.push(bodyBoldEN("Cloud Hosting: ", "Your dashboard stays live 24/7 on a secure global server network."));
  content.push(bodyBoldEN("Technical Maintenance: ", "All updates, security patches, and performance improvements are handled for you."));
  content.push(bodyBoldEN("Feature Updates: ", "When you need a new feature or adjustment, I build it and deploy it \u2014 no extra charge."));
  content.push(bodyBoldEN("Priority Support: ", "Direct access to me whenever you need help or have a question."));

  content.push(heading1EN("4. Freedom Guarantee"));

  content.push(bodyEN("This is not a trap. Either of us can terminate this arrangement at any time, for any reason, with no legal obligation on either side. You are never locked in. If you decide the dashboard is not for you, you walk away \u2014 no penalties, no paperwork, no questions. Likewise, I retain the same freedom. This is built on mutual trust, not legal bindings."));

  content.push(heading1EN("5. Next Step"));

  content.push(bodyEN("The dashboard is already built and live. You can see it, try it, and decide for yourself. I will walk you through it personally. No commitment required to take a look."));

  content.push(spacer(200));
  content.push(accentLine());

  content.push(bodyBoldEN("Contact: ", "Ahmed Ali"));
  content.push(bodyBoldEN("Dashboard: ", "https://real-estate-emperor.vercel.app"));
  content.push(bodyBoldEN("Login: ", "demoO@realestate.ae / owner123"));

  return content;
}

// ── Build Bengali Section ──
function buildBengaliSection() {
  const content = [];

  content.push(heading1BN("\u09E7. \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8\u09C7\u09B0 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE"));

  content.push(bodyBN("\u0986\u09AA\u09A8\u09BF \u098F\u0995\u09BE\u09A7\u09BF\u0995 \u09AD\u09AC\u09A8 \u09AA\u09B0\u09BF\u099A\u09BE\u09B2\u09A8\u09BE \u0995\u09B0\u099B\u09C7\u09A8 \u09AF\u09C7\u0996\u09BE\u09A8\u09C7 \u09A6\u09B0\u099C\u09A8 \u09AD\u09BE\u09A1\u09BC\u09BE\u099F\u09BF\u09AF\u09BC\u09BE \u0986\u099B\u09C7\u0964 \u09AA\u09CD\u09B0\u09A4\u09BF\u09AE\u09BE\u09B8\u09C7 \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u09AD\u09BE\u09A1\u09BC\u09BE \u0986\u09A6\u09BE\u09AF\u09BC\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u0998\u09C1\u09B0\u09C7 \u09AC\u09C7\u09A1\u09BC\u09A4\u09C7 \u09B9\u09AF\u09BC, \u09B8\u09CD\u09AA\u09CD\u09B0\u09C7\u09A1\u09B6\u09C0\u099F \u09AC\u09BE \u0996\u09BE\u09A4\u09BE\u09AF\u09BC \u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995 \u0995\u09B0\u09A4\u09C7 \u09B9\u09AF\u09BC \u0995\u09C7 \u0995\u0996\u09A8 \u0995\u0996\u09A8 \u099A\u09C1\u0995\u09CD\u09A4\u09BF \u09B6\u09C7\u09B7 \u09B9\u099A\u09CD\u099B\u09C7\u0964 \u09AF\u0996\u09A8 \u0995\u09CB\u09A8 \u09AD\u09BE\u09A1\u09BC\u09BE\u099F\u09BF\u09AF\u09BC\u09BE \u09A6\u09C7\u09B0\u09BF\u09A4\u09C7 \u09A5\u09BE\u0995\u09C7, \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u098F\u0995\u098F\u0995 \u0995\u09B0\u09C7 \u0995\u09B2 \u0995\u09B0\u09A4\u09C7 \u09B9\u09AF\u09BC\u0964 \u09AF\u0996\u09A8 \u0986\u09AA\u09A8\u09BE\u09B0 \u09AE\u09C1\u09A8\u09BE\u09AB\u09BE \u099C\u09BE\u09A8\u09A4\u09C7 \u09B9\u09AF\u09BC, \u0998\u09A8\u09CD\u099F\u09BE \u09B8\u09AE\u09AF\u09BC \u09AC\u09CD\u09AF\u09AF\u09BC \u0995\u09B0\u09A4\u09C7 \u09B9\u09AF\u09BC\u0964 \u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09B0\u09CD\u09AE\u09C0\u09B0\u09BE \u09AF\u09A6\u09BF \u0986\u09B0\u09CD\u09A5\u09BF\u0995 \u09A4\u09A5\u09CD\u09AF \u09A6\u09C7\u0996\u09C7, \u0986\u09AA\u09A8\u09BF \u099A\u09BF\u09A8\u09CD\u09A4\u09BE \u09B9\u09A8 \u09AF\u09C7 \u0986\u09B0\u09CD\u09A5\u09BF\u0995 \u09A4\u09A5\u09CD\u09AF \u09B8\u09A0\u09BF\u0995\u09AD\u09BE\u09AC\u09C7 \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u09B8\u09C7\u09B8 \u09B9\u099A\u09CD\u099B\u09C7 \u0995\u09BF\u09A8\u09BE\u0964 \u098F\u099F\u09BF \u09B6\u09C1\u09A7\u09C1 \u0985\u0995\u09BE\u09B0\u09CD\u09AF\u0995\u09B0 \u09A8\u09DF \u2014 \u098F\u099F\u09BF \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u099F\u09BE\u0995\u09BE, \u09B8\u09AE\u09AF\u09BC \u098F\u09AC\u0982 \u09AE\u09BE\u09A8\u09B8\u09BF\u0995 \u09B6\u09BE\u09A8\u09CD\u09A4\u09BF \u0995\u09B0\u099B\u09C7\u0964"));

  content.push(heading1BN("\u09E8. \u09B8\u09AE\u09BE\u09A7\u09BE\u09A8: \u09AA\u09CD\u09B0\u09AA\u09BE\u09B0\u09CD\u099F\u09BF \u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1"));

  content.push(bodyBN("\u0986\u09B2 \u09B0\u09BF\u09AB \u0986\u09B2 \u099C\u09C1\u09A8\u09C1\u09AC\u09C0\u09B0 \u099C\u09A8\u09CD\u09AF \u098F\u0995\u099F\u09BF \u0995\u09BE\u09B8\u09CD\u099F\u09AE-\u09AC\u09BF\u09B2\u09CD\u099F \u09A1\u09BF\u099C\u09BF\u099F\u09BE\u09B2 \u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1\u0964 \u09AB\u09CB\u09A8, \u099F\u09CD\u09AF\u09BE\u09AC\u09B2\u09C7\u099F \u09AC\u09BE \u09B2\u09CD\u09AF\u09BE\u09AA\u099F\u09AA \u2014 \u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u09A1\u09BF\u09AD\u09BE\u0987\u09B8 \u09A5\u09C7\u0995\u09C7 \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u09B8\u09C7\u09B8\u09BF\u09AC\u09B2, \u098F\u099F\u09BF \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09C1\u09B0\u09CB \u09B8\u09AE\u09CD\u09AA\u09A4\u09CD\u09A4\u09BF \u09AA\u09B0\u09BF\u099A\u09BE\u09B2\u09A8\u09BE \u098F\u0995\u099C\u09BE\u09AF\u09BC\u0997\u09BE\u09AF\u09BC \u09B0\u09BE\u0996\u09C7\u0964 \u0986\u09B0 \u0995\u09CB\u09A8 \u09A8\u09CB\u099F\u09AC\u09C1\u0995 \u09A8\u09C7\u0987, \u0986\u09B0 \u0995\u09CB\u09A8 \u0985\u09A8\u09C1\u09AE\u09BE\u09A8 \u09A8\u09C7\u0987\u0964 \u09B6\u09C1\u09A7\u09C1 \u09B8\u09CD\u09AA\u09B7\u09CD\u099F\u09A4\u09BE\u0964"));

  content.push(heading2BN("\u098F\u099F\u09BF \u0995\u09C0 \u0995\u09B0\u09C7"));

  content.push(bodyBoldBN("\u09B0\u09BF\u09AF\u09BC\u09C7\u09B2-\u099F\u09BE\u0987\u09AE \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09BF\u0982: ", "\u09B8\u09BE\u09A5\u09C7\u09B8\u09BE\u09A5\u09C7 \u09A6\u09C7\u0996\u09C1\u09A8 \u0995\u09C7 \u09A6\u09BF\u09AF\u09BC\u09C7\u099B\u09C7, \u0995\u09C7 \u09A6\u09C7\u09B0\u09BF \u0986\u099B\u09C7, \u0995\u09C7 \u0986\u0982\u09B6\u09BF\u0995 \u09A6\u09BF\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u09B0\u0999-\u0995\u09CB\u09A1\u09C7\u09A1 \u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u099F\u09BE\u09B8 \u09AC\u09CB\u09B0\u09CD\u09A1 \u2014 \u09AA\u09C7\u09B2\u09BE\u09AF\u09BC \u09B8\u09AC\u09C1\u099C, \u09B2\u09BE\u09B2 \u09AC\u0995\u09C7\u09AF\u09BC\u09BE\u0964"));
  content.push(bodyBoldBN("\u098F\u0995-\u099F\u09CD\u09AF\u09BE\u09AA \u09B9\u09BE\u0993\u09AF\u09BC\u09BE\u0987\u099F\u0985\u09CD\u09AF\u09BE\u09AA \u09B0\u09BF\u09AE\u09BE\u0987\u09A8\u09CD\u09A1\u09BE\u09B0: ", "\u098F\u0995\u099F\u09BF \u099F\u09CD\u09AF\u09BE\u09AA\u09C7 \u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u09AD\u09BE\u09A1\u09BC\u09BE\u099F\u09BF\u09AF\u09BC\u09BE\u0995\u09C7 \u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u09AD\u09BE\u09B7\u09BE\u09AF\u09BC \u09AA\u09C7\u09B6\u09C7\u09A8\u09BE\u09B2, \u09AA\u09C7\u09B6\u09C7\u09A8\u09BE\u09B2\u09C7\u0996\u09BE \u09B9\u09BE\u0993\u09AF\u09BC\u09BE\u0987\u099F\u0985\u09CD\u09AF\u09BE\u09AA \u09B0\u09BF\u09AE\u09BE\u0987\u09A8\u09CD\u09A1\u09BE\u09B0 \u09AA\u09BE\u09A0\u09BE\u09AF\u09BC\u0964 \u0986\u09B0 \u0995\u09CB\u09A8 \u0985\u09B8\u09C1\u09AC\u09BF\u09A7\u09BE \u0995\u09B2 \u09A8\u09C7\u0987\u0964"));
  content.push(bodyBoldBN("\u09AD\u09BE\u09A1\u09BC\u09BE\u099F\u09BF\u09AF\u09BC\u09BE \u09B8\u09CD\u0995\u09CB\u09B0\u09BF\u0982 \u09B8\u09BF\u09B8\u09CD\u099F\u09C7\u09AE: ", "\u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09AD\u09BE\u09A1\u09BC\u09BE\u099F\u09BF\u09AF\u09BC\u09BE \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u0987\u09A4\u09BF\u09B9\u09BE\u09B8 \u0989\u09AA\u09B0 \u09AD\u09BF\u09A4\u09CD\u09A4\u09BF \u098F\u0995\u099F\u09BF \u09A8\u09BF\u09B0\u09CD\u09AD\u09B0\u09A4\u09BE \u09B8\u09CD\u0995\u09CB\u09B0 \u09AA\u09BE\u09AF\u09BC\u0964 \u098F\u0995 \u09A8\u099C\u09B0\u09C7 \u099C\u09BE\u09A8\u09C1\u09A8 \u0995\u09C7 \u09A8\u09BF\u09B0\u09CD\u09AD\u09B0\u09B6\u09C0\u09B2 \u098F\u09AC\u0982 \u0995\u09C7 \u09AF\u09A4\u09CD\u09A8 \u09A6\u09C7\u0996\u09BE \u09A6\u09B0\u0995\u09BE\u09B0\u0964"));
  content.push(bodyBoldBN("\u099A\u09C1\u0995\u09CD\u09A4\u09BF \u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09BE\u09B0: ", "\u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u09B2\u09BF\u099C \u09AE\u09C7\u09AF\u09BC\u09BE\u09A6 \u09B6\u09C7\u09B7\u09C7\u09B0 \u0986\u0997\u09C7 \u09B8\u09CD\u09AC\u09AF\u09BC\u0982\u0995\u09CD\u09B0\u09BF\u09AF\u09BC \u09B8\u09A4\u09B0\u09CD\u0995\u09BE\u09AC\u09A8\u09C0\u0964 \u0986\u09AC\u09BE\u09B0 \u0995\u0996\u09A8\u09CB \u0996\u09BE\u09B2\u09BF \u0987\u0989\u09A8\u09BF\u099F\u09C7 \u0985\u09AC\u09BE\u0995 \u09B9\u09AC\u09C7\u09A8 \u09A8\u09BE\u0964"));
  content.push(bodyBoldBN("\u09B2\u09BE\u09AD-\u0995\u09CD\u09B7\u09A4\u09BF \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F: ", "\u09A4\u09BE\u0995\u09BF\u0998\u09A8\u09CD\u099F\u09BE \u09AE\u09BE\u09B8\u09BF\u0995 \u098F\u09AC\u0982 \u09AC\u09BE\u09B0\u09CD\u09B7\u09BF\u0995 \u0986\u09B0\u09CD\u09A5\u09BF\u0995 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F\u0964 \u09B0\u09C7\u09AD\u09BF\u09A8\u09BF\u0989, \u0996\u09B0\u099A, \u09A8\u09BF\u099F \u09AE\u09C1\u09A8\u09BE\u09AB\u09BE \u2014 \u09B8\u09AC \u09B8\u09CD\u09AC\u09AF\u09BC\u0982\u0995\u09CD\u09B0\u09BF\u09AF\u09BC \u0997\u09A3\u09A8\u09BE \u0995\u09B0\u09BE\u0964"));
  content.push(bodyBoldBN("\u09E8 \u099F\u09BF \u09AD\u09BE\u09B7\u09BE \u0985\u09A8\u09CD\u09A4\u09B0\u09CD\u09AD\u09C1\u0995\u09CD\u09A4: ", "\u0987\u0982\u09B0\u09C7\u099C\u09BF, \u0986\u09B0\u09AC\u09BF, \u09AC\u09BE\u0982\u09B2\u09BE \u098F\u09AC\u0982 \u0989\u09B0\u09CD\u09A6\u09C1\u0964 \u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09B0\u09CD\u09AE\u09C0 \u098F\u09AC\u0982 \u09AD\u09BE\u09A1\u09BC\u09BE\u099F\u09BF\u09AF\u09BC\u09BE\u09B0\u09BE \u09A4\u09BE\u09A6\u09C7\u09B0 \u09AA\u099B\u09A8\u09CD\u09A6\u09C7\u09B0 \u09AD\u09BE\u09B7\u09BE\u09AF\u09BC \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u0964"));
  content.push(bodyBoldBN("\u09AD\u09C2\u09AE\u09BF\u0995\u09BE-\u09AD\u09BF\u09A4\u09CD\u09A4\u09BF\u0995 \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u09B8\u09C7\u09B8: ", "\u09AE\u09BE\u09B2\u09BF\u0995 \u098F\u09AC\u0982 \u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u09B8\u09AC \u0995\u09BF\u099B\u09C1 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8 \u0986\u09B0\u09CD\u09A5\u09BF\u0995 \u09A4\u09A5\u09CD\u09AF\u0993 \u09B8\u09B9\u0964 \u0995\u09B0\u09CD\u09AE\u09C0 \u09B6\u09C1\u09A7\u09C1 \u09AF\u09BE \u09A4\u09BE\u09B0\u09BE \u09A6\u09B0\u0995\u09BE\u09B0 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7 \u2014 \u0995\u09CB\u09A8 \u0986\u09B0\u09CD\u09A5\u09BF\u0995 \u09A4\u09A5\u09CD\u09AF \u09AA\u09CD\u09B0\u0995\u09BE\u09B6 \u09A8\u09C7\u0987\u0964"));

  content.push(heading1BN("\u09E9. \u09AC\u09BF\u09A8\u09BF\u09AF\u09CB\u0997"));

  content.push(bodyBN("\u098F\u099F\u09BF \u098F\u0995\u099F\u09BF \u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09AF\u09BC\u09BE\u09AE \u0995\u09BE\u09B8\u09CD\u099F\u09AE \u09B8\u09BF\u09B8\u09CD\u099F\u09C7\u09AE\u0964 \u098F\u0987 \u09AE\u09BE\u09A8\u09C7\u09B0 \u09B8\u09AE\u09BE\u09A7\u09BE\u09A8\u09C7\u09B0 \u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1\u09BE\u09B0\u09CD\u09A1 \u09AE\u09BE\u09B0\u09CD\u0995\u09C7\u099F \u09B0\u09C7\u099F 5,000 \u09A6\u09BF\u09B0\u09B9\u09BE\u09AE \u09B8\u09C7\u099F\u0986\u09AA \u09AA\u09CD\u09B2\u09BE\u09B8 1,500 \u09A6\u09BF\u09B0\u09B9\u09BE\u09AE \u09AE\u09BE\u09B8\u09BF\u0995\u0964 \u09A4\u09AC\u09C7, \u098F\u0995\u099F\u09BF \u09AE\u09C2\u09B2\u09CD\u09AF\u09AC\u09BE\u09A8 \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7, \u0986\u09AE\u09BF \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u098F\u0995\u099F\u09BF \u0989\u09B2\u09CD\u09B2\u09C7\u0996\u09CD\u09AF \u099B\u09BE\u09A1\u09BC \u09A6\u09BF\u099A\u09CD\u099B\u09BF:"));

  content.push(spacer(100));
  content.push(buildPriceTableBN());
  content.push(spacer(100));

  content.push(bodyBN("\u0986\u09AA\u09A8\u09BF \u09B8\u0981\u0987\u09AC\u09BE\u09B0\u09C7 2,000 \u09A6\u09BF\u09B0\u09B9\u09BE\u09AE \u098F\u09AC\u0982 \u09AA\u09CD\u09B0\u09A4\u09BF\u09AE\u09BE\u09B8\u09C7 500 \u09A6\u09BF\u09B0\u09B9\u09BE\u09AE \u09B8\u0981\u099A\u09AF\u09BC \u0995\u09B0\u099B\u09C7\u09A8\u0964 \u09AA\u09CD\u09B0\u09A5\u09AE \u09AC\u099B\u09B0\u09C7 \u09AE\u09CB\u099F 8,000 \u09A6\u09BF\u09B0\u09B9\u09BE\u09AE \u09B8\u0981\u099A\u09AF\u09BC\u0964"));

  content.push(heading2BN("\u09AE\u09BE\u09B8\u09BF\u0995 \u09AB\u09BF \u0995\u09C0 \u0995\u09AD\u09BE\u09B0 \u0995\u09B0\u09C7"));

  content.push(bodyBoldBN("\u0995\u09CD\u09B2\u09BE\u0989\u09A1 \u09B9\u09CB\u09B8\u09CD\u099F\u09BF\u0982: ", "\u0986\u09AA\u09A8\u09BE\u09B0 \u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1 24/7 \u098F\u0995\u099F\u09BF \u09B8\u09C1\u09B0\u0995\u09CD\u09B7\u09BF\u09A4 \u0997\u09CD\u09B2\u09CB\u09AC\u09BE\u09B2 \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u09A8\u09C7\u099F\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u0995\u09C7 \u09B2\u09BE\u0987\u09AD \u09A5\u09BE\u0995\u09C7\u0964"));
  content.push(bodyBoldBN("\u09AA\u09CD\u09B0\u09AF\u09C1\u0995\u09CD\u09A4\u09BF\u0997\u09A4 \u09B0\u0995\u09CD\u09B7\u09A3\u09BE\u09AC\u09C7\u0995\u09CD\u09B7\u09A3: ", "\u09B8\u0995\u09B2 \u0986\u09AA\u09A1\u09C7\u099F, \u09B8\u09BF\u0995\u09BF\u0989\u09B0\u09BF\u099F\u09BF \u09AA\u09CD\u09AF\u09BE\u099A \u098F\u09AC\u0982 \u09AA\u09BE\u09B0\u09AB\u09B0\u09AE\u09CD\u09AF\u09BE\u09A8\u09CD\u09B8 \u0989\u09A8\u09CD\u09A8\u09AF\u09BC\u09A8 \u0986\u09AA\u09A8\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u09AA\u09B0\u09BF\u099A\u09BE\u09B2\u09BF\u09A4\u0964"));
  content.push(bodyBoldBN("\u09AB\u09BF\u099A\u09BE\u09B0 \u0986\u09AA\u09A1\u09C7\u099F: ", "\u09AF\u0996\u09A8 \u0986\u09AA\u09A8\u09BE\u09B0 \u09A8\u09A4\u09C1\u09A8 \u09AB\u09BF\u099A\u09BE\u09B0 \u09AC\u09BE \u09B8\u09AE\u09BE\u09AF\u09CB\u099C\u09A8 \u09A6\u09B0\u0995\u09BE\u09B0, \u0986\u09AE\u09BF \u09A4\u09BE \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BF \u09A1\u09BF\u09AA\u09CD\u09B2\u09AF\u09BC \u0995\u09B0\u09BF \u2014 \u0995\u09CB\u09A8 \u0985\u09A4\u09BF\u09B0\u09BF\u0995\u09CD\u09A4 \u099A\u09BE\u09B0\u09CD\u099C \u09A8\u09C7\u0987\u0964"));
  content.push(bodyBoldBN("\u0985\u0997\u09CD\u09B0\u09BE\u09A7\u09BF\u0995\u09BE\u09B0 \u09B8\u09BE\u09AA\u09CB\u09B0\u09CD\u099F: ", "\u09AF\u0996\u09A8\u0987 \u09B8\u09B9\u09BE\u09AF\u09BC\u0995\u09BE \u09AC\u09BE \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8 \u09A5\u09BE\u0995\u09C7 \u0986\u09AE\u09BE\u09B0 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u09B8\u09C7\u09B8\u0964"));

  content.push(heading1BN("\u09EA. \u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8\u09A4\u09BE \u0997\u09CD\u09AF\u09BE\u09B0\u09BE\u09A8\u09CD\u099F\u09BF"));

  content.push(bodyBN("\u098F\u099F\u09BF \u0995\u09CB\u09A8 \u09AB\u09BE\u0981\u09A6 \u09A8\u09AF\u09BC\u0964 \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u098F\u0995\u099C\u09A8\u09C7 \u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u09B8\u09AE\u09AF\u09BC\u09C7 \u098F\u0987 \u09AC\u09CD\u09AF\u09AC\u09B8\u09CD\u09A5\u09BE \u09AC\u09BE\u09A4\u09BF\u09B2 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8, \u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u0995\u09BE\u09B0\u09A3\u09C7, \u0995\u09CB\u09A8 \u09AA\u0995\u09CD\u09B7\u09C7\u09B0 \u0995\u09CB\u09A8 \u0986\u0987\u09A8\u0997\u09A4 \u09AC\u09BE\u09A7\u09CD\u09AF\u09A4\u09BE \u099B\u09BE\u09A1\u09BC\u09BE\u0987\u0964 \u0986\u09AA\u09A8\u09BF \u0995\u0996\u09A8\u09CB\u0987 \u0986\u09AC\u09A6\u09CD\u09A7 \u09A8\u09A8\u0964 \u09AF\u09A6\u09BF \u0986\u09AA\u09A8\u09BF \u09B8\u09BF\u09A6\u09CD\u09A7\u09BE\u09A8\u09CD\u09A4 \u0995\u09B0\u09C7\u09A8 \u09AF\u09C7 \u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1 \u0986\u09AA\u09A8\u09BE\u09B0 \u09A8\u09AF\u09BC, \u0986\u09AA\u09A8\u09BF \u099A\u09B2\u09C7 \u09AF\u09BE\u09A8 \u2014 \u0995\u09CB\u09A8 \u099C\u09B0\u09BF\u09AE\u09BE\u09A8\u09BE \u09A8\u09C7\u0987, \u0995\u09CB\u09A8 \u0995\u09BE\u0997\u099C\u09AA\u09A4\u09CD\u09B0 \u09A8\u09C7\u0987, \u0995\u09CB\u09A8 \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8 \u09A8\u09C7\u0987\u0964 \u098F\u0987\u09AD\u09BE\u09AC\u09C7, \u0986\u09AE\u09BF\u0993 \u098F\u0995\u0987 \u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8\u09A4\u09BE \u09AA\u09C7\u09B2\u09C7 \u09A5\u09BE\u0995\u09BF\u0964 \u098F\u099F\u09BF \u09AA\u09B0\u09B8\u09CD\u09AA\u09B0 \u09AC\u09BF\u09B6\u09CD\u09AC\u09BE\u09B8\u09C7\u09B0 \u0989\u09AA\u09B0 \u09A6\u09BE\u0981\u09A1\u09BC\u09BF\u09AF\u09BC\u09C7 \u09A4\u09C8\u09B0\u09BF, \u0986\u0987\u09A8\u0997\u09A4 \u09AC\u09A8\u09CD\u09A7\u09A8\u09BE\u09AF\u09BC \u09A8\u09AF\u09BC\u0964"));

  content.push(heading1BN("\u09EB. \u09AA\u09B0\u09AC\u09B0\u09CD\u09A4\u09C0 \u09AA\u09A6\u0995\u09CD\u09B7\u09C7\u09AA"));

  content.push(bodyBN("\u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1 \u0987\u09A4\u09BF\u09AE\u09CD\u09AC\u09C7 \u09A4\u09C8\u09B0\u09BF \u098F\u09AC\u0982 \u09B2\u09BE\u0987\u09AD\u0964 \u0986\u09AA\u09A8\u09BF \u098F\u099F\u09BF \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8, \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8, \u098F\u09AC\u0982 \u09A8\u09BF\u099C\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09B8\u09BF\u09A6\u09CD\u09A7\u09BE\u09A8\u09CD\u09A4 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8\u0964 \u0986\u09AE\u09BF \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u0997\u09A4\u09AD\u09BE\u09AC\u09C7 \u09A6\u09C7\u0996\u09BE\u09AC\u0964 \u09A6\u09C7\u0996\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u0995\u09CB\u09A8 \u09AA\u09CD\u09B0\u09A4\u09BF\u0999\u09CD\u0997\u09BF\u09A4 \u09B2\u09BE\u0997\u09C7 \u09A8\u09BE\u0964"));

  content.push(spacer(200));
  content.push(accentLine());

  content.push(bodyBoldBN("\u09AF\u09CB\u0997\u09BE\u09AF\u09CB\u0997: ", "\u0986\u09B9\u09AE\u09C7\u09A6 \u0986\u09B2\u09C0"));
  content.push(bodyBoldBN("\u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1: ", "https://real-estate-emperor.vercel.app"));
  content.push(bodyBoldBN("\u09B2\u0985\u0997\u0987\u09A8: ", "demoO@realestate.ae / owner123"));

  return content;
}

// ── Assemble Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" }, size: 24, color: P.body },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // Section 1: Cover
    {
      properties: {
        page: { margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: [buildCover()],
    },
    // Section 2: English
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: "decimal" },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Real Estate Emperor Property Management L.L.C.  |  Page ", size: 16, color: P.secondary, font: { ascii: "Times New Roman" } }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: P.secondary }),
            ],
          })],
        }),
      },
      children: [
        ...buildEnglishSection(),
        // Page break before Bengali
        new Paragraph({ children: [new PageBreak()] }),
        // Bengali section starts
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: P.accent, space: 12 } },
          children: [new TextRun({ text: "\u09AC\u09BE\u0982\u09B2\u09BE \u09B8\u0982\u09B8\u09CD\u0995\u09B0\u09A3", size: 36, bold: true, color: P.primary, font: { ascii: "Times New Roman", eastAsia: "Noto Sans SC" } })],
        }),
        ...buildBengaliSection(),
      ],
    },
  ],
});

// ── Generate ──
const outPath = "/home/z/my-project/download/Real_Estate_Emperor_Pitch_Proposal.docx";
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log("Generated:", outPath);
});
