const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType, TabStopType,
} = require("docx");
const fs = require("fs");

// ── Custom Female Professional Color Palette ──
// Sophisticated dusty rose/plum palette — feminine yet corporate
const C = {
  side: "5B4A5A",     // sidebar background (dusty plum)
  text: "FFFFFF",     // sidebar text (white)
  label: "C8B0C4",   // sidebar secondary text (soft lavender)
  accent: "9B6B8A",   // accent color (muted mauve)
  dot: "B8828A",      // skill dot fill color (dusty rose)
  dotDim: "D4C0C4",   // skill dot empty color
  title: "3A2A3A",    // body heading (dark plum)
  body: "3D3040",     // body content
  sec: "7A6A78",      // secondary info
};

// ── No-border constants ──
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB,
                       insideHorizontal: NB, insideVertical: NB };

// ── Helper: Sidebar paragraph ──
function sidePara(runs, opts = {}) {
  return new Paragraph({
    spacing: { before: opts.before || 0, after: opts.after || 40, line: 276 },
    alignment: opts.align || AlignmentType.LEFT,
    children: runs,
  });
}

// ── Helper: Sidebar section label ──
function sideLabel(text) {
  return sidePara([
    new TextRun({ text: text.toUpperCase(), size: 18, bold: true, color: C.label, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, characterSpacing: 60 }),
  ], { before: 180, after: 60 });
}

// ── Helper: Sidebar divider line ──
function sideDivider() {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: C.label, space: 4 } },
    children: [],
  });
}

// ── Helper: Skill with dots ──
function skillDots(name, level) {
  const filled = "●".repeat(level);
  const empty = "○".repeat(5 - level);
  return sidePara([
    new TextRun({ text: name + "  ", size: 17, color: C.text, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    new TextRun({ text: filled, size: 13, color: C.dot, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    new TextRun({ text: empty, size: 13, color: C.dotDim, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
  ], { before: 20, after: 20 });
}

// ── Helper: Right-side section heading (left-border style, Template C) ──
function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100, line: 276 },
    borders: { left: { style: BorderStyle.SINGLE, size: 8, color: C.accent, space: 8 } },
    indent: { left: 120 },
    children: [
      new TextRun({ text: text.toUpperCase(), size: 22, bold: true, color: C.title, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, characterSpacing: 40 }),
    ],
  });
}

// ── Helper: Experience entry ──
function experienceEntry(company, role, dateRange, bullets) {
  const children = [
    // Company name (bold)
    new Paragraph({
      spacing: { before: 120, after: 20, line: 276 },
      children: [
        new TextRun({ text: company, size: 21, bold: true, color: C.title, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      ],
    }),
    // Role + Date
    new Paragraph({
      spacing: { before: 0, after: 40, line: 276 },
      tabStops: [{ type: TabStopType.RIGHT, position: 7600 }],
      children: [
        new TextRun({ text: role, size: 19, color: C.accent, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, italics: true }),
        new TextRun({ text: "\t" + dateRange, size: 17, color: C.sec, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      ],
    }),
  ];
  // Bullet points
  for (const b of bullets) {
    children.push(new Paragraph({
      spacing: { before: 10, after: 10, line: 260 },
      indent: { left: 240 },
      children: [
        new TextRun({ text: "\u25B8 ", size: 15, color: C.accent, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
        new TextRun({ text: b, size: 18, color: C.body, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      ],
    }));
  }
  return children;
}

// ── Build sidebar content ──
function buildSidebar() {
  const items = [];

  // Photo placeholder (circle)
  items.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 300, after: 100, line: 276 },
    children: [new TextRun({ text: "\u25CB", size: 80, color: C.label, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  }));

  // Name
  items.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 40, line: 340 },
    children: [new TextRun({ text: "NADA", size: 44, bold: true, color: C.text, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  }));
  items.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 20, line: 300 },
    children: [new TextRun({ text: "EL SHERBINEY", size: 32, bold: true, color: C.text, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  }));

  // Title
  items.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 20, after: 60, line: 276 },
    children: [new TextRun({ text: "Hospitality & Tourism Professional", size: 16, color: C.label, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, italics: true })],
  }));

  // Divider
  items.push(sideDivider());

  // Contact
  items.push(sideLabel("Contact"));
  items.push(sidePara([
    new TextRun({ text: "+20 12 0626 1004", size: 17, color: C.text, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
  ], { before: 20, after: 20 }));
  items.push(sidePara([
    new TextRun({ text: "Egypt", size: 17, color: C.text, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
  ], { before: 20, after: 20 }));
  items.push(sidePara([
    new TextRun({ text: "\u3010Please fill in: email\u3011", size: 16, color: C.label, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
  ], { before: 20, after: 20 }));

  // Divider
  items.push(sideDivider());

  // Skills
  items.push(sideLabel("Core Skills"));
  items.push(skillDots("Inventory Management", 4));
  items.push(skillDots("Social Media", 4));
  items.push(skillDots("Customer Relations", 4));
  items.push(skillDots("Sales Operations", 4));
  items.push(skillDots("Trend Analysis", 3));
  items.push(skillDots("Hospitality Ops", 3));

  // Divider
  items.push(sideDivider());

  // Languages
  items.push(sideLabel("Languages"));
  items.push(sidePara([
    new TextRun({ text: "Arabic  ", size: 17, color: C.text, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    new TextRun({ text: "\u25CF\u25CF\u25CF\u25CF\u25CF", size: 13, color: C.dot, font: { ascii: "Calibri" } }),
    new TextRun({ text: "  Native", size: 15, color: C.label, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, italics: true }),
  ], { before: 20, after: 20 }));
  items.push(sidePara([
    new TextRun({ text: "English ", size: 17, color: C.text, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    new TextRun({ text: "\u25CF\u25CF\u25CF\u25CF\u25CB", size: 13, color: C.dot, font: { ascii: "Calibri" } }),
    new TextRun({ text: "  Professional", size: 15, color: C.label, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, italics: true }),
  ], { before: 20, after: 20 }));

  // Divider
  items.push(sideDivider());

  // Certifications
  items.push(sideLabel("Certifications"));
  items.push(sidePara([
    new TextRun({ text: "Tourism Training Certificate", size: 16, color: C.text, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
  ], { before: 20, after: 10 }));
  items.push(sidePara([
    new TextRun({ text: "My Travel", size: 15, color: C.label, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, italics: true }),
  ], { before: 0, after: 20 }));

  return items;
}

// ── Build right-side body content ──
function buildBody() {
  const items = [];

  // Profile Summary
  items.push(sectionHeading("Profile Summary"));
  items.push(new Paragraph({
    spacing: { before: 60, after: 80, line: 276 },
    indent: { left: 120 },
    children: [
      new TextRun({ text: "Results-driven hospitality and tourism student with over two years of combined experience in retail sales, social media management, and customer engagement. Proven ability to analyze inventory trends, optimize stock levels, and build responsive online communities across TikTok and Instagram platforms. Adept at translating consumer insights into actionable strategies that drive sales performance and customer satisfaction. Seeking to leverage cross-functional expertise in a dynamic corporate hospitality or tourism environment.", size: 18, color: C.body, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  }));

  // Work Experience
  items.push(sectionHeading("Work Experience"));

  // Experience 1: She-M
  const sheMBullets = [
    "Managed official TikTok and Instagram accounts, delivering timely responses to comments and direct messages to sustain an active, engaged brand community",
    "Processed end-to-end customer orders including pricing confirmation, availability verification, and appointment scheduling, ensuring a seamless purchasing experience",
    "Monitored social media engagement metrics and audience behaviour patterns to inform content scheduling and optimise platform reach",
    "Communicated product pricing, availability, and order status across digital channels, maintaining professional and consistent brand representation",
  ];
  items.push(...experienceEntry("She-M", "Sales & Social Media Moderator", "Jan 2025 \u2013 May 2026", sheMBullets));

  // Experience 2: Seniors Cosmetics Store
  const seniorsBullets = [
    "Conducted weekly inventory reviews analysing stock levels and consumption patterns to optimise procurement decisions and reduce low-demand overstock",
    "Tracked makeup and accessories market trends to align product offerings with evolving consumer preferences and maintain competitive positioning",
    "Delivered personalised customer consultations in a fast-paced retail setting, building lasting client relationships and driving repeat business",
  ];
  items.push(...experienceEntry("Seniors Cosmetics Store", "Sales Associate", "Jul 2023 \u2013 Dec 2024", seniorsBullets));

  // Experience 3: My Travel
  const travelBullets = [
    "Completed an intensive foundational training programme covering tourism operations, itinerary planning, customer service protocols, and hospitality industry standards",
  ];
  items.push(...experienceEntry("My Travel", "Tourism Training Intern", "2025", travelBullets));

  // Education
  items.push(sectionHeading("Education"));

  items.push(new Paragraph({
    spacing: { before: 100, after: 20, line: 276 },
    indent: { left: 120 },
    children: [
      new TextRun({ text: "The Higher Institute of Tourism and Hotels (EGOTH)", size: 20, bold: true, color: C.title, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  }));
  items.push(new Paragraph({
    spacing: { before: 0, after: 20, line: 276 },
    indent: { left: 120 },
    tabStops: [{ type: TabStopType.RIGHT, position: 7600 }],
    children: [
      new TextRun({ text: "Bachelor of Tourism Studies and Hospitality Management", size: 18, color: C.accent, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, italics: true }),
      new TextRun({ text: "\tExpected 2028", size: 17, color: C.sec, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  }));
  items.push(new Paragraph({
    spacing: { before: 0, after: 40, line: 260 },
    indent: { left: 120 },
    children: [
      new TextRun({ text: "\u25B8 ", size: 15, color: C.accent, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text: "Accredited by Egypt\u2019s National Authority for Quality Assurance and Accreditation of Education", size: 17, color: C.body, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  }));
  items.push(new Paragraph({
    spacing: { before: 0, after: 40, line: 260 },
    indent: { left: 120 },
    children: [
      new TextRun({ text: "\u25B8 ", size: 15, color: C.accent, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text: "Relevant coursework: Hospitality Operations, Tourism Management, Customer Service Excellence", size: 17, color: C.body, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  }));

  return items;
}

// ── Assemble the document ──
async function main() {
  const sidebarItems = buildSidebar();
  const bodyItems = buildBody();

  // Full-page table: sidebar (30%) + body (70%)
  const mainTable = new Table({
    columnWidths: [3400, 8506],
    rows: [
      new TableRow({
        height: { value: 16038, rule: "exact" },
        children: [
          // Left sidebar cell
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: C.side, type: ShadingType.CLEAR },
            verticalAlign: "top",
            borders: { ...noBorders, right: { style: BorderStyle.SINGLE, size: 0, color: C.side } },
            margins: { top: 200, bottom: 200, left: 300, right: 200 },
            children: sidebarItems,
          }),
          // Right body cell
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
            verticalAlign: "top",
            borders: noBorders,
            margins: { top: 300, bottom: 200, left: 400, right: 400 },
            children: bodyItems,
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
            size: 20,
            color: C.body,
          },
          paragraph: {
            spacing: { line: 276 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
          },
        },
        children: [mainTable],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("/home/z/my-project/download/Nada_El_Sherbiney_Resume.docx", buffer);
  console.log("Resume generated successfully!");
}

main().catch(console.error);
