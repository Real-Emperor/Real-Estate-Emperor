"""Generate Professional Service Price List PDF"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
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
ACCENT       = colors.HexColor('#b2253d')
TEXT_PRIMARY  = colors.HexColor('#262522')
TEXT_MUTED    = colors.HexColor('#918e86')
BG_SURFACE   = colors.HexColor('#e3e1db')

output_path = "/home/z/my-project/download/Service_Price_List.pdf"

doc = SimpleDocTemplate(
    output_path, pagesize=A4,
    leftMargin=1.0*inch, rightMargin=1.0*inch,
    topMargin=0.8*inch, bottomMargin=0.6*inch,
)

# Styles
title_style = ParagraphStyle(
    name='Title', fontName='DejaVuSans', fontSize=26, leading=32,
    alignment=TA_CENTER, textColor=ACCENT, spaceAfter=2
)
subtitle_style = ParagraphStyle(
    name='Subtitle', fontName='DejaVuSans', fontSize=11, leading=15,
    alignment=TA_CENTER, textColor=TEXT_MUTED, spaceAfter=4
)
tagline_style = ParagraphStyle(
    name='Tagline', fontName='LiberationSerif', fontSize=10, leading=14,
    alignment=TA_CENTER, textColor=TEXT_MUTED, spaceAfter=16
)
cat_style = ParagraphStyle(
    name='Category', fontName='DejaVuSans', fontSize=13, leading=18,
    textColor=colors.white, spaceBefore=0, spaceAfter=0
)
desc_style = ParagraphStyle(
    name='Desc', fontName='LiberationSerif', fontSize=9, leading=13,
    textColor=TEXT_MUTED, spaceAfter=0
)
service_name = ParagraphStyle(
    name='ServiceName', fontName='LiberationSerif', fontSize=10, leading=14,
    textColor=TEXT_PRIMARY, spaceAfter=0
)
price_style = ParagraphStyle(
    name='Price', fontName='DejaVuSans', fontSize=10, leading=14,
    textColor=ACCENT, alignment=TA_RIGHT, spaceAfter=0
)
price_cell = ParagraphStyle(
    name='PriceCell', fontName='DejaVuSans', fontSize=10, leading=14,
    textColor=ACCENT, alignment=TA_LEFT, spaceAfter=0
)
body_style = ParagraphStyle(
    name='Body', fontName='LiberationSerif', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY
)
note_style = ParagraphStyle(
    name='Note', fontName='LiberationSerif', fontSize=8.5, leading=12,
    textColor=TEXT_MUTED
)
footer_style = ParagraphStyle(
    name='Footer', fontName='DejaVuSans', fontSize=8, leading=12,
    textColor=TEXT_MUTED, alignment=TA_CENTER
)
bullet_style = ParagraphStyle(
    name='Bullet', fontName='LiberationSerif', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, leftIndent=12, bulletIndent=0, spaceAfter=3
)

story = []

# Header
story.append(Paragraph('<b>Real Estate Emperor</b>', title_style))
story.append(Paragraph('DATA ANALYSIS SERVICES', subtitle_style))
story.append(Paragraph('Turning Your Numbers Into Clear Business Decisions', tagline_style))
story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=16))

# Available width
available = A4[0] - 2.0*inch  # ~451pt

# Category 1: ONE-TIME REPORTS
cat1_data = [[Paragraph('<b>ONE-TIME REPORTS</b>', cat_style), '']]
cat1_table = Table(cat1_data, colWidths=[available, 0], hAlign='CENTER')
cat1_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, 0), ACCENT),
    ('LEFTPADDING', (0, 0), (0, 0), 12),
    ('TOPPADDING', (0, 0), (0, 0), 6),
    ('BOTTOMPADDING', (0, 0), (0, 0), 6),
]))
story.append(cat1_table)
story.append(Spacer(1, 8))

# One-time reports table
rpt_data = [
    [Paragraph('<b>Service</b>', ParagraphStyle(name='sh', fontName='DejaVuSans', fontSize=9, textColor=TEXT_PRIMARY)),
     Paragraph('<b>Description</b>', ParagraphStyle(name='sh2', fontName='DejaVuSans', fontSize=9, textColor=TEXT_PRIMARY)),
     Paragraph('<b>Price (AED)</b>', ParagraphStyle(name='sh3', fontName='DejaVuSans', fontSize=9, textColor=TEXT_PRIMARY, alignment=TA_RIGHT))],
    [Paragraph('Monthly Sales Report', service_name),
     Paragraph('Dashboard with sales trends, top products, and comparisons', desc_style),
     Paragraph('300 - 500', price_cell)],
    [Paragraph('Expense Tracker Report', service_name),
     Paragraph('Organized expense categories, charts, spending breakdown', desc_style),
     Paragraph('200 - 400', price_cell)],
    [Paragraph('Profit and Loss Summary', service_name),
     Paragraph('Revenue vs expenses, net profit, monthly comparison charts', desc_style),
     Paragraph('300 - 500', price_cell)],
    [Paragraph('Inventory Report', service_name),
     Paragraph('Stock levels, fast/slow movers, reorder alerts', desc_style),
     Paragraph('250 - 400', price_cell)],
    [Paragraph('Business Health Check', service_name),
     Paragraph('Full analysis with recommendations and action items', desc_style),
     Paragraph('500 - 1,000', price_cell)],
]

rpt_table = Table(rpt_data, colWidths=[0.28*available, 0.47*available, 0.25*available], hAlign='CENTER')
rpt_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BG_SURFACE),
    ('LINEBELOW', (0, 0), (-1, 0), 1, ACCENT),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f7f5')]),
    ('LINEBELOW', (0, -1), (-1, -1), 0.5, BG_SURFACE),
]))
story.append(rpt_table)
story.append(Spacer(1, 16))

# Category 2: MONTHLY RETAINER PACKAGES
cat2_data = [[Paragraph('<b>MONTHLY RETAINER PACKAGES</b>', cat_style), '']]
cat2_table = Table(cat2_data, colWidths=[available, 0], hAlign='CENTER')
cat2_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, 0), ACCENT),
    ('LEFTPADDING', (0, 0), (0, 0), 12),
    ('TOPPADDING', (0, 0), (0, 0), 6),
    ('BOTTOMPADDING', (0, 0), (0, 0), 6),
]))
story.append(cat2_table)
story.append(Spacer(1, 8))

pkg_data = [
    [Paragraph('<b>Package</b>', ParagraphStyle(name='sh4', fontName='DejaVuSans', fontSize=9, textColor=TEXT_PRIMARY)),
     Paragraph('<b>Includes</b>', ParagraphStyle(name='sh5', fontName='DejaVuSans', fontSize=9, textColor=TEXT_PRIMARY)),
     Paragraph('<b>Monthly (AED)</b>', ParagraphStyle(name='sh6', fontName='DejaVuSans', fontSize=9, textColor=TEXT_PRIMARY, alignment=TA_RIGHT))],
    [Paragraph('<b>Basic</b>', service_name),
     Paragraph('1 monthly sales report + expense summary', desc_style),
     Paragraph('500 - 800', price_cell)],
    [Paragraph('<b>Standard</b>', service_name),
     Paragraph('Sales + expense + P&L reports + email support', desc_style),
     Paragraph('1,000 - 1,500', price_cell)],
    [Paragraph('<b>Premium</b>', service_name),
     Paragraph('All reports + inventory + recommendations + priority support', desc_style),
     Paragraph('1,500 - 2,500', price_cell)],
]

pkg_table = Table(pkg_data, colWidths=[0.22*available, 0.53*available, 0.25*available], hAlign='CENTER')
pkg_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BG_SURFACE),
    ('LINEBELOW', (0, 0), (-1, 0), 1, ACCENT),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f7f5')]),
    ('LINEBELOW', (0, -1), (-1, -1), 0.5, BG_SURFACE),
]))
story.append(pkg_table)
story.append(Spacer(1, 16))

# Category 3: ADDITIONAL SERVICES
cat3_data = [[Paragraph('<b>ADDITIONAL SERVICES</b>', cat_style), '']]
cat3_table = Table(cat3_data, colWidths=[available, 0], hAlign='CENTER')
cat3_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, 0), ACCENT),
    ('LEFTPADDING', (0, 0), (0, 0), 12),
    ('TOPPADDING', (0, 0), (0, 0), 6),
    ('BOTTOMPADDING', (0, 0), (0, 0), 6),
]))
story.append(cat3_table)
story.append(Spacer(1, 8))

add_data = [
    [Paragraph('<b>Service</b>', ParagraphStyle(name='sh7', fontName='DejaVuSans', fontSize=9, textColor=TEXT_PRIMARY)),
     Paragraph('<b>Description</b>', ParagraphStyle(name='sh8', fontName='DejaVuSans', fontSize=9, textColor=TEXT_PRIMARY)),
     Paragraph('<b>Price (AED)</b>', ParagraphStyle(name='sh9', fontName='DejaVuSans', fontSize=9, textColor=TEXT_PRIMARY, alignment=TA_RIGHT))],
    [Paragraph('Custom Dashboard', service_name),
     Paragraph('Interactive dashboard tailored to your business needs', desc_style),
     Paragraph('800 - 1,500', price_cell)],
    [Paragraph('Data Cleanup', service_name),
     Paragraph('Organize messy spreadsheets into clean, usable data', desc_style),
     Paragraph('200 - 500', price_cell)],
    [Paragraph('Arabic-English Report', service_name),
     Paragraph('Bilingual report for Arabic-speaking stakeholders', desc_style),
     Paragraph('+200 surcharge', price_cell)],
    [Paragraph('Urgent / Same-Day', service_name),
     Paragraph('Priority delivery within 24 hours', desc_style),
     Paragraph('+50% surcharge', price_cell)],
    [Paragraph('Consultation (1hr)', service_name),
     Paragraph('One-on-one session to discuss your data needs', desc_style),
     Paragraph('100', price_cell)],
]

add_table = Table(add_data, colWidths=[0.28*available, 0.47*available, 0.25*available], hAlign='CENTER')
add_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BG_SURFACE),
    ('LINEBELOW', (0, 0), (-1, 0), 1, ACCENT),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f7f5')]),
    ('LINEBELOW', (0, -1), (-1, -1), 0.5, BG_SURFACE),
]))
story.append(add_table)
story.append(Spacer(1, 20))

# How it Works
story.append(Paragraph('<b>HOW IT WORKS</b>', ParagraphStyle(
    name='HowTitle', fontName='DejaVuSans', fontSize=12, leading=16,
    textColor=ACCENT, spaceAfter=8
)))

steps = [
    '<b>1. Contact</b> - Reach out via WhatsApp or phone to discuss your needs',
    '<b>2. Share Data</b> - Export your data to Excel/CSV and send it securely',
    '<b>3. NDA Signed</b> - Confidentiality agreement provided for your peace of mind',
    '<b>4. Analysis</b> - I analyze your data and create professional reports',
    '<b>5. Delivery</b> - Receive your report within 2-5 business days',
    '<b>6. Review</b> - One round of revisions included at no extra cost',
]
for step in steps:
    story.append(Paragraph(step, bullet_style))

story.append(Spacer(1, 16))

# Trust & Guarantee
story.append(Paragraph('<b>YOUR GUARANTEE</b>', ParagraphStyle(
    name='GuarTitle', fontName='DejaVuSans', fontSize=12, leading=16,
    textColor=ACCENT, spaceAfter=8
)))

guarantees = [
    'NDA signed before any data is shared - your information stays confidential',
    'No access to your bank accounts or online systems - you control your data',
    '100% satisfaction guarantee - free revisions if you are not happy',
    'Teacher by profession - trust and integrity come first',
    'UAE-based - available for in-person meetings in Sharjah, Dubai, Ajman',
]
for g in guarantees:
    story.append(Paragraph(g, bullet_style))

story.append(Spacer(1, 16))

# Pricing Notes
story.append(HRFlowable(width="100%", thickness=0.5, color=BG_SURFACE, spaceAfter=8))
story.append(Paragraph('* Prices vary based on data volume and complexity. Final quote provided after consultation.', note_style))
story.append(Paragraph('* All prices in UAE Dirhams (AED). Payment via bank transfer or cash.', note_style))
story.append(Paragraph('* First-time clients: 10% discount on your first report.', note_style))
story.append(Paragraph('* Monthly retainer clients receive priority support and faster turnaround.', note_style))
story.append(Spacer(1, 16))

# Contact
story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=10))
contact_style = ParagraphStyle(
    name='Contact', fontName='DejaVuSans', fontSize=10, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, spaceAfter=4
)
story.append(Paragraph('<b>Real Estate Emperor | Data Analysis Services</b>', contact_style))
story.append(Paragraph('real-estate-emperor.vercel.app', ParagraphStyle(
    name='Web', fontName='DejaVuSans', fontSize=9, leading=13,
    textColor=ACCENT, alignment=TA_CENTER, spaceAfter=4
)))
story.append(Paragraph('WhatsApp: _________________ | Phone: _________________', ParagraphStyle(
    name='Phone', fontName='DejaVuSans', fontSize=9, leading=13,
    textColor=TEXT_MUTED, alignment=TA_CENTER
)))

# Build
doc.build(story)
print(f"Price List PDF created at: {output_path}")
