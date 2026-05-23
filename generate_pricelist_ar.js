const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType, Header, Footer,
  PageNumber, PageBreak
} = require("docx");
const fs = require("fs");

// ── Palette: CM-2 Blue Orange ──
const P = {
  primary: "1284BA",
  accent: "FF862F",
  body: "2A2A2A",
  secondary: "606060",
  light: "EDF4F9",
  white: "FFFFFF",
  discount: "E8F5E9",
  strikeColor: "B0B0B0",
  headerBg: "1284BA",
  headerText: "FFFFFF",
};

const cellMargins = { top: 70, bottom: 70, left: 140, right: 140 };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "D0D8E0" };
const accentBorder = { style: BorderStyle.SINGLE, size: 2, color: P.primary };

// Arabic font: use Noto Sans SC as fallback but primarily target Arabic fonts
const arabicFont = { ascii: "Calibri", eastAsia: "Noto Sans SC", cs: "Times New Roman" };
const bidi = true;

function makeHeaderCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: bidi,
      children: [new TextRun({ text, bold: true, size: 20, color: P.headerText, font: arabicFont, rightToLeft: true })]
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

function bodyPara(text, opts = {}) {
  return new Paragraph({
    alignment: opts.alignment || AlignmentType.RIGHT,
    bidirectional: bidi,
    spacing: opts.spacing || { after: 80 },
    children: [new TextRun({ text, size: opts.size || 20, color: opts.color || P.body, font: arabicFont, bold: opts.bold || false, italics: opts.italics || false, rightToLeft: true })]
  });
}

function strikeText(text) {
  return new TextRun({ text, size: 18, color: P.strikeColor, font: arabicFont, strike: true, rightToLeft: true });
}

function discountText(text) {
  return new TextRun({ text, size: 22, color: "2E7D32", font: arabicFont, bold: true, rightToLeft: true });
}

function priceCell(before, after, width) {
  if (before === 0 && after === 0) {
    return makeCell([
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "\u0645\u062C\u0627\u0646\u0627\u064B", size: 22, color: "2E7D32", font: arabicFont, bold: true, rightToLeft: true })]
      })
    ], width, { shading: P.discount });
  }
  return makeCell([
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [strikeText(`${before} \u062F.\u0625`)]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [discountText(`${after} \u062F.\u0625`)]
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
          bodyPara(cell, { color: P.body, size: 20 }),
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
    alignment: AlignmentType.RIGHT,
    bidirectional: bidi,
    spacing: { before: 360, after: 120 },
    children: [
      new TextRun({ text, bold: true, size: 26, color: P.primary, font: arabicFont, rightToLeft: true }),
    ]
  });
}

function promoBanner(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    shading: { type: ShadingType.CLEAR, fill: "FFF3E0" },
    children: [new TextRun({ text, bold: true, size: 22, color: "E65100", font: arabicFont, rightToLeft: true })]
  });
}

// ── Build Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: arabicFont, size: 20, color: P.body },
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
              new TextRun({ text: "\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u2014 \u0623\u062D\u0645\u062F \u0639\u0644\u064A", size: 16, color: P.secondary, font: arabicFont, italics: true, rightToLeft: true }),
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
                new TextRun({ text: "\u0648\u0627\u062A\u0633\u0627\u0628: ", size: 16, color: P.secondary, font: arabicFont, rightToLeft: true }),
                new TextRun({ text: "[\u0631\u0642\u0645\u0643]", size: 16, color: P.primary, font: arabicFont, bold: true, rightToLeft: true }),
                new TextRun({ text: "  |  ", size: 16, color: P.secondary, font: arabicFont }),
                new TextRun({ text: "ahmed-ali-ops.vercel.app", size: 16, color: P.primary, font: { ascii: "Calibri" }, bold: true }),
              ]
            })
          ]
        })
      },
      children: [
        // ── Title ──
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          bidirectional: bidi,
          children: [new TextRun({ text: "\u062F\u0644\u064A\u0644 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631", bold: true, size: 36, color: P.primary, font: arabicFont, rightToLeft: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          bidirectional: bidi,
          children: [new TextRun({ text: "\u062A\u062D\u0644\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u062D\u062A\u0631\u0627\u0641\u064A  |  \u062A\u0642\u0627\u0631\u064A\u0631 Excel  |  \u0623\u0646\u0638\u0645\u0629 \u0646\u0642\u0627\u0637 \u0627\u0644\u0628\u064A\u0639  |  \u0627\u0644\u0633\u064A\u0631\u0629 \u0627\u0644\u0630\u0627\u062A\u064A\u0629 \u0648\u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u0631\u0642\u0645\u064A\u0629", size: 20, color: P.secondary, font: arabicFont, italics: true, rightToLeft: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 10 } },
          indent: { left: 2000, right: 2000 },
          children: []
        }),

        // ── Promo ──
        promoBanner("\u0639\u0631\u0636 \u0644\u0641\u062A\u0631\u0629 \u0645\u062D\u062F\u0648\u062F\u0629 \u2014 \u062E\u0635\u0645 \u062D\u062A\u0649 50% \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u2014 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0625\u0637\u0644\u0627\u0642"),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          bidirectional: bidi,
          children: [new TextRun({ text: "\u0627\u0633\u062A\u0641\u064A\u062F\u0648\u0627 \u0645\u0646 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0625\u0637\u0644\u0627\u0642 \u0642\u0628\u0644 \u062A\u063A\u064A\u064A\u0631\u0647\u0627. \u0646\u0641\u0633 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0645\u0645\u062A\u0627\u0632\u0629\u060C \u0623\u0633\u0639\u0627\u0631 \u062E\u0627\u0635\u0629.", size: 18, color: P.secondary, font: arabicFont, italics: true, rightToLeft: true })]
        }),

        // ── Section 1 ──
        sectionHeading("\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631"),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: bidi,
          spacing: { after: 120 },
          children: [new TextRun({ text: "\u062D\u0648\u0651\u0644\u0648\u0627 \u0628\u064A\u0627\u0646\u0627\u062A\u0643\u0645 \u0627\u0644\u062E\u0627\u0645 \u0625\u0644\u0649 \u0631\u0624\u0649 \u0648\u0627\u0636\u062D\u0629 \u0648\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062A\u0646\u0641\u064A\u0630. \u0643\u0644 \u062A\u0642\u0631\u064A\u0631 \u064A\u0623\u062A\u064A \u0628\u062A\u0646\u0633\u064A\u0642 \u0627\u062D\u062A\u0631\u0627\u0641\u064A \u0648\u0631\u0633\u0648\u0645 \u0628\u064A\u0627\u0646\u064A\u0629 \u0648\u062A\u0648\u0635\u064A\u0627\u062A \u0639\u0645\u0644\u064A\u0629.", size: 19, color: P.secondary, font: arabicFont, rightToLeft: true })]
        }),
        makeTable(
          ["\u0627\u0644\u0633\u0639\u0631", "\u0627\u0644\u0648\u0635\u0641", "\u0627\u0644\u062E\u062F\u0645\u0629"],
          [
            [{ type: "price", before: 300, after: 150 }, "\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0648\u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A\u0629 \u0648\u0627\u0644\u0634\u0647\u0631\u064A\u0629 \u0645\u0639 \u0627\u0644\u0627\u062A\u062C\u0627\u0647\u0627\u062A \u0648\u0627\u0644\u0631\u0633\u0648\u0645 \u0627\u0644\u0628\u064A\u0627\u0646\u064A\u0629", "\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A"],
            [{ type: "price", before: 400, after: 200 }, "\u062A\u0635\u0646\u064A\u0641 \u0645\u0641\u0635\u0644 \u0644\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A \u0645\u0639 \u062A\u0648\u0635\u064A\u0627\u062A \u062A\u0642\u0644\u064A\u0644 \u0627\u0644\u062A\u0643\u0627\u0644\u064A\u0641", "\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A"],
            [{ type: "price", before: 600, after: 300 }, "\u0642\u0627\u0626\u0645\u0629 \u0623\u0631\u0628\u0627\u062D \u0648\u062E\u0633\u0627\u0626\u0631 \u0643\u0627\u0645\u0644\u0629 \u0645\u0639 \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0647\u0648\u0627\u0645\u0634 \u0648\u0627\u0644\u0635\u062D\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629", "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0631\u0628\u0627\u062D \u0648\u0627\u0644\u062E\u0633\u0627\u0626\u0631"],
            [{ type: "price", before: 500, after: 250 }, "\u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0648\u0645\u0639\u062F\u0644\u0627\u062A \u0627\u0644\u062F\u0648\u0631\u0627\u0646 \u0648\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0637\u0644\u0628", "\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0645\u062E\u0632\u0648\u0646"],
            [{ type: "price", before: 400, after: 200 }, "\u0645\u0642\u0627\u064A\u064A\u0633 \u0625\u0646\u062A\u0627\u062C\u064A\u0629 \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0648\u062A\u062A\u0628\u0639 \u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062A \u0648\u0627\u0644\u062A\u0631\u062A\u064A\u0628", "\u062A\u0642\u0631\u064A\u0631 \u0623\u062F\u0627\u0621 \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646"],
            [{ type: "price", before: 800, after: 400 }, "\u0644\u0648\u062D\u0629 \u0645\u0624\u0634\u0631\u0627\u062A \u0628\u0635\u0631\u064A\u0629 \u0645\u062E\u0635\u0635\u0629 \u0644\u0645\u0642\u0627\u064A\u064A\u0633\u0643\u0645 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", "\u0644\u0648\u062D\u0629 \u0645\u0624\u0634\u0631\u0627\u062A \u0623\u062F\u0627\u0621 \u0645\u062E\u0635\u0635\u0629"],
          ],
          [25, 45, 30]
        ),

        // ── Section 2 ──
        sectionHeading("\u0628\u0627\u0642\u0627\u062A \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0627\u0644\u0634\u0647\u0631\u064A"),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: bidi,
          spacing: { after: 120 },
          children: [new TextRun({ text: "\u0627\u0628\u0642\u0648\u0627 \u0639\u0644\u0649 \u0627\u0637\u0644\u0627\u0639 \u0628\u0623\u0631\u0642\u0627\u0645\u0643\u0645 \u0643\u0644 \u0634\u0647\u0631 \u062F\u0648\u0646 \u062C\u0647\u062F. \u0646\u062C\u0645\u0639 \u0628\u064A\u0627\u0646\u0627\u062A\u0643\u0645 \u0648\u0646\u0639\u0627\u0644\u062C\u0647\u0627 \u0648\u0646\u0642\u062F\u0645 \u062A\u0642\u0627\u0631\u064A\u0631 \u0645\u0643\u0645\u0644\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B.", size: 19, color: P.secondary, font: arabicFont, rightToLeft: true })]
        }),
        makeTable(
          ["\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0634\u0647\u0631\u064A", "\u064A\u0634\u0645\u0644", "\u0627\u0644\u0628\u0627\u0642\u0629"],
          [
            [{ type: "price", before: 800, after: 400 }, "\u062A\u0642\u0631\u064A\u0631 \u0645\u0628\u064A\u0639\u0627\u062A \u0634\u0647\u0631\u064A + \u0645\u0644\u062E\u0635 \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A", "\u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629"],
            [{ type: "price", before: 1500, after: 750 }, "\u062C\u0645\u064A\u0639 \u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 + \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0631\u0628\u0627\u062D \u0648\u0627\u0644\u062E\u0633\u0627\u0626\u0631 + \u062A\u062A\u0628\u0639 \u0627\u0644\u0645\u062E\u0632\u0648\u0646", "\u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629"],
            [{ type: "price", before: 2500, after: 1250 }, "\u062C\u0645\u064A\u0639 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 + \u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A + \u0623\u062F\u0627\u0621 \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 + \u062F\u0639\u0645 \u0645\u0645\u064A\u0632", "\u0627\u0644\u0645\u0645\u062A\u0627\u0632\u0629"],
          ],
          [25, 50, 25]
        ),

        // ── Section 3: POS ──
        sectionHeading("\u0623\u0646\u0638\u0645\u0629 \u0646\u0642\u0627\u0637 \u0627\u0644\u0628\u064A\u0639 (POS)"),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: bidi,
          spacing: { after: 120 },
          children: [new TextRun({ text: "\u0646\u0638\u0627\u0645 \u0646\u0642\u0637\u0629 \u0628\u064A\u0639 \u0645\u062A\u0643\u0627\u0645\u0644 \u0645\u0628\u0646\u064A \u0641\u064A Excel \u2014 \u0628\u062F\u0648\u0646 \u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A \u0634\u0647\u0631\u064A\u0629\u060C \u0628\u062F\u0648\u0646 \u0625\u0646\u062A\u0631\u0646\u062A\u060C \u0645\u0644\u0643\u0643\u0645 \u0644\u0644\u0623\u0628\u062F. \u062F\u0641\u0639\u0629 \u0648\u0627\u062D\u062F\u0629 \u0641\u0642\u0637.", size: 19, color: P.secondary, font: arabicFont, rightToLeft: true })]
        }),
        makeTable(
          ["\u0627\u0644\u0633\u0639\u0631", "\u0627\u0644\u0645\u064A\u0632\u0627\u062A", "\u0627\u0644\u0646\u0638\u0627\u0645"],
          [
            [{ type: "price", before: 600, after: 300 }, "\u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A + \u0641\u0648\u0627\u062A\u064A\u0631 \u062A\u0644\u0642\u0627\u0626\u064A\u0629 + \u0645\u0644\u062E\u0635\u0627\u062A \u064A\u0648\u0645\u064A\u0629/\u0623\u0633\u0628\u0648\u0639\u064A\u0629/\u0634\u0647\u0631\u064A\u0629 + \u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u0625\u064A\u0635\u0627\u0644\u0627\u062A", "\u0627\u0644\u0623\u0633\u0627\u0633\u064A"],
            [{ type: "price", before: 1200, after: 600 }, "\u062C\u0645\u064A\u0639 \u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A + \u062A\u062A\u0628\u0639 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 + \u0623\u062F\u0627\u0621 \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 + \u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0646\u062E\u0641\u0627\u0636 \u0627\u0644\u0645\u062E\u0632\u0648\u0646", "\u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A"],
            [{ type: "price", before: 1800, after: 900 }, "\u062C\u0645\u064A\u0639 \u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A + \u062A\u062A\u0628\u0639 \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A + \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0623\u0631\u0628\u0627\u062D + \u0644\u0648\u062D\u0629 \u0645\u0624\u0634\u0631\u0627\u062A \u0643\u0627\u0645\u0644\u0629", "\u0627\u0644\u0645\u0645\u062A\u0627\u0632"],
          ],
          [25, 50, 25]
        ),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          bidirectional: bidi,
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: "\u0645\u062A\u0627\u062D \u0644\u0640: ", size: 18, color: P.secondary, font: arabicFont, rightToLeft: true }),
            new TextRun({ text: "\u0635\u0627\u0644\u0648\u0646\u0627\u062A \u0648\u0645\u0631\u0627\u0643\u0632 \u062A\u062C\u0645\u064A\u0644  |  \u0645\u0637\u0627\u0639\u0645 \u0648\u0643\u0627\u0641\u064A\u062A\u0631\u064A\u0627\u062A  |  \u0628\u0642\u0627\u0644\u0627\u062A \u0648\u0633\u0648\u0628\u0631\u0645\u0627\u0631\u0643\u062A\u0633  |  \u0645\u062D\u0644\u0627\u062A \u062A\u062C\u0627\u0631\u064A\u0629  |  \u0648\u0631\u0634 \u0633\u064A\u0627\u0631\u0627\u062A  |  \u0645\u063A\u0627\u0633\u0644  |  \u0645\u0634\u0627\u063A\u0644 \u062A\u0641\u0635\u064A\u0644", size: 18, color: P.body, font: arabicFont, bold: true, rightToLeft: true }),
          ]
        }),
        makeTable(
          ["\u0627\u0644\u0633\u0639\u0631", "\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644", "\u0627\u0644\u062E\u062F\u0645\u0629 \u0627\u0644\u0625\u0636\u0627\u0641\u064A\u0629"],
          [
            [{ type: "price", before: 300, after: 150 }, "\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0634\u0647\u0631\u064A\u0629 \u0648\u0625\u0635\u0644\u0627\u062D\u0627\u062A \u0648\u0645\u064A\u0632\u0627\u062A \u062C\u062F\u064A\u062F\u0629", "\u0635\u064A\u0627\u0646\u0629 \u0634\u0647\u0631\u064A\u0629 \u0644\u0644\u0646\u0638\u0627\u0645"],
            [{ type: "price", before: 500, after: 250 }, "\u062A\u0642\u0627\u0631\u064A\u0631 \u0645\u0648\u062D\u062F\u0629 \u0644\u0639\u062F\u0629 \u0641\u0631\u0648\u0639", "\u0625\u0639\u062F\u0627\u062F \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0641\u0631\u0648\u0639"],
            [{ type: "price", before: 400, after: 200 }, "\u0625\u0636\u0627\u0641\u0629 \u0623\u064A \u0645\u064A\u0632\u0629 \u0623\u0648 \u062A\u0642\u0631\u064A\u0631 \u0645\u062E\u0635\u0635 \u0644\u0646\u0638\u0627\u0645\u0643\u0645", "\u062A\u0637\u0648\u064A\u0631 \u0645\u064A\u0632\u0629 \u0645\u062E\u0635\u0635\u0629"],
          ],
          [25, 45, 30]
        ),

        // ── Section 4: CV ──
        sectionHeading("\u0627\u0644\u0633\u064A\u0631\u0629 \u0627\u0644\u0630\u0627\u062A\u064A\u0629 \u0648\u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u0631\u0642\u0645\u064A\u0629"),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: bidi,
          spacing: { after: 120 },
          children: [new TextRun({ text: "\u062A\u0645\u064A\u0632\u0648\u0627 \u0639\u0646 \u0627\u0644\u0622\u062E\u0631\u064A\u0646 \u0628\u0633\u064A\u0631\u0629 \u0630\u0627\u062A\u064A\u0629 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629\u060C \u0623\u0648 \u0627\u0630\u0647\u0628\u0648\u0627 \u0623\u0628\u0639\u062F \u0628\u0645\u0648\u0642\u0639\u0643\u0645 \u0627\u0644\u0634\u062E\u0635\u064A. \u0634\u0627\u0631\u0643\u0648\u0627 \u0631\u0627\u0628\u0637\u0627\u064B \u0628\u062F\u0644 \u0645\u0644\u0641 \u2014 \u0636\u063A\u0637\u0629 \u0648\u0627\u062D\u062F\u0629 \u0648\u0623\u0635\u062D\u0627\u0628 \u0627\u0644\u0639\u0645\u0644 \u064A\u062A\u0648\u0627\u0635\u0644\u0648\u0646 \u0645\u0639\u0643\u0645.", size: 19, color: P.secondary, font: arabicFont, rightToLeft: true })]
        }),
        makeTable(
          ["\u0627\u0644\u0633\u0639\u0631", "\u0645\u0627 \u062A\u062D\u0635\u0644\u0648\u0646 \u0639\u0644\u064A\u0647", "\u0627\u0644\u062E\u062F\u0645\u0629"],
          [
            [{ type: "price", before: 100, after: 50 }, "\u062A\u0646\u0633\u064A\u0642 \u0645\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 ATS + \u0635\u064A\u0627\u063A\u0629 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 + \u0631\u0633\u0627\u0644\u0629 \u062A\u0639\u0631\u064A\u0641 + \u062A\u0639\u062F\u064A\u0644\u0627\u0646 \u0645\u062C\u0627\u0646\u064A\u0627\u064B", "\u0633\u064A\u0631\u0629 \u0630\u0627\u062A\u064A\u0629 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629"],
            [{ type: "price", before: 300, after: 150 }, "\u0645\u0648\u0642\u0639\u0643\u0645 \u0627\u0644\u0634\u062E\u0635\u064A \u0643\u0633\u064A\u0631\u0629 \u0630\u0627\u062A\u064A\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 + \u0631\u0627\u0628\u0637 \u0644\u0644\u0645\u0634\u0627\u0631\u0643\u0629 + \u0645\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 \u0627\u0644\u062C\u0648\u0627\u0644 + \u062A\u0648\u0627\u0635\u0644 \u0628\u0636\u063A\u0637\u0629 \u0648\u0627\u062D\u062F\u0629", "\u0628\u0637\u0627\u0642\u0629 \u0631\u0642\u0645\u064A\u0629 (\u0645\u0648\u0642\u0639)"],
          ],
          [25, 50, 25]
        ),

        // ── Section 5: Add-ons ──
        sectionHeading("\u062E\u062F\u0645\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629"),
        makeTable(
          ["\u0627\u0644\u0633\u0639\u0631", "\u0627\u0644\u0648\u0635\u0641", "\u0627\u0644\u062E\u062F\u0645\u0629"],
          [
            [{ type: "price", before: 200, after: 100 }, "\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0646 \u0627\u0644\u0623\u0648\u0631\u0627\u0642 \u0648\u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0625\u0644\u0649 \u062C\u062F\u0627\u0648\u0644 \u0646\u0638\u064A\u0641\u0629", "\u0625\u062F\u062E\u0627\u0644 \u0648\u062A\u0646\u0638\u064A\u0641 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A"],
            [{ type: "price", before: 150, after: 75 }, "\u062A\u0633\u0644\u064A\u0645 \u062A\u0642\u0631\u064A\u0631\u0643\u0645 \u0623\u0648 \u0646\u0638\u0627\u0645\u0643\u0645 \u062E\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629", "\u062A\u0633\u0644\u064A\u0645 \u0639\u0627\u062C\u0644 \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u064A\u0648\u0645"],
            [{ type: "price", before: 200, after: 100 }, "\u062C\u0645\u064A\u0639 \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0645\u062A\u0627\u062D\u0629 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0648\u0643\u0644\u062A\u0627\u0647\u0645\u0627", "\u062A\u0642\u0631\u064A\u0631 \u062B\u0646\u0627\u0626\u064A \u0627\u0644\u0644\u063A\u0629"],
            [{ type: "price", before: 0, after: 0 }, "\u0627\u062A\u0641\u0627\u0642\u064A\u0629 \u0633\u0631\u064A\u0629 \u0645\u0648\u0642\u0639\u0629 \u0644\u0631\u0627\u062D\u062A\u0643\u0645", "\u0627\u062A\u0641\u0627\u0642\u064A\u0629 \u0627\u0644\u0633\u0631\u064A\u0629 (NDA)"],
          ],
          [25, 45, 30]
        ),

        // ── How It Works ──
        sectionHeading("\u0643\u064A\u0641 \u062A\u062A\u0645 \u0627\u0644\u0639\u0645\u0644\u064A\u0629"),
        new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: bidi, spacing: { after: 80 }, children: [
          new TextRun({ text: "\u0627\u0644\u062E\u0637\u0648\u0629 1:  ", bold: true, size: 20, color: P.primary, font: arabicFont, rightToLeft: true }),
          new TextRun({ text: "\u0631\u0627\u0633\u0644\u0648\u0646\u064A \u0639\u0644\u0649 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0648\u0623\u062E\u0628\u0631\u0648\u0646\u064A \u0639\u0646 \u0645\u0634\u0631\u0648\u0639\u0643\u0645 \u0648\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A\u0643\u0645.", size: 20, color: P.body, font: arabicFont, rightToLeft: true }),
        ]}),
        new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: bidi, spacing: { after: 80 }, children: [
          new TextRun({ text: "\u0627\u0644\u062E\u0637\u0648\u0629 2:  ", bold: true, size: 20, color: P.primary, font: arabicFont, rightToLeft: true }),
          new TextRun({ text: "\u0623\u0628\u0646\u064A \u0644\u0643\u0645 \u062A\u0642\u0631\u064A\u0631\u0643\u0645 \u0623\u0648 \u0646\u0638\u0627\u0645\u0643\u0645 \u0623\u0648 \u0633\u064A\u0631\u062A\u0643\u0645 \u0627\u0644\u0630\u0627\u062A\u064A\u0629 \u0623\u0648 \u0628\u0637\u0627\u0642\u062A\u0643\u0645 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u062E\u0644\u0627\u0644 \u0627\u0644\u0645\u062F\u0629 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647\u0627.", size: 20, color: P.body, font: arabicFont, rightToLeft: true }),
        ]}),
        new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: bidi, spacing: { after: 80 }, children: [
          new TextRun({ text: "\u0627\u0644\u062E\u0637\u0648\u0629 3:  ", bold: true, size: 20, color: P.primary, font: arabicFont, rightToLeft: true }),
          new TextRun({ text: "\u062A\u0631\u0627\u062C\u0639\u0648\u0646 \u0627\u0644\u0639\u0645\u0644 \u0648\u062A\u0637\u0644\u0628\u0648\u0646 \u0623\u064A \u062A\u0639\u062F\u064A\u0644\u0627\u062A \u0623\u0648 \u062A\u0639\u062F\u064A\u0644\u0627\u062A.", size: 20, color: P.body, font: arabicFont, rightToLeft: true }),
        ]}),
        new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: bidi, spacing: { after: 80 }, children: [
          new TextRun({ text: "\u0627\u0644\u062E\u0637\u0648\u0629 4:  ", bold: true, size: 20, color: P.primary, font: arabicFont, rightToLeft: true }),
          new TextRun({ text: "\u062A\u0633\u062A\u0644\u0645\u0648\u0646 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0646\u0647\u0627\u0626\u064A \u2014 \u062C\u0627\u0647\u0632 \u0644\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645. \u0627\u0644\u062F\u0641\u0639 \u0628\u0639\u062F \u0631\u0636\u0627\u0643\u0645.", size: 20, color: P.body, font: arabicFont, rightToLeft: true }),
        ]}),

        // ── Trust ──
        sectionHeading("\u0644\u0645\u0627\u0630\u0627 \u062A\u062B\u0642\u0648\u0646 \u0628\u064A"),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: bidi,
          spacing: { after: 60 },
          children: [new TextRun({ text: "\u0623\u0646\u0627 \u0645\u0639\u0644\u0645 \u0648\u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0642\u064A\u0645 \u0641\u064A \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A. \u0627\u0644\u062F\u0642\u0629 \u0648\u0627\u0644\u0633\u0631\u064A\u0629 \u0648\u0627\u0644\u0645\u0648\u062B\u0648\u0642\u064A\u0629 \u0644\u064A\u0633\u062A \u0645\u062C\u0631\u062F \u0645\u0647\u0627\u0631\u0627\u062A \u2014 \u0625\u0646\u0647\u0627 \u0645\u0647\u0646\u062A\u064A. \u0643\u0644 \u0639\u0645\u064A\u0644 \u064A\u062D\u0635\u0644 \u0639\u0644\u0649 \u0627\u062A\u0641\u0627\u0642\u064A\u0629 \u0633\u0631\u064A\u0629 \u0645\u0648\u0642\u0639\u0629. \u0644\u0627 \u0623\u0637\u0644\u0628 \u0623\u0628\u062F\u064B\u0627 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0628\u0646\u0643\u064A\u0629 \u0623\u0648 \u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0645\u0631\u0648\u0631. \u0628\u064A\u0627\u0646\u0627\u062A\u0643\u0645 \u062A\u0628\u0642\u0649 \u0622\u0645\u0646\u0629 \u0648\u062E\u0627\u0635\u0629 \u062A\u0645\u0627\u0645\u0627\u064B. \u0627\u0644\u062F\u0641\u0639 \u0641\u0642\u0637 \u0628\u0639\u062F \u0645\u0631\u0627\u062C\u0639\u062A\u0643\u0645 \u0648\u0645\u0648\u0627\u0641\u0642\u062A\u0643\u0645.", size: 19, color: P.secondary, font: arabicFont, rightToLeft: true })]
        }),

        // ── Guarantee ──
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 60 },
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 10 }, bottom: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 10 } },
          indent: { left: 1000, right: 1000 },
          children: [
            new TextRun({ text: "\u0636\u0645\u0627\u0646 \u0627\u0644\u0631\u0636\u0627\u0621 100%  \u2014  \u062A\u0639\u062F\u064A\u0644\u0627\u062A \u0645\u062C\u0627\u0646\u064A\u0629  \u2014  \u0627\u062F\u0641\u0639\u0648\u0627 \u0641\u0642\u0637 \u0628\u0639\u062F \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629", bold: true, size: 22, color: P.primary, font: arabicFont, rightToLeft: true }),
          ]
        }),

        // ── Contact ──
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 60 },
          bidirectional: bidi,
          children: [
            new TextRun({ text: "\u0627\u062D\u0635\u0644\u0648\u0627 \u0639\u0644\u0649 \u0627\u0633\u062A\u0634\u0627\u0631\u0629 \u0645\u062C\u0627\u0646\u064A\u0629 \u0627\u0644\u064A\u0648\u0645", bold: true, size: 24, color: P.primary, font: arabicFont, rightToLeft: true }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          bidirectional: bidi,
          children: [
            new TextRun({ text: "\u0648\u0627\u062A\u0633\u0627\u0628: ", size: 20, color: P.body, font: arabicFont, rightToLeft: true }),
            new TextRun({ text: "[\u0631\u0642\u0645\u0643]", size: 20, color: P.primary, font: arabicFont, bold: true, rightToLeft: true }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "ahmed-ali-ops.vercel.app", size: 20, color: P.primary, font: { ascii: "Calibri" }, bold: true }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          bidirectional: bidi,
          children: [
            new TextRun({ text: "\u0646\u062E\u062F\u0645 \u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639 \u0641\u064A \u062C\u0645\u064A\u0639 \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u2014 \u062F\u0628\u064A\u060C \u0623\u0628\u0648 \u0638\u0628\u064A\u060C \u0627\u0644\u0634\u0627\u0631\u0642\u0629\u060C \u0639\u062C\u0645\u0627\u0646\u060C \u0631\u0623\u0633 \u0627\u0644\u062E\u064A\u0645\u0629\u060C \u0627\u0644\u0641\u062C\u064A\u0631\u0629\u060C \u0623\u0645 \u0627\u0644\u0642\u064A\u0648\u064A\u0646", size: 18, color: P.secondary, font: arabicFont, italics: true, rightToLeft: true }),
          ]
        }),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/download/Service_Price_List_Arabic.docx", buf);
  console.log("Arabic DOCX created successfully!");
});
