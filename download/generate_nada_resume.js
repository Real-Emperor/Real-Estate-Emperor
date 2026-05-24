const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType, TabStopType,
  VerticalAlign,
} = require("docx");
const fs = require("fs");

// ── Palette: Refined Hospitality Corporate ──
const S = {
  side: "1A3040",      // deep navy sidebar
  sideText: "FFFFFF",  // white sidebar text
  sideLabel: "A0B8C8", // light blue-grey sidebar secondary
  accent: "2E86AB",    // teal accent
  title: "1A2636",     // dark heading
  body: "2C3E50",      // body text
  sec: "6B8A98",       // secondary info (dates etc.)
  line: "2E86AB",      // left-border heading line
  dotFill: "2E86AB",   // skill dot filled
  dotEmpty: "B8D4DE",  // skill dot empty
  lightBg: "F0F5F8",   // light background
};

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

// ── Helper: Section heading with left border ──
function sectionHeading(text) {
  return new Paragraph({
    borders: { left: { style: BorderStyle.SINGLE, size: 8, color: S.accent, space: 8 } },
    indent: { left: 120 },
    spacing: { before: 240, after: 80 },
    children: [
      new TextRun({ text, size: 22, bold: true, color: S.title, font: "Calibri" }),
    ],
  });
}

// ── Helper: Sidebar label + value ──
function sidebarLabel(label, value) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: label, size: 15, color: S.sideLabel, font: "Calibri" }),
    ],
  });
}

function sidebarValue(value) {
  return new Paragraph({
    spacing: { before: 0, after: 80 },
    children: [
      new TextRun({ text: value, size: 17, color: S.sideText, font: "Calibri" }),
    ],
  });
}

// ── Helper: Skill rating ──
function skillRating(name, level) {
  const filled = "\u25CF".repeat(level);
  const empty = "\u25CB".repeat(5 - level);
  return new Paragraph({
    spacing: { before: 30, after: 30 },
    children: [
      new TextRun({ text: name + "  ", size: 17, color: S.sideText, font: "Calibri" }),
      new TextRun({ text: filled, size: 13, color: S.dotFill, font: "Calibri" }),
      new TextRun({ text: empty, size: 13, color: S.dotEmpty, font: "Calibri" }),
    ],
  });
}

// ── Helper: Sidebar divider ──
function sidebarDivider() {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "2A4A5A", space: 4 } },
    children: [new TextRun({ text: "", size: 2 })],
  });
}

// ── Helper: Experience entry ──
function experienceEntry(company, role, dateRange, bullets) {
  const items = [];
  // Line 1: Company name (bold)
  items.push(new Paragraph({
    spacing: { before: 140, after: 0 },
    children: [
      new TextRun({ text: company, size: 21, bold: true, color: S.title, font: "Calibri" }),
    ],
  }));
  // Line 2: Role (accent) + Date range (right-aligned via tab)
  items.push(new Paragraph({
    spacing: { before: 0, after: 60 },
    tabStops: [{ type: TabStopType.RIGHT, position: 7500 }],
    children: [
      new TextRun({ text: role, size: 19, color: S.accent, font: "Calibri" }),
      new TextRun({ text: "\t" + dateRange, size: 17, color: S.sec, font: "Calibri" }),
    ],
  }));
  // Bullets
  for (const b of bullets) {
    items.push(new Paragraph({
      spacing: { before: 20, after: 20 },
      indent: { left: 240 },
      children: [
        new TextRun({ text: "\u25B8 ", size: 17, color: S.accent, font: "Calibri" }),
        new TextRun({ text: b, size: 18, color: S.body, font: "Calibri" }),
      ],
    }));
  }
  return items;
}

// ── Helper: Education entry ──
function educationEntry(school, degree, dateRange, details) {
  const items = [];
  items.push(new Paragraph({
    spacing: { before: 140, after: 0 },
    children: [
      new TextRun({ text: school, size: 21, bold: true, color: S.title, font: "Calibri" }),
    ],
  }));
  items.push(new Paragraph({
    spacing: { before: 0, after: 40 },
    tabStops: [{ type: TabStopType.RIGHT, position: 7500 }],
    children: [
      new TextRun({ text: degree, size: 19, color: S.accent, font: "Calibri" }),
      new TextRun({ text: "\t" + dateRange, size: 17, color: S.sec, font: "Calibri" }),
    ],
  }));
  for (const d of details) {
    items.push(new Paragraph({
      spacing: { before: 20, after: 20 },
      indent: { left: 240 },
      children: [
        new TextRun({ text: "\u25B8 ", size: 17, color: S.accent, font: "Calibri" }),
        new TextRun({ text: d, size: 18, color: S.body, font: "Calibri" }),
      ],
    }));
  }
  return items;
}

// ════════════════════════════════════════════
// BUILD SIDEBAR CELL
// ════════════════════════════════════════════
const sidebarChildren = [];

// Name
sidebarChildren.push(new Paragraph({
  spacing: { before: 600, after: 40 },
  alignment: AlignmentType.CENTER,
  children: [
    new TextRun({ text: "NADA", size: 40, bold: true, color: S.sideText, font: "Calibri" }),
  ],
}));
sidebarChildren.push(new Paragraph({
  spacing: { before: 0, after: 120 },
  alignment: AlignmentType.CENTER,
  children: [
    new TextRun({ text: "EL SHERBINEY", size: 28, bold: true, color: S.sideText, font: "Calibri" }),
  ],
}));

// Target title
sidebarChildren.push(new Paragraph({
  spacing: { before: 0, after: 200 },
  alignment: AlignmentType.CENTER,
  children: [
    new TextRun({ text: "Hospitality & Tourism Professional", size: 16, color: S.accent, font: "Calibri", italics: true }),
  ],
}));

sidebarDivider();

// Contact
sidebarChildren.push(sidebarLabel("CONTACT"));
sidebarChildren.push(sidebarValue("+20 (0) XXX-XXX-XXXX"));
sidebarChildren.push(sidebarValue("nada.elsherbiney@email.com"));
sidebarChildren.push(sidebarValue("Alexandria, Egypt"));

sidebarDivider();

// Education sidebar
sidebarChildren.push(sidebarLabel("EDUCATION"));
sidebarChildren.push(sidebarValue("B.A. Tourism & Hospitality"));
sidebarChildren.push(sidebarValue("EGOTH Institute"));
sidebarChildren.push(sidebarValue("Expected 2028"));

sidebarDivider();

// Languages
sidebarChildren.push(sidebarLabel("LANGUAGES"));
sidebarChildren.push(skillRating("Arabic", 5));
sidebarChildren.push(skillRating("English", 4));

sidebarDivider();

// Skills
sidebarChildren.push(sidebarLabel("CORE SKILLS"));
sidebarChildren.push(skillRating("Customer Service", 5));
sidebarChildren.push(skillRating("Social Media", 4));
sidebarChildren.push(skillRating("Inventory Mgmt.", 4));
sidebarChildren.push(skillRating("Sales Operations", 4));
sidebarChildren.push(skillRating("Trend Analysis", 3));
sidebarChildren.push(skillRating("Hospitality Ops", 3));

sidebarDivider();

// Certifications
sidebarChildren.push(sidebarLabel("CERTIFICATIONS"));
sidebarChildren.push(sidebarValue("Tourism Basics Certificate"));
sidebarChildren.push(sidebarValue("My Travel Training Program"));

sidebarDivider();

// Interests
sidebarChildren.push(sidebarLabel("INTERESTS"));
sidebarChildren.push(sidebarValue("Beauty & Fashion Trends"));
sidebarChildren.push(sidebarValue("Travel & Cultural Exchange"));
sidebarChildren.push(sidebarValue("Digital Marketing"));

const sidebarCell = new TableCell({
  shading: { fill: S.side, type: ShadingType.CLEAR },
  margins: { top: 200, bottom: 200, left: 250, right: 250 },
  width: { size: 3400, type: WidthType.DXA },
  borders: { top: NB, bottom: NB, left: NB, right: NB },
  children: sidebarChildren,
});

// ════════════════════════════════════════════
// BUILD BODY CELL
// ════════════════════════════════════════════
const bodyChildren = [];

// Profile Summary
bodyChildren.push(sectionHeading("PROFILE SUMMARY"));
bodyChildren.push(new Paragraph({
  spacing: { before: 60, after: 120 },
  children: [
    new TextRun({
      text: "Ambitious hospitality and tourism management student with over two years of hands-on experience in retail sales, inventory optimization, and social media community management. Proven ability to analyze consumer demand patterns, coordinate restocking workflows, and drive customer engagement across digital platforms. Seeking to leverage strong interpersonal skills, trend-awareness, and operational discipline in a corporate hospitality or tourism management role.",
      size: 18, color: S.body, font: "Calibri",
    }),
  ],
}));

// Work Experience
bodyChildren.push(sectionHeading("WORK EXPERIENCE"));

bodyChildren.push(...experienceEntry(
  "She-M",
  "Sales Associate & Social Media Moderator",
  "Jan 2025 \u2013 Present",
  [
    "Manage official TikTok and Instagram accounts, responding to customer inquiries, booking orders, and communicating product availability schedules in real time",
    "Conduct weekly inventory audits to identify stock gaps, coordinate restocking priorities, and reduce overstock of low-demand items through demand-driven analysis",
    "Monitor beauty and accessories market trends to inform product selection, promotional timing, and visual merchandising strategies",
    "Address customer concerns via comments and direct messages, maintaining a response rate that supports sustained engagement and repeat orders",
    "Coordinate pre-order schedules for upcoming product launches, ensuring customers are informed of availability timelines",
  ]
));

bodyChildren.push(...experienceEntry(
  "Seniors Cosmetics Store",
  "Sales Associate",
  "Jul 2023 \u2013 Dec 2024  \u2022  1 yr 6 mos",
  [
    "Delivered personalized product consultations in cosmetics and accessories, translating customer preferences into tailored recommendations",
    "Maintained visual merchandising standards aligned with seasonal trends and promotional campaigns",
    "Processed point-of-sale transactions accurately and managed cash handling procedures",
    "Contributed to achieving weekly sales targets through proactive customer engagement and upselling techniques",
  ]
));

// Internship
bodyChildren.push(...experienceEntry(
  "My Travel",
  "Tourism Operations Intern",
  "1 Month  \u2022  Certificate Program",
  [
    "Completed foundational training in tourism operations, including itinerary planning, customer service protocols, and destination management",
    "Gained exposure to booking systems, travel coordination workflows, and industry regulatory frameworks",
    "Received Tourism Basics Certificate upon successful completion of the program",
  ]
));

// Education
bodyChildren.push(sectionHeading("EDUCATION"));

bodyChildren.push(...educationEntry(
  "The Higher Institute of Tourism and Hotels (EGOTH)",
  "Bachelor of Tourism Studies & Hospitality Management",
  "Sep 2023 \u2013 Expected Jun 2028",
  [
    "Accredited by Egypt\u2019s National Authority for Quality Assurance and Accreditation of Education (NAQAAE)",
    "Relevant coursework: Hospitality Operations, Tourism Marketing, Customer Relationship Management, Revenue Management",
    "Active participant in campus hospitality simulation projects and industry networking events",
  ]
));

// Key Achievements
bodyChildren.push(sectionHeading("KEY COMPETENCIES"));
const competencies = [
  "Inventory Analysis & Demand Forecasting  \u2022  Social Media Community Management  \u2022  Customer Relationship Management",
  "Retail Sales & Consultative Selling  \u2022  Trend Monitoring & Market Awareness  \u2022  Cross-Platform Digital Communication",
  "Visual Merchandising  \u2022  Hospitality Service Standards  \u2022  Multilingual Communication (Arabic/English)",
];
for (const c of competencies) {
  bodyChildren.push(new Paragraph({
    spacing: { before: 30, after: 30 },
    indent: { left: 120 },
    children: [
      new TextRun({ text: "\u25B8 ", size: 17, color: S.accent, font: "Calibri" }),
      new TextRun({ text: c, size: 17, color: S.body, font: "Calibri" }),
    ],
  }));
}

const bodyCell = new TableCell({
  shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
  margins: { top: 300, bottom: 200, left: 350, right: 350 },
  width: { size: 8506, type: WidthType.DXA },
  borders: { top: NB, bottom: NB, left: NB, right: NB },
  verticalAlign: VerticalAlign.TOP,
  children: bodyChildren,
});

// ════════════════════════════════════════════
// MAIN TABLE (sidebar + body)
// ════════════════════════════════════════════
const mainTable = new Table({
  columnWidths: [3400, 8506],
  rows: [
    new TableRow({
      height: { value: 16038, rule: "exact" },
      children: [sidebarCell, bodyCell],
    }),
  ],
  borders: {
    top: NB, bottom: NB, left: NB, right: NB,
    insideHorizontal: NB, insideVertical: NB,
  },
  width: { size: 100, type: WidthType.PERCENTAGE },
});

// ════════════════════════════════════════════
// DOCUMENT
// ════════════════════════════════════════════
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 20, color: S.body },
        paragraph: { spacing: { line: 276 } },
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

const OUTPUT = "/home/z/my-project/download/Nada_El_Sherbiney_Resume.docx";
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUTPUT, buf);
  console.log("Resume generated:", OUTPUT, "Size:", buf.length, "bytes");
});
