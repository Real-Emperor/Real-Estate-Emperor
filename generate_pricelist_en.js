const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType, Header, Footer,
  PageNumber, PageBreak, ExternalHyperlink
} = require("docx");
const fs = require("fs");

// ── Palette: CM-2 Blue Orange (Corporate / Professional) ──
const P = {
  primary: "1284BA",
  accent: "FF862F",
  body: "2A2A2A",
  secondary: "606060",
  light: "EDF4F9",
  white: "FFFFFF",
  discount: "E8F5E9",
  strikeColor: "B0B0B0",
  highlight: "FFF3E0",
  headerBg: "1284BA",
  headerText: "FFFFFF",
  accentBg: "FFF8F0",
};

const cellMargins = { top: 70, bottom: 70, left: 140, right: 140 };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "D0D8E0" };
const accentBorder = { style: BorderStyle.SINGLE, size: 2, color: P.primary };

function makeHeaderCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20, color: P.headerText, font: { ascii: "Calibri" } })]
    })],
    shading: { type: ShadingType.CLEAR, fill: P.headerBg },
    margins: cellMargins,
    verticalAlign: "center",
  });
}

function makeCell(children, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: Array.isArray(children) ? children : [children],
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    margins: cellMargins,
    verticalAlign: "center",
  });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    alignment: opts.alignment || AlignmentType.LEFT,
    spacing: opts.spacing || { after: 80 },
    children: [new TextRun({ text, size: opts.size || 20, color: opts.color || P.body, font: { ascii: "Calibri" }, bold: opts.bold || false, italics: opts.italics || false })]
  });
}

function strikeText(text) {
  return new TextRun({ text, size: 18, color: P.strikeColor, font: { ascii: "Calibri" }, strike: true });
}

function discountText(text) {
  return new TextRun({ text, size: 22, color: "2E7D32", font: { ascii: "Calibri" }, bold: true });
}

function priceCell(before, after, width) {
  return makeCell([
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [strikeText(`AED ${before}`)]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [discountText(`AED ${after}`)]
    })
  ], width, { shading: P.discount });
}

function makeTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => makeHeaderCell(h, colWidths[i]))
  });
  const dataRows = rows.map((row, ri) => {
    const bgShading = ri % 2 === 0 ? P.light : P.white;
    return new TableRow({
      cantSplit: true,
      children: row.map((cell, ci) => {
        if (cell.type === "price") {
          return priceCell(cell.before, cell.after, colWidths[ci]);
        }
        return makeCell(
          bodyText(cell, { color: P.body, size: 20 }),
          colWidths[ci],
          { shading: bgShading }
        );
      })
    });
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: accentBorder, bottom: accentBorder,
      left: noBorder, right: noBorder,
      insideHorizontal: thinBorder, insideVertical: noBorder,
    },
    rows: [headerRow, ...dataRows],
  });
}

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 360, after: 120 },
    children: [
      new TextRun({ text: "  ", size: 24, font: { ascii: "Calibri" } }),
      new TextRun({ text, bold: true, size: 26, color: P.primary, font: { ascii: "Calibri" } }),
    ]
  });
}

function promoBanner(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    shading: { type: ShadingType.CLEAR, fill: "FFF3E0" },
    children: [new TextRun({ text, bold: true, size: 22, color: "E65100", font: { ascii: "Calibri" } })]
  });
}

// ── Build Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri" }, size: 20, color: P.body },
        paragraph: { spacing: { line: 312 } }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 },
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Ahmed Ali Data Services", size: 16, color: P.secondary, font: { ascii: "Calibri" }, italics: true }),
            ]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100 },
              children: [
                new TextRun({ text: "WhatsApp: ", size: 16, color: P.secondary, font: { ascii: "Calibri" } }),
                new TextRun({ text: "[Your Number]", size: 16, color: P.primary, font: { ascii: "Calibri" }, bold: true }),
                new TextRun({ text: "  |  ", size: 16, color: P.secondary, font: { ascii: "Calibri" } }),
                new TextRun({ text: "ahmed-ali-ops.vercel.app", size: 16, color: P.primary, font: { ascii: "Calibri" }, bold: true }),
              ]
            })
          ]
        })
      },
      children: [
        // ── Title Block ──
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "SERVICE & PRICING GUIDE", bold: true, size: 36, color: P.primary, font: { ascii: "Calibri" } })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "Professional Data Analysis  |  Excel Reports  |  POS Systems  |  CV & Digital Cards", size: 20, color: P.secondary, font: { ascii: "Calibri" }, italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 10 } },
          indent: { left: 2000, right: 2000 },
          children: []
        }),

        // ── Promo Banner ──
        promoBanner("LIMITED TIME OFFER  —  UP TO 50% OFF ALL SERVICES  —  LAUNCH PRICING"),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Take advantage of our introductory rates before they change. Same premium quality, special launch prices.", size: 18, color: P.secondary, font: { ascii: "Calibri" }, italics: true })]
        }),

        // ── Section 1: Data Analysis & Reports ──
        sectionHeading("DATA ANALYSIS & REPORTS"),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: "Turn your raw business data into clear, actionable insights. Every report comes with professional formatting, visual charts, and practical recommendations.", size: 19, color: P.secondary, font: { ascii: "Calibri" } })]
        }),
        makeTable(
          ["Service", "Description", "Price"],
          [
            ["Sales Report", "Daily, weekly, or monthly sales breakdown with trends and charts", { type: "price", before: 300, after: 150 }],
            ["Expense Analysis", "Detailed expense categorization with cost-saving recommendations", { type: "price", before: 400, after: 200 }],
            ["Profit & Loss Statement", "Complete P&L with margin analysis and financial health score", { type: "price", before: 600, after: 300 }],
            ["Inventory Report", "Stock levels, turnover rates, reorder alerts, and waste tracking", { type: "price", before: 500, after: 250 }],
            ["Staff Performance Report", "Employee productivity metrics, commission tracking, and rankings", { type: "price", before: 400, after: 200 }],
            ["Custom KPI Dashboard", "Visual dashboard with key metrics tailored to your business", { type: "price", before: 800, after: 400 }],
          ],
          [30, 45, 25]
        ),

        // ── Section 2: Monthly Retainers ──
        sectionHeading("MONTHLY RETAINER PACKAGES"),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: "Stay on top of your numbers every month without lifting a finger. We collect your data, process it, and deliver polished reports automatically.", size: 19, color: P.secondary, font: { ascii: "Calibri" } })]
        }),
        makeTable(
          ["Package", "Includes", "Monthly Price"],
          [
            ["Basic", "Monthly sales report + expense summary", { type: "price", before: 800, after: 400 }],
            ["Professional", "All Basic reports + P&L statement + inventory tracking", { type: "price", before: 1500, after: 750 }],
            ["Premium", "All Professional reports + KPI dashboard + staff performance + priority support", { type: "price", before: 2500, after: 1250 }],
          ],
          [25, 50, 25]
        ),

        // ── Section 3: POS Systems ──
        sectionHeading("POS SYSTEMS (POINT OF SALE)"),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: "A complete Point of Sale system built in Excel — no monthly subscriptions, no internet required, yours forever. One payment, lifetime ownership.", size: 19, color: P.secondary, font: { ascii: "Calibri" } })]
        }),
        makeTable(
          ["System", "Features", "One-Time Price"],
          [
            ["Basic POS", "Sales entry + auto-invoices + daily/weekly/monthly summaries + receipt printing", { type: "price", before: 600, after: 300 }],
            ["Professional POS", "All Basic features + inventory tracking + staff performance + low-stock alerts", { type: "price", before: 1200, after: 600 }],
            ["Premium POS", "All Professional features + expense tracking + profit analysis + full KPI dashboard", { type: "price", before: 1800, after: 900 }],
          ],
          [25, 50, 25]
        ),
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: "Available for: ", size: 18, color: P.secondary, font: { ascii: "Calibri" } }),
            new TextRun({ text: "Salons & Beauty Centers  |  Restaurants & Cafeterias  |  Grocery Stores  |  Retail Shops  |  Car Workshops  |  Laundries  |  Tailoring Shops", size: 18, color: P.body, font: { ascii: "Calibri" }, bold: true }),
          ]
        }),
        makeTable(
          ["Add-On Service", "Details", "Price"],
          [
            ["Monthly POS Maintenance", "Updates, fixes, adjustments, and new features added monthly", { type: "price", before: 300, after: 150 }],
            ["Multi-Branch Setup", "Consolidated reporting across multiple locations", { type: "price", before: 500, after: 250 }],
            ["Custom Feature Development", "Add any specific feature or report to your existing POS", { type: "price", before: 400, after: 200 }],
          ],
          [30, 45, 25]
        ),

        // ── Section 4: CV Writing ──
        sectionHeading("CV, RESUME & DIGITAL CARDS"),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: "Stand out from the crowd with a professionally designed CV, or go further with your own digital resume website. Share a link instead of a file — one tap and employers reach you.", size: 19, color: P.secondary, font: { ascii: "Calibri" } })]
        }),
        makeTable(
          ["Service", "What You Get", "Price"],
          [
            ["Professional CV / Resume", "ATS-optimized layout + powerful wording + cover letter + 2 revisions included", { type: "price", before: 100, after: 50 }],
            ["Digital Resume Card (Website)", "Your own personal website as an interactive resume + shareable link + mobile-friendly + one-tap contact", { type: "price", before: 300, after: 150 }],
          ],
          [25, 50, 25]
        ),

        // ── Section 5: Add-ons ──
        sectionHeading("ADD-ON SERVICES"),
        makeTable(
          ["Service", "Description", "Price"],
          [
            ["Data Entry & Cleanup", "Organize messy data from papers, WhatsApp, or notebooks into clean spreadsheets", { type: "price", before: 200, after: 100 }],
            ["Urgent Same-Day Delivery", "Get your report or system delivered within 24 hours", { type: "price", before: 150, after: 75 }],
            ["Arabic-English Bilingual Report", "All reports available in Arabic, English, or both", { type: "price", before: 200, after: 100 }],
            ["NDA / Confidentiality Agreement", "Signed confidentiality agreement for your peace of mind", { type: "price", before: 0, after: 0 }],
          ],
          [30, 45, 25]
        ),

        // ── How It Works ──
        sectionHeading("HOW IT WORKS"),
        new Paragraph({ spacing: { after: 80 }, children: [
          new TextRun({ text: "Step 1:  ", bold: true, size: 20, color: P.primary, font: { ascii: "Calibri" } }),
          new TextRun({ text: "Contact me on WhatsApp and tell me about your business and needs.", size: 20, color: P.body, font: { ascii: "Calibri" } }),
        ]}),
        new Paragraph({ spacing: { after: 80 }, children: [
          new TextRun({ text: "Step 2:  ", bold: true, size: 20, color: P.primary, font: { ascii: "Calibri" } }),
          new TextRun({ text: "I build your custom report, POS system, CV, or digital card within the agreed timeframe.", size: 20, color: P.body, font: { ascii: "Calibri" } }),
        ]}),
        new Paragraph({ spacing: { after: 80 }, children: [
          new TextRun({ text: "Step 3:  ", bold: true, size: 20, color: P.primary, font: { ascii: "Calibri" } }),
          new TextRun({ text: "You review the work and request any changes or adjustments.", size: 20, color: P.body, font: { ascii: "Calibri" } }),
        ]}),
        new Paragraph({ spacing: { after: 80 }, children: [
          new TextRun({ text: "Step 4:  ", bold: true, size: 20, color: P.primary, font: { ascii: "Calibri" } }),
          new TextRun({ text: "You receive the final file — ready to use. Payment after you are satisfied.", size: 20, color: P.body, font: { ascii: "Calibri" } }),
        ]}),

        // ── Trust Section ──
        sectionHeading("WHY TRUST ME"),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: "I am a UAE-based teacher and data specialist. Accuracy, confidentiality, and reliability are not just skills \u2014 they are my profession. Every client receives a signed confidentiality agreement. I never ask for bank access or passwords. Your data stays completely safe and private. Payment is only required after you review and approve the work.", size: 19, color: P.secondary, font: { ascii: "Calibri" } })]
        }),

        // ── Guarantee ──
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 60 },
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 10 }, bottom: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 10 } },
          indent: { left: 1000, right: 1000 },
          children: [
            new TextRun({ text: "100% Satisfaction Guarantee  \u2014  Free Revisions  \u2014  Pay Only After Approval", bold: true, size: 22, color: P.primary, font: { ascii: "Calibri" } }),
          ]
        }),

        // ── Contact ──
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 60 },
          children: [
            new TextRun({ text: "Get Your Free Consultation Today", bold: true, size: 24, color: P.primary, font: { ascii: "Calibri" } }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "WhatsApp: ", size: 20, color: P.body, font: { ascii: "Calibri" } }),
            new TextRun({ text: "[Your WhatsApp Number]", size: 20, color: P.primary, font: { ascii: "Calibri" }, bold: true }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "Website: ", size: 20, color: P.body, font: { ascii: "Calibri" } }),
            new TextRun({ text: "ahmed-ali-ops.vercel.app", size: 20, color: P.primary, font: { ascii: "Calibri" }, bold: true }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "Serving businesses across all Emirates  \u2014  Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, UAQ", size: 18, color: P.secondary, font: { ascii: "Calibri" }, italics: true }),
          ]
        }),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/download/Service_Price_List_English.docx", buf);
  console.log("English DOCX created successfully!");
});
