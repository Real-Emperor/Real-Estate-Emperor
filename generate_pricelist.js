const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, WidthType, BorderStyle,
  ShadingType, LevelFormat, ExternalHyperlink,
} = require("docx");
const fs = require("fs");

// ── Color Palette ──
const P = {
  primary: "#1B2A4A",
  accent: "#b2253d",
  body: "#262522",
  muted: "#918e86",
  surface: "#f0efec",
};
const hex = (c) => c.replace("#", "");

// ── Font Config ──
const F = { ascii: "Calibri", eastAsia: "SimHei" };

// ── Helper: create a TextRun ──
function run(text, opts = {}) {
  return new TextRun({
    text,
    font: F,
    size: opts.size || 20,
    bold: opts.bold || false,
    italics: opts.italics || false,
    color: opts.color ? hex(opts.color) : hex(P.body),
    ...opts,
  });
}

// ── Helper: standard paragraph spacing ──
const stdSpacing = { line: 312, lineRule: "atLeast" };

// ── Helper: section header with accent background ──
function sectionHeader(title) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: hex(P.accent) },
            margins: { top: 100, bottom: 100, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { ...stdSpacing, before: 0, after: 0 },
                alignment: AlignmentType.LEFT,
                children: [
                  run(title, { size: 24, bold: true, color: "#FFFFFF" }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ── Helper: data table ──
function dataTable(headers, rows, colWidths, opts = {}) {
  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "D0D0D0" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D0D0" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => {
      const isLast = i === headers.length - 1;
      return new TableCell({
        width: { size: colWidths[i], type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: hex(P.surface) },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: isLast ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: { ...stdSpacing, before: 0, after: 0 },
            children: [
              run(h, { size: 20, bold: true, color: P.primary }),
            ],
          }),
        ],
      });
    }),
  });

  // Data rows
  const dataRows = rows.map((row, rowIdx) => {
    const bgColor = rowIdx % 2 === 0 ? "FFFFFF" : "f8f7f5";
    return new TableRow({
      cantSplit: true,
      children: row.map((cell, i) => {
        const isLast = i === headers.length - 1;
        return new TableCell({
          width: { size: colWidths[i], type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: bgColor },
          margins: { top: 50, bottom: 50, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: isLast ? AlignmentType.RIGHT : AlignmentType.LEFT,
              spacing: { ...stdSpacing, before: 0, after: 0 },
              children: [
                run(cell, { size: 20 }),
              ],
            }),
          ],
        });
      }),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [headerRow, ...dataRows],
  });
}

// ── Helper: numbered list item ──
function numberedItem(num, title, desc) {
  return new Paragraph({
    spacing: { ...stdSpacing, before: 60, after: 60 },
    children: [
      run(`${num}. `, { bold: true, color: P.accent, size: 21 }),
      run(title, { bold: true, size: 21 }),
      run(` \u2014 ${desc}`, { size: 20, color: P.muted }),
    ],
  });
}

// ── Helper: bullet item ──
function bulletItem(text) {
  return new Paragraph({
    spacing: { ...stdSpacing, before: 40, after: 40 },
    indent: { left: 360 },
    children: [
      run("\u2022  ", { color: P.accent, size: 21 }),
      run(text, { size: 20 }),
    ],
  });
}

// ── Helper: pricing note ──
function pricingNote(text) {
  return new Paragraph({
    spacing: { ...stdSpacing, before: 30, after: 30 },
    children: [
      run(`* ${text}`, { size: 18, italics: true, color: P.muted }),
    ],
  });
}

// ══════════════════════════════════════════════════════
//  BUILD DOCUMENT
// ══════════════════════════════════════════════════════

async function main() {
  // ── Section 1: One-Time Reports ──
  const oneTimeHeaders = ["Service", "Description", "Price (AED)"];
  const oneTimeRows = [
    ["Monthly Sales Report", "Dashboard with sales trends, top products, and comparisons", "300 - 500"],
    ["Expense Tracker Report", "Organized expense categories, charts, spending breakdown", "200 - 400"],
    ["Profit & Loss Summary", "Revenue vs expenses, net profit, monthly comparison charts", "300 - 500"],
    ["Inventory Report", "Stock levels, fast/slow movers, reorder alerts", "250 - 400"],
    ["Business Health Check", "Full analysis with recommendations and action items", "500 - 1,000"],
  ];

  // ── Section 2: Monthly Retainer ──
  const retainerHeaders = ["Package", "Includes", "Monthly (AED)"];
  const retainerRows = [
    ["Basic", "1 monthly sales report + expense summary", "500 - 800"],
    ["Standard", "Sales + expense + P&L reports + email support", "1,000 - 1,500"],
    ["Premium", "All reports + inventory + recommendations + priority support", "1,500 - 2,500"],
  ];

  // ── Section 3: Additional Services ──
  const additionalHeaders = ["Service", "Description", "Price (AED)"];
  const additionalRows = [
    ["Custom Dashboard", "Interactive dashboard tailored to your business needs", "800 - 1,500"],
    ["Data Cleanup", "Organize messy spreadsheets into clean, usable data", "200 - 500"],
    ["Arabic-English Report", "Bilingual report for Arabic-speaking stakeholders", "+200 surcharge"],
    ["Urgent / Same-Day", "Priority delivery within 24 hours", "+50% surcharge"],
    ["Consultation (1hr)", "One-on-one session to discuss your data needs", "100"],
  ];

  // ── Horizontal line ──
  const hLine = new Paragraph({
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: hex(P.accent), space: 1 },
    },
    children: [],
  });

  // ── Spacer ──
  const spacer = (twips = 100) =>
    new Paragraph({ spacing: { before: twips, after: 0 }, children: [] });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: F,
            size: 20,
            color: hex(P.body),
          },
          paragraph: {
            spacing: { line: 312 },
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "how-it-works",
          levels: [{
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: F,
                  size: 18,
                  color: hex(P.muted),
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ══════════════════════════════════════
        // HEADER SECTION
        // ══════════════════════════════════════
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...stdSpacing, before: 200, after: 0 },
          children: [
            run("Ahmed Ali", { size: 52, bold: true, color: P.primary }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...stdSpacing, before: 60, after: 0 },
          children: [
            run("DATA ANALYSIS SERVICES", { size: 28, bold: true, color: P.accent }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...stdSpacing, before: 80, after: 0 },
          children: [
            run("Turning Your Numbers Into Clear Business Decisions", {
              size: 22, italics: true, color: P.muted,
            }),
          ],
        }),
        hLine,
        spacer(100),

        // ══════════════════════════════════════
        // SECTION 1: ONE-TIME REPORTS
        // ══════════════════════════════════════
        sectionHeader("ONE-TIME REPORTS"),
        spacer(80),
        dataTable(oneTimeHeaders, oneTimeRows, [28, 50, 22]),
        spacer(200),

        // ══════════════════════════════════════
        // SECTION 2: MONTHLY RETAINER PACKAGES
        // ══════════════════════════════════════
        sectionHeader("MONTHLY RETAINER PACKAGES"),
        spacer(80),
        dataTable(retainerHeaders, retainerRows, [22, 50, 28]),
        spacer(200),

        // ══════════════════════════════════════
        // SECTION 3: ADDITIONAL SERVICES
        // ══════════════════════════════════════
        sectionHeader("ADDITIONAL SERVICES"),
        spacer(80),
        dataTable(additionalHeaders, additionalRows, [28, 50, 22]),
        spacer(200),

        // ══════════════════════════════════════
        // SECTION 4: HOW IT WORKS
        // ══════════════════════════════════════
        sectionHeader("HOW IT WORKS"),
        spacer(80),
        numberedItem(1, "Contact", "Reach out via WhatsApp or phone to discuss your needs"),
        numberedItem(2, "Share Data", "Export your data to Excel/CSV and send it securely"),
        numberedItem(3, "NDA Signed", "Confidentiality agreement provided for your peace of mind"),
        numberedItem(4, "Analysis", "I analyze your data and create professional reports"),
        numberedItem(5, "Delivery", "Receive your report within 2-5 business days"),
        numberedItem(6, "Review", "One round of revisions included at no extra cost"),
        spacer(200),

        // ══════════════════════════════════════
        // SECTION 5: YOUR GUARANTEE
        // ══════════════════════════════════════
        sectionHeader("YOUR GUARANTEE"),
        spacer(80),
        bulletItem("NDA signed before any data is shared \u2014 your information stays confidential"),
        bulletItem("No access to your bank accounts or online systems \u2014 you control your data"),
        bulletItem("100% satisfaction guarantee \u2014 free revisions if you are not happy"),
        bulletItem("Teacher by profession \u2014 trust and integrity come first"),
        bulletItem("UAE-based \u2014 available for in-person meetings in Sharjah, Dubai, Ajman"),
        spacer(200),

        // ══════════════════════════════════════
        // PRICING NOTES
        // ══════════════════════════════════════
        new Paragraph({
          spacing: { ...stdSpacing, before: 0, after: 60 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 2, color: "D0D0D0", space: 8 },
          },
          children: [],
        }),
        pricingNote("Prices vary based on data volume and complexity. Final quote provided after consultation."),
        pricingNote("All prices in UAE Dirhams (AED). Payment via bank transfer or cash."),
        pricingNote("First-time clients: 10% discount on your first report."),
        pricingNote("Monthly retainer clients receive priority support and faster turnaround."),
        spacer(250),

        // ══════════════════════════════════════
        // CONTACT FOOTER
        // ══════════════════════════════════════
        new Paragraph({
          spacing: { ...stdSpacing, before: 0, after: 0 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 4, color: hex(P.accent), space: 8 },
          },
          children: [],
        }),
        spacer(80),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...stdSpacing, before: 0, after: 40 },
          children: [
            run("Ahmed Ali", { size: 24, bold: true, color: P.primary }),
            run("  |  ", { size: 22, color: P.muted }),
            run("Data Analysis Services", { size: 22, color: P.body }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...stdSpacing, before: 0, after: 40 },
          children: [
            new ExternalHyperlink({
              children: [
                run("ahmed-ali-ops.vercel.app", { size: 20, color: P.accent }),
              ],
              link: "https://ahmed-ali-ops.vercel.app",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { ...stdSpacing, before: 0, after: 0 },
          children: [
            run("WhatsApp: _________________", { size: 20, color: P.muted }),
            run("  |  ", { size: 20, color: P.muted }),
            run("Phone: _________________", { size: 20, color: P.muted }),
          ],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = "/home/z/my-project/download/Service_Price_List.docx";
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Document saved to: ${outPath}`);
  console.log(`   File size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("❌ Error generating document:", err);
  process.exit(1);
});
