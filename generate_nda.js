const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Footer, PageNumber, AlignmentType, WidthType, BorderStyle,
} = require("docx");
const fs = require("fs");

// ── Helpers ──────────────────────────────────────────────────────────
function safeText(value, placeholder) {
  if (value === undefined || value === null || value === "" || String(value) === "NaN" || String(value) === "undefined") {
    return placeholder || "【Please fill in】";
  }
  return String(value);
}

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };

// Font configuration
const fontBody = { ascii: "Times New Roman", eastAsia: "SimHei" };
const fontTitle = { ascii: "Times New Roman", eastAsia: "SimHei" };
const fontHeading = { ascii: "Times New Roman", eastAsia: "SimHei" };

// ── Paragraph builders ───────────────────────────────────────────────

// English body paragraph: justified, first-line indent 480, line 360
function enPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 80 },
    indent: { firstLine: 480 },
    ...opts,
    children: [
      new TextRun({
        text,
        size: 24,
        font: fontBody,
        color: "000000",
        ...(opts.runOpts || {}),
      }),
    ],
  });
}

// Arabic body paragraph: right-aligned, first-line indent 480, line 360
function arPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { line: 360, after: 120 },
    indent: { firstLine: 480 },
    ...opts,
    children: [
      new TextRun({
        text,
        size: 24,
        font: fontBody,
        color: "000000",
        ...(opts.runOpts || {}),
      }),
    ],
  });
}

// Clause heading: bold, size 24, SimHei
function clauseHeading(enText, arText) {
  return [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 300, after: 80, line: 360 },
      children: [
        new TextRun({
          text: enText,
          size: 24,
          bold: true,
          font: fontHeading,
          color: "000000",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 80, line: 360 },
      children: [
        new TextRun({
          text: arText,
          size: 24,
          bold: true,
          font: fontHeading,
          color: "000000",
        }),
      ],
    }),
  ];
}

// Bilingual clause body (English then Arabic)
function biClause(enText, arText) {
  return [enPara(enText), arPara(arText)];
}

// ── Document Content ─────────────────────────────────────────────────

const children = [];

// ── 1. Title ──────────────────────────────────────────────────────
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 60, line: Math.ceil(22 * 23), lineRule: "atLeast" },
    children: [
      new TextRun({
        text: "Non-Disclosure Agreement",
        size: 44,
        bold: true,
        font: fontTitle,
        color: "000000",
      }),
    ],
  })
);
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, line: Math.ceil(22 * 23), lineRule: "atLeast" },
    children: [
      new TextRun({
        text: "اتفاقية عدم الإفصاح",
        size: 44,
        bold: true,
        font: fontTitle,
        color: "000000",
      }),
    ],
  })
);

// ── 2. Parties ────────────────────────────────────────────────────
children.push(...clauseHeading(
  "Article 1 — Parties",
  "المادة ١ — الأطراف"
));

children.push(...biClause(
  "This Non-Disclosure Agreement (the \"Agreement\") is entered into on 【____/____/____】 by and between:",
  "تم إبرام اتفاقية عدم الإفصاح هذه (\"الاتفاقية\") بتاريخ 【____/____/____】 بين كل من:"
));

// Party A - Analyst info table
const partyAFields = [
  ["Name / الاسم", "Ahmed Ali / أحمد علي"],
  ["Title / المسمى الوظيفي", "Data Analyst / محلل بيانات"],
  ["Nationality / الجنسية", "UAE / الإمارات العربية المتحدة"],
  ["Emirates ID / الهوية الإماراتية", "【Please fill in: Emirates ID】"],
  ["Address / العنوان", "【Please fill in: Address】"],
];
const partyBFields = [
  ["Name / الاسم", "【Please fill in: Client Name】"],
  ["Title / المسمى الوظيفي", "【Please fill in: Client Title】"],
  ["Nationality / الجنسية", "【Please fill in: Nationality】"],
  ["Emirates ID / الهوية الإماراتية", "【Please fill in: Emirates ID】"],
  ["Address / العنوان", "【Please fill in: Address】"],
];

function buildPartyTable(label, labelAr, fields) {
  const rows = [];
  // Header row
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          borders: noBorders,
          margins: { top: 80, bottom: 60, left: 420, right: 120 },
          children: [
            new Paragraph({
              spacing: { after: 40, line: 360 },
              children: [
                new TextRun({
                  text: `${label}:`,
                  size: 24,
                  bold: true,
                  font: fontBody,
                  color: "000000",
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 40, line: 360 },
              children: [
                new TextRun({
                  text: `${labelAr}:`,
                  size: 24,
                  bold: true,
                  font: fontBody,
                  color: "000000",
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );
  // Field rows
  for (const [lbl, val] of fields) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: noBorders,
            margins: { top: 40, bottom: 40, left: 420, right: 60 },
            children: [
              new Paragraph({
                spacing: { line: 360 },
                children: [
                  new TextRun({
                    text: `${lbl}:`,
                    size: 24,
                    font: fontBody,
                    color: "000000",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: noBorders,
            margins: { top: 40, bottom: 40, left: 60, right: 120 },
            children: [
              new Paragraph({
                spacing: { line: 360 },
                children: [
                  new TextRun({
                    text: safeText(val, `【Please fill in: ${lbl}】`),
                    size: 24,
                    font: fontBody,
                    color: "000000",
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }
  return new Table({
    width: { size: 90, type: WidthType.PERCENTAGE },
    borders: { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB },
    rows,
  });
}

children.push(buildPartyTable("Party A — The Analyst (First Party)", "الطرف أ — المحلل (الطرف الأول)", partyAFields));
children.push(new Paragraph({ spacing: { after: 120 } }));
children.push(buildPartyTable("Party B — The Client (Second Party)", "الطرف ب — العميل (الطرف الثاني)", partyBFields));
children.push(new Paragraph({ spacing: { after: 120 } }));

children.push(...biClause(
  "Party A and Party B are hereinafter individually referred to as a \"Party\" and collectively as the \"Parties\".",
  "يُشار إلى الطرف أ والطرف ب هناينا فرادى بـ \"الطرف\" ومجتمعين بـ \"الطرفين\"."
));

// ── 3. Recitals ───────────────────────────────────────────────────
children.push(...clauseHeading(
  "Article 2 — Recitals",
  "المادة ٢ — الديباجة"
));

children.push(...biClause(
  "WHEREAS, Party A is a data analyst based in the United Arab Emirates who provides data analysis and reporting services to small businesses;",
  "حيث أن الطرف أ هو محلل بيانات مقره الإمارات العربية المتحدة ويقدم خدمات تحليل البيانات وإعداد التقارير للشركات الصغيرة؛"
));

children.push(...biClause(
  "WHEREAS, Party B (the \"Client\") engages Party A to perform data analysis and reporting services and, in connection therewith, may disclose certain confidential and proprietary information to Party A;",
  "حيث أن الطرف ب (\"العميل\") يتعاقد مع الطرف أ لأداء خدمات تحليل البيانات وإعداد التقارير، وبما يتصل بذلك، قد يفصح عن معلومات سرية وخاصة معينة للطرف أ؛"
));

children.push(...biClause(
  "WHEREAS, the Parties wish to establish the terms and conditions under which Confidential Information may be disclosed and to protect such Confidential Information from unauthorized use or disclosure;",
  "حيث أن الطرفين يرغبان في إرسال الشروط والأحكام التي يجوز بموجبها الإفصاح عن المعلومات السرية وحماية تلك المعلومات من الاستخدام أو الإفصاح غير المصرح به؛"
));

children.push(...biClause(
  "NOW, THEREFORE, in consideration of the mutual covenants and promises contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:",
  "الآن، لذلك، نظير الوعود والالتزامات المتبادلة الواردة هنا، وللمقابل الجيد والقيم، الذي يقر الطرفان باستلامه وكفايته بموجب هذه الاتفاقية، يتفق الطرفان على ما يلي:"
));

// ── 4. Definition of Confidential Information ─────────────────────
children.push(...clauseHeading(
  "Article 3 — Definition of Confidential Information",
  "المادة ٣ — تعريف المعلومات السرية"
));

children.push(...biClause(
  "3.1 For the purposes of this Agreement, \"Confidential Information\" shall mean all non-public information, whether written, oral, electronic, or in any other form, that is disclosed by the Client to the Analyst, or to which the Analyst gains access in connection with the services performed under this Agreement, regardless of whether such information is expressly marked as \"confidential\" or \"proprietary.\"",
  "٣.١ لأغراض هذه الاتفاقية، يُقصد بـ \"المعلومات السرية\" جميع المعلومات غير العامة، سواء كانت مكتوبة أو شفهية أو إلكترونية أو بأي شكل آخر، التي يفصح عنها العميل للمحلل، أو التي يحصل المحلل على حق الوصول إليها فيما يتصل بالخدمات المؤداة بموجب هذه الاتفاقية، بغض النظر عما إذا كانت هذه المعلومات مميزة صراحة بوصفها \"سرية\" أو \"خاصة.\""
));

children.push(...biClause(
  "3.2 Without limiting the generality of the foregoing, Confidential Information shall include, but not be limited to, the following categories of information:",
  "٣.٢ دون تقييد لعموم ما سبق، تشمل المعلومات السرية، على سبيل المثال لا الحصر، فئات المعلومات التالية:"
));

// List items as paragraphs
const confidentialItems = [
  ["Financial records, statements, and projections", "السجلات والبيانات والتوقعات المالية"],
  ["Business data, operational data, and internal reports", "بيانات الأعمال والبيانات التشغيلية والتقارير الداخلية"],
  ["Sales figures, revenue data, and performance metrics", "أرقام المبيعات وبيانات الإيرادات ومؤشرات الأداء"],
  ["Customer information, including names, contact details, preferences, and purchase history", "معلومات العملاء، بما في ذلك الأسماء وتفاصيل الاتصال والتفضيلات وسجل المشتريات"],
  ["Supplier details, vendor contracts, and procurement terms", "تفاصيل الموردين وعقود البائعين وشروط المشتريات"],
  ["Pricing structures, discount policies, and profit margins", "هياكل التسعير وسياسات الخصم وهوامش الربح"],
  ["Trade secrets, proprietary methodologies, and know-how", "الأسرار التجارية والمنهجيات الخاصة والمعرفة الفنية"],
  ["Business strategies, marketing plans, and competitive analyses", "استراتيجيات الأعمال وخطط التسويق وتحليلات المنافسة"],
  ["Spreadsheets, databases, data models, and analytical outputs", "جداول البيانات وقواعد البيانات ونماذج البيانات ومخرجات التحليل"],
  ["Any other information that a reasonable person would understand to be confidential given the nature of the information or the circumstances of disclosure", "أي معلومات أخرى يفهم شخص معقول أنها سرية نظرًا لطبيعة المعلومات أو ظروف الإفصاح"],
];

for (const [en, ar] of confidentialItems) {
  children.push(enPara(`( ${confidentialItems.indexOf([en,ar]) + 1} )  ${en}`, { indent: { firstLine: 480, left: 480 } }));
  children.push(arPara(`${ar}  (${confidentialItems.indexOf([en,ar]) + 1})`, { indent: { firstLine: 480, left: 480 } }));
}

// Fix the numbering - regenerate with correct indices
// Remove the last 20 paragraphs (10 pairs) and redo
children.splice(children.length - 20, 20);

for (let i = 0; i < confidentialItems.length; i++) {
  const [en, ar] = confidentialItems[i];
  children.push(enPara(`(${i + 1}) ${en}`, { indent: { firstLine: 480, left: 480 } }));
  children.push(arPara(`${ar} (${i + 1})`, { indent: { firstLine: 480, left: 480 } }));
}

children.push(...biClause(
  "3.3 The Analyst acknowledges that Confidential Information constitutes a valuable asset of the Client and that any unauthorized disclosure or use thereof may cause irreparable harm to the Client.",
  "٣.٣ يقر المحلل أن المعلومات السرية تشكل أصولاً قيمة للعميل وأن أي إفصاح أو استخدام غير مصرح به قد يسبب ضرراً لا يمكن إصلاحه للعميل."
));

// ── 5. Confidentiality Obligations ────────────────────────────────
children.push(...clauseHeading(
  "Article 4 — Confidentiality Obligations",
  "المادة ٤ — التزامات السرية"
));

children.push(...biClause(
  "4.1 The Analyst shall maintain strict confidence with respect to all Confidential Information and shall not, directly or indirectly, disclose, communicate, publish, or otherwise make available any Confidential Information to any third party without the prior written consent of the Client.",
  "٤.١ يلتزم المحلل بالحفاظ على سرية تامة فيما يتعلق بجميع المعلومات السرية ولا يجوز له، بصورة مباشرة أو غير مباشرة، الإفصاح عن أي معلومات سرية أو إبلاغها أو نشرها أو إتاحتها بأي طريقة أخرى لأي طرف ثالث دون موافقة كتابية مسبقة من العميل."
));

children.push(...biClause(
  "4.2 The Analyst shall use the Confidential Information solely for the purpose of providing the agreed data analysis and reporting services to the Client and for no other purpose whatsoever.",
  "٤.٢ يستخدم المحلل المعلومات السرية فقط لغرض تقديم خدمات تحليل البيانات وإعداد التقارير المتفق عليها للعميل ولا لأي غرض آخر على الإطلاق."
));

children.push(...biClause(
  "4.3 The Analyst shall not copy, reproduce, duplicate, or store any Confidential Information beyond what is reasonably necessary for the performance of the agreed services.",
  "٤.٣ لا يجوز للمحلل نسخ أو إعادة إنتاج أو تكرار أو تخزين أي معلومات سرية بما يتجاوز ما هو ضروري بشكل معقول لأداء الخدمات المتفق عليها."
));

children.push(...biClause(
  "4.4 The Analyst shall implement and maintain appropriate technical and organizational security measures to protect Confidential Information against unauthorized access, use, disclosure, alteration, or destruction, including but not limited to:",
  "٤.٤ يلتزم المحلل باتخاذ والحفاظ على تدابير أمنية تقنية وتنظيمية مناسبة لحماية المعلومات السرية من الوصول غير المصرح به أو الاستخدام أو الإفصاح أو التعديل أو الإتلاف، بما في ذلك على سبيل المثال لا الحصر:"
));

const securityItems = [
  ["Storing all Confidential Information in encrypted storage only", "تخزين جميع المعلومات السرية في تخزين مشفر فقط"],
  ["Never sharing login credentials, passwords, or access tokens with any third party", "عدم مشاركة بيانات تسجيل الدخول أو كلمات المرور أو رموز الوصول مع أي طرف ثالث"],
  ["Accepting data only via secure transfer methods (encrypted email, SFTP, secure cloud portals, or equivalent)", "قبول البيانات فقط عبر طرق النقل الآمنة (البريد الإلكتروني المشفر أو بروتوكول SFTP أو بوابات السحابة الآمنة أو ما يعادلها)"],
  ["Restricting access to Confidential Information to authorized personnel on a strict need-to-know basis", "تقييد الوصول إلى المعلومات السرية على الموظفين المصرح لهم على أساس الحاجة إلى المعرفة فقط"],
];

for (let i = 0; i < securityItems.length; i++) {
  const [en, ar] = securityItems[i];
  children.push(enPara(`(${i + 1}) ${en}`, { indent: { firstLine: 480, left: 480 } }));
  children.push(arPara(`${ar} (${i + 1})`, { indent: { firstLine: 480, left: 480 } }));
}

children.push(...biClause(
  "4.5 The Analyst shall promptly notify the Client in writing upon becoming aware of any actual or suspected unauthorized access, use, disclosure, or loss of Confidential Information and shall cooperate fully with the Client in investigating and mitigating any such breach.",
  "٤.٥ يُبلغ المحلل العميل فوراً كتابياً عند علمه بأي وصول أو استخدام أو إفصاح أو فقدان فعلي أو مشتبه به غير مصرح به للمعلومات السرية ويتعاون بالكامل مع العميل في التحقيق في أي خرق والحد من آثاره."
));

children.push(...biClause(
  "4.6 The Client retains full ownership of all Confidential Information at all times. No license, right, title, or interest in or to the Confidential Information is transferred to the Analyst by virtue of this Agreement or any disclosure hereunder.",
  "٤.٦ يحتفظ العميل بالملكية الكاملة لجميع المعلومات السرية في جميع الأوقات. لا تنتقل أي ترخيص أو حق أو ملكية أو مصلحة في المعلومات السرية أو إليها إلى المحلل بحكم هذه الاتفاقية أو أي إفصاح بموجبها."
));

// ── 6. Use Restrictions ───────────────────────────────────────────
children.push(...clauseHeading(
  "Article 5 — Use Restrictions",
  "المادة ٥ — قيود الاستخدام"
));

children.push(...biClause(
  "5.1 The Analyst shall not use Confidential Information for the Analyst's own benefit or for the benefit of any third party.",
  "٥.١ لا يجوز للمحلل استخدام المعلومات السرية لمنفعة المحلل نفسه أو لمنفعة أي طرف ثالث."
));

children.push(...biClause(
  "5.2 The Analyst shall not retain any copies, extracts, summaries, or derivatives of Confidential Information after the completion or termination of the engagement, except as expressly authorized in writing by the Client.",
  "٥.٢ لا يجوز للمحلل الاحتفاظ بأي نسخ أو مقتطفات أو ملخصات أو مشتقات من المعلومات السرية بعد إتمام أو إنهاء التعاقد، إلا بتفويض كتابي صريح من العميل."
));

children.push(...biClause(
  "5.3 The Analyst shall not reverse-engineer, decompile, or disassemble any software, database, or system provided by the Client in connection with the Confidential Information.",
  "٥.٣ لا يجوز للمحلل إجراء الهندسة العكسية أو فك الترجمة أو تفكيك أي برنامج أو قاعدة بيانات أو نظام يقدمه العميل فيما يتعلق بالمعلومات السرية."
));

children.push(...biClause(
  "5.4 The Analyst shall not incorporate any Confidential Information into any product, service, or deliverable provided to a third party.",
  "٥.٤ لا يجوز للمحلل إدراج أي معلومات سرية في أي منتج أو خدمة أو مخرجات يقدمها لطرف ثالث."
));

children.push(...biClause(
  "5.5 The Analyst shall not share any analytical results, findings, or reports derived from Confidential Information with any party other than the Client, unless expressly authorized in writing.",
  "٥.٥ لا يجوز للمحلل مشاركة أي نتائج تحليلية أو نتائج أو تقارير مستمدة من المعلومات السرية مع أي طرف آخر غير العميل، ما لم يصرح بذلك كتابياً."
));

// ── 7. Return, Deletion & Destruction of Information ──────────────
children.push(...clauseHeading(
  "Article 6 — Return, Deletion & Destruction of Information",
  "المادة ٦ — إعادة وحذف وإتلاف المعلومات"
));

children.push(...biClause(
  "6.1 Upon the completion, termination, or expiration of the engagement, or upon the written request of the Client at any time, the Analyst shall promptly, and in any event within seven (7) calendar days:",
  "٦.١ عند إتمام أو إنهاء أو انتهاء التعاقد، أو بناءً على طلب كتابي من العميل في أي وقت، يلتزم المحلل فوراً، وفي جميع الأحوال خلال سبعة (٧) أيام تقويمية:"
));

const returnItems = [
  ["Return to the Client all original documents, copies, and physical media containing Confidential Information;", "إعادة العميل جميع الوثائق الأصلية والنسخ ووسائط التخزين المادية التي تحتوي على معلومات سرية؛"],
  ["Permanently delete and destroy all electronic copies of Confidential Information from all devices, systems, cloud storage, and backup facilities under the Analyst's control;", "حذف وإتلاف جميع النسخ الإلكترونية من المعلومات السرية بشكل دائم من جميع الأجهزة والأنظمة والتخزين السحابي ومرافق النسخ الاحتياطي الخاضعة لسيطرة المحلل؛"],
  ["Ensure that no Confidential Information remains in any temporary files, cache memory, recycle bins, or other storage locations;", "التأكد من عدم بقاء أي معلومات سرية في أي ملفات مؤقتة أو ذاكرة التخزين المؤقت أو سلات المحذوفات أو مواقع التخزين الأخرى؛"],
  ["Provide the Client with a written certification confirming the complete return, deletion, and destruction of all Confidential Information.", "تقديم شهادة كتابية للعميل تؤكد الإرجاع والحذف والإتلاف الكامل لجميع المعلومات السرية."],
];

for (let i = 0; i < returnItems.length; i++) {
  const [en, ar] = returnItems[i];
  children.push(enPara(`(${i + 1}) ${en}`, { indent: { firstLine: 480, left: 480 } }));
  children.push(arPara(`${ar} (${i + 1})`, { indent: { firstLine: 480, left: 480 } }));
}

children.push(...biClause(
  "6.2 The Analyst shall not retain any Confidential Information after the engagement, whether in whole or in part, for any purpose whatsoever, including archival, backup, or reference purposes, unless expressly authorized in writing by the Client.",
  "٦.٢ لا يجوز للمحلل الاحتفاظ بأي معلومات سرية بعد التعاقد، سواء كلياً أو جزئياً، لأي غرض على الإطلاق، بما في ذلك أغراض الأرشفة أو النسخ الاحتياطي أو المرجعية، ما لم يصرح بذلك كتابياً من العميل."
));

// ── 8. Exceptions ─────────────────────────────────────────────────
children.push(...clauseHeading(
  "Article 7 — Exceptions",
  "المادة ٧ — الاستثناءات"
));

children.push(...biClause(
  "The obligations under this Agreement shall not apply to information that the Analyst can demonstrate by competent written evidence:",
  "لا تسري الالتزامات بموجب هذه الاتفاقية على المعلومات التي يمكن للمحلل إثباتها بأدلة كتابية صالحة:"
));

const exceptionItems = [
  ["Was publicly available at the time of disclosure or subsequently became publicly available through no fault, action, or omission of the Analyst;", "كانت متاحة للجمهور وقت الإفصاح أو أصبحت متاحة للجمهور لاحقاً دون أي خطأ أو فعل أو إغفال من المحلل؛"],
  ["Was already in the lawful possession of the Analyst prior to disclosure by the Client, as evidenced by the Analyst's pre-existing records;", "كانت في حيازة المحلل المشروعة قبل الإفصاح من قبل العميل، كما تثبت سجلات المحلل السابقة؛"],
  ["Was independently developed by the Analyst without reference to, reliance upon, or use of the Confidential Information;", "تم تطويرها بشكل مستقل من قبل المحلل دون الإشارة إلى المعلومات السرية أو الاعتماد عليها أو استخدامها؛"],
  ["Was rightfully received from a third party who had the legal right to disclose such information without restriction;", "تم استلامها بشكل مشروع من طرف ثالث كان لديه الحق القانوني في الإفصاح عن هذه المعلومات دون قيود؛"],
  ["Is required to be disclosed by applicable law, regulation, or court order, provided that the Analyst gives the Client prompt written notice of such requirement and cooperates with the Client in seeking protective measures.", "مطلوب الإفصاح عنها بموجب القانون أو اللوائح أو أمر المحكمة المعمول بها، بشرط أن يُبلغ المحلل العميل فوراً كتابياً بهذا المطلب ويتعاون مع العميل في السعي لاتخاذ تدابير وقائية."],
];

for (let i = 0; i < exceptionItems.length; i++) {
  const [en, ar] = exceptionItems[i];
  children.push(enPara(`(${i + 1}) ${en}`, { indent: { firstLine: 480, left: 480 } }));
  children.push(arPara(`${ar} (${i + 1})`, { indent: { firstLine: 480, left: 480 } }));
}

// ── 9. Confidentiality Period ─────────────────────────────────────
children.push(...clauseHeading(
  "Article 8 — Confidentiality Period",
  "المادة ٨ — مدة السرية"
));

children.push(...biClause(
  "8.1 This Agreement shall remain in effect for a period of two (2) years from the date of its execution (the \"Term\").",
  "٨.١ تظل هذه الاتفاقية سارية المفعول لمدة سنتين (٢) من تاريخ إبرامها (\"المدة\")."
));

children.push(...biClause(
  "8.2 Notwithstanding the expiration or termination of this Agreement, the Analyst's obligations of confidentiality and non-use with respect to Confidential Information shall survive for a period of three (3) years from the date of termination or expiration of this Agreement.",
  "٨.٢ على الرغم من انتهاء أو إنهاء هذه الاتفاقية، تظل التزامات المحلل بالسرية وعدم الاستخدام فيما يتعلق بالمعلومات السرية سارية لمدة ثلاث (٣) سنوات من تاريخ إنهاء أو انتهاء هذه الاتفاقية."
));

children.push(...biClause(
  "8.3 The survival period under Clause 8.2 shall apply to all Confidential Information disclosed during the Term, regardless of the date on which such information was disclosed.",
  "٨.٣ تسري فترة البقاء بموجب البند ٨.٢ على جميع المعلومات السرية المفصح عنها خلال المدة، بغض النظر عن تاريخ الإفصاح عن هذه المعلومات."
));

// ── 10. Liability for Breach ──────────────────────────────────────
children.push(...clauseHeading(
  "Article 9 — Liability for Breach",
  "المادة ٩ — المسؤولية عن الإخلال"
));

children.push(...biClause(
  "9.1 The Analyst acknowledges that any breach of this Agreement may cause irreparable harm to the Client for which monetary damages alone would be an insufficient remedy.",
  "٩.١ يقر المحلل بأن أي إخلال بهذه الاتفاقية قد يسبب ضرراً لا يمكن إصلاحه للعميل لا تكفي التعويضات المالية وحدها لمعالجته."
));

children.push(...biClause(
  "9.2 In the event of any actual or threatened breach of this Agreement by the Analyst, the Client shall be entitled to seek injunctive relief and/or specific performance without the necessity of proving actual damages or posting any bond or other security, in addition to any other rights and remedies available at law or in equity.",
  "٩.٢ في حال أي إخلال فعلي أو مهدد بهذه الاتفاقية من قبل المحلل، يحق للعميل الحصول على إغاثة قضائية و/أو تنفيذ عيني دون ضرورة إثبات الأضرار الفعلية أو تقديم أي كفالة أو ضمان آخر، بالإضافة إلى أي حقوق وتعويضات أخرى متاحة بموجب القانون أو مبادئ العدالة."
));

children.push(...biClause(
  "9.3 The Analyst shall be liable for all direct and consequential damages, losses, costs, and expenses (including reasonable legal fees) incurred by the Client as a result of any breach of this Agreement by the Analyst.",
  "٩.٣ يكون المحلل مسؤولاً عن جميع الأضرار المباشرة والتبعية والخسائر والتكاليف والمصروفات (بما في ذلك الأتعاب القانونية المعقولة) التي يتحملها العميل نتيجة أي إخلال من المحلل بهذه الاتفاقية."
));

children.push(...biClause(
  "9.4 The liability of the Analyst under this Article shall not exceed an amount equal to AED One Hundred Thousand (AED 100,000.00) (United Arab Emirates Dirhams One Hundred Thousand) in aggregate for all claims arising under this Agreement, unless the breach constitutes a willful or fraudulent act, in which case liability shall be unlimited.",
  "٩.٤ لا تتجاوز مسؤولية المحلل بموجب هذه المادة مبلغاً يساوي مائة ألف درهم إماراتي (١٠٠٬٠٠٠٫٠٠ درهم إماراتي) (مائة ألف درهم إماراتي) كحد أقصى إجمالي لجميع المطالبات الناشئة بموجب هذه الاتفاقية، ما لم يشكل الإخلال فعلاً متعمداً أو احتيالياً، وفي هذه الحالة تكون المسؤولية غير محدودة."
));

// ── 11. Dispute Resolution ────────────────────────────────────────
children.push(...clauseHeading(
  "Article 10 — Dispute Resolution",
  "المادة ١٠ — تسوية المنازعات"
));

children.push(...biClause(
  "10.1 This Agreement shall be governed by and construed in accordance with the laws of the United Arab Emirates.",
  "١٠.١ تخضع هذه الاتفاقية وتُفسر وفقاً لقوانين الإمارات العربية المتحدة."
));

children.push(...biClause(
  "10.2 Any dispute, controversy, or claim arising out of or relating to this Agreement, including the existence, validity, interpretation, performance, breach, or termination thereof, shall be subject to the exclusive jurisdiction of the competent courts of the United Arab Emirates.",
  "١٠.٢ أي نزاع أو خلاف أو مطالبة ناشئة عن أو تتعلق بهذه الاتفاقية، بما في ذلك وجودها أو صحتها أو تفسيرها أو تنفيذها أو الإخلال بها أو إنهاؤها، يخضع للاختصاص القضائي الحصري للمحاكم المختصة في الإمارات العربية المتحدة."
));

children.push(...biClause(
  "10.3 The Parties shall endeavor to resolve any dispute amicably through good faith negotiation before resorting to litigation. Either Party may initiate such negotiation by providing written notice to the other Party. If the dispute is not resolved within thirty (30) calendar days of such notice, either Party may proceed to file a claim before the competent courts.",
  "١٠.٣ يسعى الطرفان إلى حل أي نزاع ودياً من خلال التفاوض بحسن نية قبل اللجوء إلى التقاضي. يجوز لأي طرف بدء هذه المفاوضات بتقديم إشعار كتابي للطرف الآخر. إذا لم يتم حل النزاع خلال ثلاثين (٣٠) يوماً تقويمياً من تاريخ هذا الإشعار، يجوز لأي طرف المضي قدماً في رفع دعوى أمام المحاكم المختصة."
));

// ── 12. Miscellaneous ─────────────────────────────────────────────
children.push(...clauseHeading(
  "Article 11 — Miscellaneous",
  "المادة ١١ — أحكام متنوعة"
));

children.push(...biClause(
  "11.1 Entire Agreement: This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior discussions, negotiations, and agreements, whether written or oral, relating thereto.",
  "١١.١ الاتفاقية الكاملة: تشكل هذه الاتفاقية الاتفاقية الكاملة بين الطرفين فيما يتعلق بموضوعها وتحل محل جميع المناقشات والمفاوضات والاتفاقيات السابقة، سواء كانت مكتوبة أو شفهية، المتعلقة بها."
));

children.push(...biClause(
  "11.2 Amendments: No amendment, modification, or waiver of any provision of this Agreement shall be effective unless made in writing and signed by both Parties.",
  "١١.٢ التعديلات: لا يسري أي تعديل أو تعديل أو تنازل عن أي حكم من أحكام هذه الاتفاقية ما لم يتم كتابياً وموقعاً من كلا الطرفين."
));

children.push(...biClause(
  "11.3 Severability: If any provision of this Agreement is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such invalidity, illegality, or unenforceability shall not affect the validity or enforceability of the remaining provisions, which shall continue in full force and effect.",
  "١١.٣ القابلية للفصل: إذا قضت محكمة مختصة بأن أي حكم من أحكام هذه الاتفاقية باطل أو غير قانوني أو غير قابل للتنفيذ، فإن هذا البطلان أو عدم القانونية أو عدم القابلية للتنفيذ لا يؤثر على صحة أو قابلية تنفيذ الأحكام المتبقية، التي تظل سارية ونافذة بالكامل."
));

children.push(...biClause(
  "11.4 Waiver: The failure of either Party to enforce any right or provision of this Agreement shall not constitute a waiver of such right or provision. Any waiver must be in writing and signed by the waiving Party.",
  "١١.٤ التنازل: لا يشكل فشل أي طرف في إنفاذ أي حق أو حكم من أحكام هذه الاتفاقية تنازلاً عن هذا الحق أو الحكم. يجب أن يكون أي تنازل كتابياً وموقعاً من الطرف المتنازل."
));

children.push(...biClause(
  "11.5 Assignment: The Analyst shall not assign, transfer, or delegate any rights or obligations under this Agreement to any third party without the prior written consent of the Client.",
  "١١.٥ التنازل: لا يجوز للمحلل التنازل عن أو نقل أو تفويض أي حقوق أو التزامات بموجب هذه الاتفاقية لأي طرف ثالث دون الموافقة الكتابية المسبقة من العميل."
));

children.push(...biClause(
  "11.6 Notices: All notices, requests, demands, and other communications under this Agreement shall be in writing and shall be deemed duly given when delivered personally, sent by registered mail, or transmitted by email to the address specified by each Party.",
  "١١.٦ الإشعارات: يجب أن تكون جميع الإشعارات والطلبات والمطالبات والاتصالات الأخرى بموجب هذه الاتفاقية كتابية وتُعتبر مسلمة بشكل صحيح عند تسليمها شخصياً أو إرسالها بالبريد المسجل أو نقلها بالبريد الإلكتروني إلى العنوان المحدد من كل طرف."
));

children.push(...biClause(
  "11.7 Counterparts: This Agreement may be executed in two or more counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same instrument.",
  "١١.٧ النظائر: يجوز تنفيذ هذه الاتفاقية في نسختين أو أكثر، وتُعتبر كل نسخة أصلية وجميعها معاً تشكل أداة واحدة."
));

children.push(...biClause(
  "11.8 Language: This Agreement is executed in both English and Arabic. In the event of any conflict or inconsistency between the English and Arabic versions, the English version shall prevail.",
  "١١.٨ اللغة: تم إبرام هذه الاتفاقية باللغتين الإنجليزية والعربية. في حال وجود أي تعارض أو تناقض بين النسختين الإنجليزية والعربية، تسود النسخة الإنجليزية."
));

// ── 13. Signature Block ───────────────────────────────────────────
children.push(...clauseHeading(
  "Article 12 — Signature Block",
  "المادة ١٢ — التوقيع"
));

children.push(...biClause(
  "IN WITNESS WHEREOF, the Parties have executed this Non-Disclosure Agreement as of the date first written above.",
  "بموجب هذا، وقع الطرفان على اتفاقية عدم الإفصاح هذه اعتباراً من التاريخ المكتوب أعلاه."
));

// Signature table
const sigFields = [
  ["Party Name / اسم الطرف", "Ahmed Ali / أحمد علي", "【Please fill in: Client Name】"],
  ["Title / المسمى الوظيفي", "Data Analyst / محلل بيانات", "【Please fill in: Client Title】"],
  ["Signature / التوقيع", "", ""],
  ["Date / التاريخ", "【____/____/____】", "【____/____/____】"],
  ["Emirates ID / الهوية الإماراتية", "【Please fill in: Emirates ID】", "【Please fill in: Emirates ID】"],
];

const sigRows = sigFields.map(([label, valA, valB]) => {
  const displayA = valA || "_________________________";
  const displayB = valB || "_________________________";
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: noBorders,
        margins: { top: 100, bottom: 100, left: 120, right: 60 },
        children: [
          new Paragraph({
            spacing: { line: 360 },
            children: [
              new TextRun({ text: `${label}: `, size: 24, font: fontBody, color: "000000" }),
              new TextRun({ text: safeText(displayA, "【Please fill in】"), size: 24, font: fontBody, color: "000000" }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: noBorders,
        margins: { top: 100, bottom: 100, left: 60, right: 120 },
        children: [
          new Paragraph({
            spacing: { line: 360 },
            children: [
              new TextRun({ text: `${label}: `, size: 24, font: fontBody, color: "000000" }),
              new TextRun({ text: safeText(displayB, "【Please fill in】"), size: 24, font: fontBody, color: "000000" }),
            ],
          }),
        ],
      }),
    ],
  });
});

// Add Party A / B headers first
const sigTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: noBorders,
          margins: { top: 120, bottom: 60, left: 120, right: 60 },
          children: [
            new Paragraph({
              spacing: { line: 360 },
              children: [
                new TextRun({ text: "Party A — The Analyst (First Party)", size: 24, bold: true, font: fontBody, color: "000000" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { line: 360 },
              children: [
                new TextRun({ text: "الطرف أ — المحلل (الطرف الأول)", size: 24, bold: true, font: fontBody, color: "000000" }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: noBorders,
          margins: { top: 120, bottom: 60, left: 60, right: 120 },
          children: [
            new Paragraph({
              spacing: { line: 360 },
              children: [
                new TextRun({ text: "Party B — The Client (Second Party)", size: 24, bold: true, font: fontBody, color: "000000" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { line: 360 },
              children: [
                new TextRun({ text: "الطرف ب — العميل (الطرف الثاني)", size: 24, bold: true, font: fontBody, color: "000000" }),
              ],
            }),
          ],
        }),
      ],
    }),
    ...sigRows,
  ],
});

children.push(sigTable);

// ── Build Document ────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: fontBody,
          size: 24,
          color: "000000",
        },
        paragraph: {
          spacing: { line: 360 },
        },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  font: fontBody,
                  color: "000000",
                }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

// ── Export ─────────────────────────────────────────────────────────
const OUTPUT = "/home/z/my-project/download/NDA_Confidentiality_Agreement.docx";
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log("✅ NDA generated successfully:", OUTPUT);
}).catch((err) => {
  console.error("❌ Error generating NDA:", err);
  process.exit(1);
});
