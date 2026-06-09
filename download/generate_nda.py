"""Generate Bilingual NDA / Confidentiality Agreement PDF"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Register fonts
pdfmetrics.registerFont(TTFont('LiberationSerif', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSerif-Bold', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
registerFontFamily('LiberationSerif', normal='LiberationSerif', bold='LiberationSerif-Bold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans-Bold')
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')

# Palette
ACCENT       = colors.HexColor('#27728b')
TEXT_PRIMARY  = colors.HexColor('#1a1b1d')
TEXT_MUTED    = colors.HexColor('#737a7f')
BG_SURFACE   = colors.HexColor('#dbe0e3')

output_path = "/home/z/my-project/download/NDA_Confidentiality_Agreement.pdf"

doc = SimpleDocTemplate(
    output_path, pagesize=A4,
    leftMargin=1.0*inch, rightMargin=1.0*inch,
    topMargin=1.0*inch, bottomMargin=0.8*inch,
)

# Styles
title_style = ParagraphStyle(
    name='Title', fontName='DejaVuSans', fontSize=20, leading=26,
    alignment=TA_CENTER, textColor=ACCENT, spaceAfter=4
)
subtitle_style = ParagraphStyle(
    name='Subtitle', fontName='DejaVuSans', fontSize=10, leading=14,
    alignment=TA_CENTER, textColor=TEXT_MUTED, spaceAfter=16
)
section_en = ParagraphStyle(
    name='SectionEN', fontName='DejaVuSans', fontSize=12, leading=17,
    textColor=ACCENT, spaceBefore=14, spaceAfter=4
)
section_ar = ParagraphStyle(
    name='SectionAR', fontName='NotoSerifSC', fontSize=12, leading=17,
    textColor=ACCENT, spaceBefore=4, spaceAfter=4, alignment=TA_LEFT
)
body_en = ParagraphStyle(
    name='BodyEN', fontName='LiberationSerif', fontSize=10, leading=16,
    alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY, spaceAfter=6
)
body_ar = ParagraphStyle(
    name='BodyAR', fontName='NotoSerifSC', fontSize=10, leading=16,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=6
)
small_style = ParagraphStyle(
    name='Small', fontName='DejaVuSans', fontSize=8, leading=12,
    textColor=TEXT_MUTED, spaceAfter=4, alignment=TA_CENTER
)
sig_style = ParagraphStyle(
    name='Signature', fontName='LiberationSerif', fontSize=10, leading=16,
    textColor=TEXT_PRIMARY, spaceAfter=3
)
sig_head = ParagraphStyle(
    name='SigHead', fontName='DejaVuSans', fontSize=10, leading=16,
    textColor=ACCENT, spaceAfter=3
)

story = []

# Title
story.append(Paragraph('<b>NON-DISCLOSURE / CONFIDENTIALITY AGREEMENT</b>', title_style))
story.append(Paragraph('PRIVATE AND CONFIDENTIAL', subtitle_style))
story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=16))

# Preamble - English
story.append(Paragraph('<b>AGREEMENT</b>', section_en))
story.append(Paragraph(
    'This Non-Disclosure and Confidentiality Agreement (the "Agreement") is entered into on this <b>____</b> day of <b>______________</b>, 20<b>____</b>, by and between:',
    body_en
))
story.append(Spacer(1, 6))
story.append(Paragraph(
    '<b>Real Estate Emperor</b> (hereinafter referred to as the "Analyst"), providing data analysis and reporting services, and',
    body_en
))
story.append(Paragraph(
    '<b>________________________________</b> (hereinafter referred to as the "Client"),',
    body_en
))
story.append(Paragraph(
    '(collectively referred to as the "Parties").',
    body_en
))

# Arabic preamble
story.append(Spacer(1, 6))
story.append(Paragraph('\u0627\u062a\u0641\u0627\u0642\u064a\u0629 \u0627\u0644\u0633\u0631\u064a\u0629 \u0648\u0639\u062f\u0645 \u0627\u0644\u0625\u0641\u0635\u0627\u062d', section_ar))
story.append(Paragraph(
    '\u062a\u064f\u0628\u0631\u0645 \u0647\u0630\u0647 \u0627\u062a\u0641\u0627\u0642\u064a\u0629 \u0627\u0644\u0633\u0631\u064a\u0629 \u0648\u0639\u062f\u0645 \u0627\u0644\u0625\u0641\u0635\u0627\u062d (\u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629) \u0641\u064a \u064a\u0648\u0645 ____ \u0645\u0646 \u0634\u0647\u0631 ______________ \u0633\u0646\u0629 20____\u060c \u0628\u064a\u0646:',
    body_ar
))
story.append(Paragraph(
    '\u0623\u062d\u0645\u062f \u0639\u0644\u064a (\u0627\u0644\u0645\u062d\u0644\u0644)\u060c \u0645\u0642\u062f\u0645 \u062e\u062f\u0645\u0627\u062a \u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631\u060c \u0648 ________________________________ (\u0627\u0644\u0639\u0645\u064a\u0644)',
    body_ar
))

story.append(HRFlowable(width="100%", thickness=0.5, color=BG_SURFACE, spaceAfter=10))

# Section 1
story.append(Paragraph('<b>1. DEFINITION OF CONFIDENTIAL INFORMATION</b>', section_en))
story.append(Paragraph(
    'For the purposes of this Agreement, "Confidential Information" shall mean all financial records, business data, sales figures, customer information, supplier details, pricing structures, trade secrets, business strategies, operational data, spreadsheets, databases, and any other information of a proprietary or sensitive nature that is disclosed by the Client to the Analyst in connection with the data analysis services provided. Confidential Information includes both written and oral disclosures, as well as information stored in electronic format, whether marked as confidential or not.',
    body_en
))
story.append(Paragraph('\u0661. \u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0633\u0631\u064a\u0629', section_ar))
story.append(Paragraph(
    '\u0628\u0645\u0641\u0647\u0648\u0645 \u0647\u0630\u0647 \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629\u060c \u062a\u0639\u0646\u064a "\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0633\u0631\u064a\u0629" \u062c\u0645\u064a\u0639 \u0627\u0644\u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0645\u0627\u0644\u064a\u0629 \u0648\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0648\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a \u0648\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646 \u0648\u0647\u064a\u0627\u0643\u0644 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0623\u0633\u0631\u0627\u0631 \u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0648\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0627\u062a \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0648\u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u064a\u0629 \u0648\u0623\u064a \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0623\u062e\u0631\u0649 \u0630\u0627\u062a \u0637\u0628\u064a\u0639\u0629 \u062e\u0627\u0635\u0629 \u0623\u0648 \u062d\u0633\u0627\u0633\u0629 \u064a\u0641\u0635\u062d \u0639\u0646\u0647\u0627 \u0627\u0644\u0639\u0645\u064a\u0644 \u0644\u0644\u0645\u062d\u0644\u0644 \u0641\u064a \u0627\u0631\u062a\u0628\u0627\u0637 \u0628\u062e\u062f\u0645\u0627\u062a \u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a.',
    body_ar
))

# Section 2
story.append(Paragraph('<b>2. OBLIGATIONS OF THE ANALYST</b>', section_en))
story.append(Paragraph(
    'The Analyst agrees to: (a) maintain all Confidential Information in strict confidence and not disclose it to any third party without the prior written consent of the Client; (b) use the Confidential Information solely for the purpose of providing the agreed-upon data analysis and reporting services; (c) not copy, reproduce, or distribute any Confidential Information except as necessary for the performance of services; (d) implement reasonable security measures to protect Confidential Information from unauthorized access, disclosure, or loss; (e) promptly notify the Client of any actual or suspected unauthorized access to or disclosure of Confidential Information; and (f) return or securely destroy all Confidential Information upon completion of services or upon the Client\'s request, whichever occurs first.',
    body_en
))
story.append(Paragraph('\u0662. \u0627\u0644\u062a\u0632\u0627\u0645\u0627\u062a \u0627\u0644\u0645\u062d\u0644\u0644', section_ar))
story.append(Paragraph(
    '\u064a\u062a\u0641\u0642 \u0627\u0644\u0645\u062d\u0644\u0644 \u0639\u0644\u0649: (\u0623) \u0627\u0644\u062d\u0641\u0627\u0638 \u0639\u0644\u0649 \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0633\u0631\u064a\u0629 \u0628\u0633\u0631\u064a\u0629 \u062a\u0627\u0645\u0629 \u0648\u0639\u062f\u0645 \u0627\u0644\u0625\u0641\u0635\u0627\u062d \u0639\u0646\u0647\u0627 \u0644\u0623\u064a \u0637\u0631\u0641 \u062b\u0627\u0644\u062b \u062f\u0648\u0646 \u0645\u0648\u0627\u0641\u0642\u0629 \u0643\u062a\u0627\u0628\u064a\u0629 \u0645\u0633\u0628\u0642\u0629 \u0645\u0646 \u0627\u0644\u0639\u0645\u064a\u0644\u061b (\u0628) \u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0633\u0631\u064a\u0629 \u062d\u0635\u0631\u064a\u0627 \u0644\u063a\u0631\u0636 \u062a\u0642\u062f\u064a\u0645 \u062e\u062f\u0645\u0627\u062a \u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631; (\u062c) \u0639\u062f\u0645 \u0646\u0633\u062e \u0623\u0648 \u0625\u0639\u0627\u062f\u0629 \u0625\u0646\u062a\u0627\u062c \u0623\u0648 \u062a\u0648\u0632\u064a\u0639 \u0623\u064a \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0633\u0631\u064a\u0629 \u0625\u0644\u0627 \u0628\u0642\u062f\u0631 \u0627\u0644\u0644\u0632\u0648\u0645; (\u062f) \u062a\u0646\u0641\u064a\u0630 \u062a\u062f\u0627\u0628\u064a\u0631 \u0623\u0645\u0646\u064a\u0629 \u0645\u0639\u0642\u0648\u0644\u0629 \u0644\u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0633\u0631\u064a\u0629; (\u0647) \u0625\u062e\u0637\u0627\u0631 \u0627\u0644\u0639\u0645\u064a\u0644 \u0641\u0648\u0631\u0627 \u0628\u0623\u064a \u0648\u0635\u0648\u0644 \u063a\u064a\u0631 \u0645\u0635\u0631\u062d \u0628\u0647; (\u0648) \u0625\u0631\u062c\u0627\u0639 \u0623\u0648 \u0625\u062a\u0644\u0627\u0641 \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0633\u0631\u064a\u0629 \u0628\u0634\u0643\u0644 \u0622\u0645\u0646 \u0639\u0646\u062f \u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0623\u0648 \u0639\u0646\u062f \u0637\u0644\u0628 \u0627\u0644\u0639\u0645\u064a\u0644.',
    body_ar
))

# Section 3
story.append(Paragraph('<b>3. EXCLUSIONS</b>', section_en))
story.append(Paragraph(
    'Confidential Information shall not include information that: (a) is or becomes publicly available through no fault of the Analyst; (b) was already in the Analyst\'s possession prior to disclosure by the Client; (c) is independently developed by the Analyst without reference to the Client\'s Confidential Information; (d) is rightfully received by the Analyst from a third party without restriction on disclosure; or (e) is required to be disclosed by law, regulation, or court order, provided that the Analyst gives the Client prompt written notice of such requirement.',
    body_en
))
story.append(Paragraph('\u0663. \u0627\u0644\u0627\u0633\u062a\u062b\u0646\u0627\u0621\u0627\u062a', section_ar))
story.append(Paragraph(
    '\u0644\u0627 \u062a\u0634\u0645\u0644 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0633\u0631\u064a\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u062a\u064a: (\u0623) \u0623\u0635\u0628\u062d\u062a \u0645\u062a\u0627\u062d\u0629 \u0644\u0644\u0639\u0645\u0648\u0645 \u062f\u0648\u0646 \u062e\u0637\u0623 \u0645\u0646 \u0627\u0644\u0645\u062d\u0644\u0644; (\u0628) \u0643\u0627\u0646\u062a \u0641\u064a \u062d\u0648\u0632\u0629 \u0627\u0644\u0645\u062d\u0644\u0644 \u0642\u0628\u0644 \u0627\u0644\u0625\u0641\u0635\u0627\u062d \u0639\u0646\u0647\u0627; (\u062c) \u062a\u0645 \u062a\u0637\u0648\u064a\u0631\u0647\u0627 \u0628\u0634\u0643\u0644 \u0645\u0633\u062a\u0642\u0644; (\u062f) \u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645\u0647\u0627 \u0628\u0634\u0643\u0644 \u0645\u0634\u0631\u0648\u0639 \u0645\u0646 \u0637\u0631\u0641 \u062b\u0627\u0644\u062b; \u0623\u0648 (\u0647) \u064a\u0644\u0632\u0645 \u0627\u0644\u0625\u0641\u0635\u0627\u062d \u0639\u0646\u0647\u0627 \u0628\u0645\u0648\u062c\u0628 \u0627\u0644\u0642\u0627\u0646\u0648\u0646.',
    body_ar
))

# Section 4
story.append(Paragraph('<b>4. DURATION</b>', section_en))
story.append(Paragraph(
    'This Agreement shall remain in effect for a period of two (2) years from the date of execution. The obligations of confidentiality and non-disclosure shall survive the termination or expiration of this Agreement and shall continue for a period of three (3) years from the date of termination, or until the Confidential Information ceases to be confidential, whichever occurs first.',
    body_en
))
story.append(Paragraph('\u0664. \u0627\u0644\u0645\u062f\u0629', section_ar))
story.append(Paragraph(
    '\u0638\u0644\u062a \u0647\u0630\u0647 \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629 \u0633\u0627\u0631\u064a\u0629 \u0644\u0645\u062f\u0629 \u0633\u0646\u062a\u064a\u0646 \u0645\u0646 \u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0648\u0642\u064a\u0639. \u062a\u0633\u062a\u0645\u0631 \u0627\u0644\u0627\u0644\u062a\u0632\u0627\u0645\u0627\u062a \u0628\u0627\u0644\u0633\u0631\u064a\u0629 \u0648\u0639\u062f\u0645 \u0627\u0644\u0625\u0641\u0635\u0627\u062d \u0644\u0645\u062f\u0629 \u062b\u0644\u0627\u062b \u0633\u0646\u0648\u0627\u062a \u0645\u0646 \u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0646\u0647\u0627\u0621.',
    body_ar
))

# Section 5
story.append(Paragraph('<b>5. DATA HANDLING AND SECURITY</b>', section_en))
story.append(Paragraph(
    'The Analyst shall: (a) store all Client data on encrypted storage only; (b) never share login credentials or access to the Client\'s systems; (c) only accept data via secure file transfer (encrypted email, secure cloud share, or password-protected files); (d) not retain any copies of Client data after the engagement concludes; and (e) upon request, provide written confirmation of data destruction. The Client retains full ownership and control of all data at all times. The Analyst\'s role is limited to analysis and reporting only.',
    body_en
))
story.append(Paragraph('\u0665. \u0627\u0644\u062a\u0639\u0627\u0645\u0644 \u0645\u0639 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0648\u0627\u0644\u0623\u0645\u0627\u0646', section_ar))
story.append(Paragraph(
    '\u064a\u0644\u062a\u0632\u0645 \u0627\u0644\u0645\u062d\u0644\u0644 \u0628\u0640: (\u0623) \u062a\u062e\u0632\u064a\u0646 \u062c\u0645\u064a\u0639 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0639\u0645\u064a\u0644 \u0639\u0644\u0649 \u062a\u062e\u0632\u064a\u0646 \u0645\u0634\u0641\u0631 \u0641\u0642\u0637; (\u0628) \u0639\u062f\u0645 \u0645\u0634\u0627\u0631\u0643\u0629 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0639\u0645\u064a\u0644; (\u062c) \u0642\u0628\u0648\u0644 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0639\u0628\u0631 \u0646\u0642\u0644 \u0622\u0645\u0646 \u0641\u0642\u0637; (\u062f) \u0639\u062f\u0645 \u0627\u0644\u0627\u062d\u062a\u0641\u0627\u0638 \u0628\u0646\u0633\u062e \u0628\u0639\u062f \u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u062a\u0639\u0627\u0642\u062f; (\u0647) \u062a\u0642\u062f\u064a\u0645 \u062a\u0623\u0643\u064a\u062f \u0643\u062a\u0627\u0628\u064a \u0628\u0625\u062a\u0644\u0627\u0641 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0639\u0646\u062f \u0627\u0644\u0637\u0644\u0628. \u064a\u062d\u062a\u0641\u0638 \u0627\u0644\u0639\u0645\u064a\u0644 \u0628\u0645\u0644\u0643\u064a\u0629 \u0643\u0627\u0645\u0644\u0629 \u0648\u0633\u064a\u0637\u0631\u0629 \u0643\u0627\u0645\u0644\u0629 \u0639\u0644\u0649 \u062c\u0645\u064a\u0639 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0641\u064a \u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u0648\u0642\u0627\u062a.',
    body_ar
))

# Section 6
story.append(Paragraph('<b>6. BREACH AND REMEDIES</b>', section_en))
story.append(Paragraph(
    'In the event of a breach or threatened breach of this Agreement, the Client shall be entitled to seek injunctive relief and/or damages as permitted under the laws of the United Arab Emirates. The Analyst acknowledges that monetary damages alone may not be sufficient to remedy a breach of this Agreement and that the Client shall be entitled to equitable relief without the necessity of proving actual damages.',
    body_en
))
story.append(Paragraph('\u0666. \u0627\u0644\u0625\u062e\u0644\u0627\u0644 \u0648\u0627\u0644\u0633\u0628\u0644 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629', section_ar))
story.append(Paragraph(
    '\u0641\u064a \u062d\u0627\u0644\u0629 \u0627\u0644\u0625\u062e\u0644\u0627\u0644 \u0628\u0647\u0630\u0647 \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629\u060c \u064a\u062d\u0642 \u0644\u0644\u0639\u0645\u064a\u0644 \u0637\u0644\u0628 \u0625\u0646\u0634\u0627\u0621 \u062d\u0643\u0645 \u0642\u0636\u0627\u0626\u064a \u0648/\u0623\u0648 \u062a\u0639\u0648\u064a\u0636\u0627\u062a \u0648\u0641\u0642\u0627 \u0644\u0642\u0648\u0627\u0646\u064a\u0646 \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0645\u062a\u062d\u062f\u0629. \u064a\u0642\u0631 \u0627\u0644\u0645\u062d\u0644\u0644 \u0628\u0623\u0646 \u0627\u0644\u062a\u0639\u0648\u064a\u0636\u0627\u062a \u0627\u0644\u0645\u0627\u062f\u064a\u0629 \u0648\u062d\u062f\u0647\u0627 \u0642\u062f \u0644\u0627 \u062a\u0643\u0641\u064a \u0644\u0625\u0635\u0644\u0627\u062d \u0627\u0644\u0625\u062e\u0644\u0627\u0644.',
    body_ar
))

# Section 7
story.append(Paragraph('<b>7. GOVERNING LAW</b>', section_en))
story.append(Paragraph(
    'This Agreement shall be governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts of the United Arab Emirates.',
    body_en
))
story.append(Paragraph('\u0667. \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0648\u0627\u062c\u0628 \u0627\u0644\u062a\u0637\u0628\u064a\u0642', section_ar))
story.append(Paragraph(
    '\u062a\u062e\u0636\u0639 \u0647\u0630\u0647 \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629 \u0644\u0642\u0648\u0627\u0646\u064a\u0646 \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0645\u062a\u062d\u062f\u0629. \u062a\u062e\u0636\u0639 \u0623\u064a \u0646\u0632\u0627\u0639\u0627\u062a \u0644\u0627\u062e\u062a\u0635\u0627\u0635 \u0645\u062d\u0627\u0643\u0645 \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0645\u062a\u062d\u062f\u0629.',
    body_ar
))

story.append(HRFlowable(width="100%", thickness=0.5, color=BG_SURFACE, spaceBefore=16, spaceAfter=16))

# Signature Block
story.append(Paragraph('<b>SIGNATURES</b>', section_en))
story.append(Spacer(1, 12))

sig_data = [
    [Paragraph('<b>ANALYST</b>', sig_head), Paragraph('<b>CLIENT</b>', sig_head)],
    [Paragraph('Name: Real Estate Emperor', sig_style), Paragraph('Name: ________________________', sig_style)],
    [Paragraph('Title: Data Analyst', sig_style), Paragraph('Title: ________________________', sig_style)],
    [Paragraph('Signature: ________________________', sig_style), Paragraph('Signature: ________________________', sig_style)],
    [Paragraph('Date: ________________________', sig_style), Paragraph('Date: ________________________', sig_style)],
    [Paragraph('Emirates ID: ________________________', sig_style), Paragraph('Emirates ID: ________________________', sig_style)],
]

sig_table = Table(sig_data, colWidths=[2.3*inch, 2.3*inch], hAlign='CENTER')
sig_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LINEBELOW', (0, 0), (-1, 0), 1, ACCENT),
]))
story.append(sig_table)

story.append(Spacer(1, 20))
story.append(Paragraph(
    'Real Estate Emperor | Data Analysis Services | real-estate-emperor.vercel.app',
    small_style
))

# Build
doc.build(story)
print(f"NDA PDF created at: {output_path}")
