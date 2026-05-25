// Al Reef Al Janoubi - 4-Language i18n System
// EN = English, AR = Arabic, BN = Bengali, UR = Urdu
// Academic/professional translations, NOT literal

export type Language = 'en' | 'ar' | 'bn' | 'ur'

export const languageNames: Record<Language, { native: string; en: string }> = {
  en: { native: 'English', en: 'English' },
  ar: { native: 'العربية', en: 'Arabic' },
  bn: { native: 'বাংলা', en: 'Bengali' },
  ur: { native: 'اردو', en: 'Urdu' },
}

export const rtlLanguages: Language[] = ['ar', 'ur']

type TranslationKeys = typeof translations

export const translations = {
  // Auth
  login: { en: 'Sign In', ar: 'تسجيل الدخول', bn: 'সাইন ইন', ur: 'سائن ان' },
  loginTitle: { en: 'Property Dashboard', ar: 'لوحة التحكم العقارية', bn: 'সম্পত্তি ড্যাশবোর্ড', ur: 'پراپرٹی ڈیش بورڈ' },
  loginSubtitle: { en: 'Al Reef Al Janoubi Real Estate', ar: 'الريف الجنوبي للعقارات', bn: 'আল রিফ আল জানুবি রিয়েল এস্টেট', ur: 'الریف الجنوبی ریئل اسٹیٹ' },
  email: { en: 'Email Address', ar: 'البريد الإلكتروني', bn: 'ইমেইল ঠিকানা', ur: 'ای میل ایڈریس' },
  password: { en: 'Password', ar: 'كلمة المرور', bn: 'পাসওয়ার্ড', ur: 'پاس ورڈ' },
  signInButton: { en: 'Sign In', ar: 'دخول', bn: 'সাইন ইন', ur: 'سائن ان' },
  loginError: { en: 'Invalid email or password', ar: 'بريد إلكتروني أو كلمة مرور غير صحيحة', bn: 'অবৈধ ইমেইল বা পাসওয়ার্ড', ur: 'غلط ای میل یا پاس ورڈ' },
  logout: { en: 'Sign Out', ar: 'تسجيل الخروج', bn: 'সাইন আউট', ur: 'سائن آؤٹ' },
  ownerRole: { en: 'Owner', ar: 'المالك', bn: 'মালিক', ur: 'مالک' },
  adminRole: { en: 'Admin', ar: 'المدير', bn: 'প্রশাসক', ur: 'ایڈمن' },
  staffRole: { en: 'Staff', ar: 'الموظف', bn: 'কর্মচারী', ur: 'اسٹاف' },

  // Navigation
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم', bn: 'ড্যাশবোর্ড', ur: 'ڈیش بورڈ' },
  properties: { en: 'Properties', ar: 'العقارات', bn: 'সম্পত্তি', ur: 'پراپرٹیز' },
  tenants: { en: 'Tenants', ar: 'المستأجرون', bn: 'ভাড়াটিয়া', ur: 'کرایہ دار' },
  rentCollection: { en: 'Rent Collection', ar: 'تحصيل الإيجار', bn: 'ভাড়া আদায়', ur: 'کرایہ وصولی' },
  maintenance: { en: 'Maintenance', ar: 'الصيانة', bn: 'রক্ষণাবেক্ষণ', ur: 'دیکھ بھال' },
  expenses: { en: 'Expenses', ar: 'المصروفات', bn: 'ব্যয়', ur: 'اخراجات' },
  reports: { en: 'Reports', ar: 'التقارير', bn: 'প্রতিবেদন', ur: 'رپورٹس' },
  contracts: { en: 'Contracts', ar: 'العقود', bn: 'চুক্তি', ur: 'معاہدے' },

  // Dashboard
  monthlyOverview: { en: 'Monthly Overview', ar: 'نظرة شهرية', bn: 'মাসিক পরিদর্শন', ur: 'ماہانہ جائزہ' },
  collectedRevenue: { en: 'Collected Revenue', ar: 'الإيرادات المحصّلة', bn: 'আদায়কৃত রাজস্ব', ur: 'وصول شدہ آمدنی' },
  overdue: { en: 'Overdue', ar: 'متأخر', bn: 'বকেয়া', ur: 'باقاعدہ' },
  activeTenants: { en: 'Active Tenants', ar: 'المستأجرون النشطون', bn: 'সক্রিয় ভাড়াটিয়া', ur: 'فعال کرایہ دار' },
  occupancyRate: { en: 'Occupancy Rate', ar: 'نسبة الإشغال', bn: 'অধিভুক্তির হার', ur: 'قبضہ کی شرح' },
  expected: { en: 'Expected', ar: 'متوقع', bn: 'প্রত্যাশিত', ur: 'متوقع' },
  collected: { en: 'Collected', ar: 'محصّل', bn: 'আদায়কৃত', ur: 'وصول شدہ' },
  monthly: { en: 'Monthly', ar: 'شهري', bn: 'মাসিক', ur: 'ماہانہ' },
  ofExpected: { en: 'of', ar: 'من', bn: 'এর মধ্যে', ur: 'میں سے' },
  total: { en: 'Total', ar: 'إجمالي', bn: 'মোট', ur: 'کل' },
  totalUnits: { en: 'Total Units', ar: 'إجمالي الوحدات', bn: 'মোট ইউনিট', ur: 'کل یونٹس' },
  occupiedUnits: { en: 'Occupied Units', ar: 'الوحدات المشغولة', bn: 'অধিভুক্ত ইউনিট', ur: 'قبضہ شدہ یونٹس' },
  vacantUnits: { en: 'Vacant Units', ar: 'الوحدات الشاغرة', bn: 'শূন্য ইউনিট', ur: 'خالی یونٹس' },
  netProfit: { en: 'Net Profit', ar: 'صافي الربح', bn: 'নিট মুনাফা', ur: 'خالص منافع' },
  paymentStatusBoard: { en: 'Payment Status Board', ar: 'لوحة حالة الدفع', bn: 'পেমেন্ট স্ট্যাটাস বোর্ড', ur: 'ادائیگی کی حالت بورڈ' },
  revenueTrend: { en: 'Revenue Trend (6 Months)', ar: 'اتجاه الإيرادات (6 أشهر)', bn: 'রাজস্ব প্রবণতা (6 মাস)', ur: 'آمدنی کا رجحان (6 ماہ)' },
  recentPayments: { en: 'Recent Payments', ar: 'المدفوعات الأخيرة', bn: 'সাম্প্রতিক পেমেন্ট', ur: 'حالیہ ادائیگیاں' },
  noData: { en: 'No data found', ar: 'لا توجد بيانات', bn: 'কোনো তথ্য পাওয়া যায়নি', ur: 'کوئی ڈیٹا نہیں ملا' },
  loadSampleData: { en: 'Load Sample Data', ar: 'تحميل البيانات التجريبية', bn: 'নমুনা ডেটা লোড করুন', ur: 'نمونہ ڈیٹا لوڈ کریں' },
  overdueAlert: { en: 'TENANT(S) OVERDUE', ar: 'مستأجر متأخر', bn: 'জন ভাড়াটিয়া বকেয়াদার', ur: 'کرایہ دار باقاعدہ' },
  uncollected: { en: 'UNCOLLECTED', ar: 'غير محصّل', bn: 'অনাদায়কৃত', ur: 'غیر وصول شدہ' },
  viewDetails: { en: 'View Details', ar: 'عرض التفاصيل', bn: 'বিস্তারিত দেখুন', ur: 'تفصیلات دیکھیں' },
  paid: { en: 'PAID', ar: 'مدفوع', bn: 'পরিশোধিত', ur: 'ادائیگی شدہ' },
  partial: { en: 'PARTIAL', ar: 'جزئي', bn: 'আংশিক', ur: 'جزوی' },
  inactive: { en: 'INACTIVE', ar: 'غير نشط', bn: 'নিষ্ক্রিয়', ur: 'غیر فعال' },
  dueSoon: { en: 'DUE SOON', ar: 'مستحق قريباً', bn: 'শীঘ্রই দেয়', ur: 'جلد ادائیگی' },
  remind: { en: 'Remind', ar: 'تذكير', bn: 'স্মরণ', ur: 'یاد دہانی' },
  remindAllUnpaid: { en: 'Remind All Unpaid', ar: 'تذكير الكل', bn: 'সকল অবৈতনিকে স্মরণ করুন', ur: 'سب کو یاد دہانی' },
  noRecentPayments: { en: 'No recent payments', ar: 'لا توجد مدفوعات حديثة', bn: 'কোনো সাম্প্রতিক পেমেন্ট নেই', ur: 'کوئی حالیہ ادائیگی نہیں' },

  // Properties
  addProperty: { en: 'Add Property', ar: 'إضافة عقار', bn: 'সম্পত্তি যোগ করুন', ur: 'پراپرٹی شامل کریں' },
  editProperty: { en: 'Edit Property', ar: 'تعديل العقار', bn: 'সম্পত্তি সম্পাদনা', ur: 'پراپرٹی ترمیم' },
  propertyName: { en: 'Property Name', ar: 'اسم العقار', bn: 'সম্পত্তির নাম', ur: 'پراپرٹی کا نام' },
  propertyType: { en: 'Property Type', ar: 'نوع العقار', bn: 'সম্পত্তির ধরন', ur: 'پراپرٹی کی قسم' },
  address: { en: 'Address', ar: 'العنوان', bn: 'ঠিকানা', ur: 'پتہ' },
  totalUnitsCount: { en: 'Total Units', ar: 'إجمالي الوحدات', bn: 'মোট ইউনিট', ur: 'کل یونٹس' },
  floors: { en: 'Floors', ar: 'الطوابق', bn: 'তলা', ur: 'منزلیں' },
  units: { en: 'Units', ar: 'وحدات', bn: 'ইউনিট', ur: 'یونٹس' },
  tenantsCount: { en: 'Tenants', ar: 'مستأجرون', bn: 'ভাড়াটিয়া', ur: 'کرایہ دار' },
  occupancy: { en: 'Occupancy', ar: 'إشغال', bn: 'অধিভুক্তি', ur: 'قبضہ' },
  monthlyRevenue: { en: 'Monthly Revenue', ar: 'الإيراد الشهري', bn: 'মাসিক রাজস্ব', ur: 'ماہانہ آمدنی' },
  propertiesManaged: { en: 'properties managed', ar: 'عقارات مُدارة', bn: 'টি পরিচালিত সম্পত্তি', ur: 'پراپرٹیز منیجڈ' },
  deleteProperty: { en: 'Delete this property?', ar: 'حذف هذا العقار؟', bn: 'এই সম্পত্তি মুছে ফেলবেন?', ur: 'یہ پراپرٹی حذف کریں؟' },
  archiveProperty: { en: 'Archive Property', ar: 'أرشفة العقار', bn: 'সম্পত্তি সংরক্ষণাগার', ur: 'پراپرٹی آرکائیو' },
  sellProperty: { en: 'Property Sold / Removed', ar: 'عقار مباع / مزال', bn: 'সম্পত্তি বিক্রয়/অপসারিত', ur: 'پراپرٹی فروخت/ہٹا دی' },
  apartment: { en: 'Apartment', ar: 'شقة', bn: 'অ্যাপার্টমেন্ট', ur: 'اپارٹمنٹ' },
  villa: { en: 'Villa', ar: 'فيلا', bn: 'ভিলা', ur: 'ولا' },
  office: { en: 'Office', ar: 'مكتب', bn: 'অফিস', ur: 'دفتر' },
  shop: { en: 'Shop', ar: 'محل', bn: 'দোকান', ur: 'دکان' },
  studio: { en: 'Studio', ar: 'استوديو', bn: 'স্টুডিও', ur: 'اسٹوڈیو' },
  mixedUse: { en: 'Mixed Use', ar: 'استخدام متعدد', bn: 'মিশ্র ব্যবহার', ur: 'مخلوط استعمال' },

  // Tenants
  addTenant: { en: 'Add Tenant', ar: 'إضافة مستأجر', bn: 'ভাড়াটিয়া যোগ করুন', ur: 'کرایہ دار شامل کریں' },
  editTenant: { en: 'Edit Tenant', ar: 'تعديل المستأجر', bn: 'ভাড়াটিয়া সম্পাদনা', ur: 'کرایہ دار ترمیم' },
  tenantName: { en: 'Tenant Name', ar: 'اسم المستأجر', bn: 'ভাড়াটিয়ার নাম', ur: 'کرایہ دار کا نام' },
  phone: { en: 'Phone', ar: 'الهاتف', bn: 'ফোন', ur: 'فون' },
  whatsapp: { en: 'WhatsApp', ar: 'واتساب', bn: 'হোয়াটসঅ্যাপ', ur: 'واٹس ایپ' },
  emiratesId: { en: 'Emirates ID', ar: 'الهوية الإماراتية', bn: 'আমিরাতি পরিচয়পত্র', ur: 'اماراتی شناختی کارڈ' },
  nationality: { en: 'Nationality', ar: 'الجنسية', bn: 'জাতীয়তা', ur: 'قومیت' },
  employer2: { en: 'Employer', ar: 'جهة العمل', bn: 'নিয়োগকর্তা', ur: 'آجروں' },
  emergencyContact: { en: 'Emergency Contact', ar: 'جهة اتصال الطوارئ', bn: 'জরুরি যোগাযোগ', ur: 'ہنگامی رابطہ' },
  unitNumber: { en: 'Unit Number', ar: 'رقم الوحدة', bn: 'ইউনিট নম্বর', ur: 'یونٹ نمبر' },
  unitType: { en: 'Unit Type', ar: 'نوع الوحدة', bn: 'ইউনিটের ধরন', ur: 'یونٹ کی قسم' },
  floor2: { en: 'Floor', ar: 'الطابق', bn: 'তলা', ur: 'منزل' },
  sizeSqft: { en: 'Size (sqft)', ar: 'المساحة (قدم مربع)', bn: 'আকার (বর্গফুট)', ur: 'سائز (مربع فٹ)' },
  monthlyRent: { en: 'Monthly Rent (AED)', ar: 'الإيجار الشهري (درهم)', bn: 'মাসিক ভাড়া (দিরহাম)', ur: 'ماہانہ کرایہ (درہم)' },
  municipalityFee: { en: 'Municipality Fee (5%)', ar: 'رسوم البلدية (5%)', bn: 'পৌরসভা ফি (5%)', ur: 'بلدیہ فیس (5%)' },
  securityDeposit: { en: 'Security Deposit', ar: 'التأمين', bn: 'নিরাপত্তা জমা', ur: 'سیکیورٹی ڈپازٹ' },
  paymentMethod: { en: 'Payment Method', ar: 'طريقة الدفع', bn: 'পেমেন্ট পদ্ধতি', ur: 'ادائیگی کا طریقہ' },
  leaseStart: { en: 'Lease Start', ar: 'بداية العقد', bn: 'লিজ শুরু', ur: 'لیز کی شروعات' },
  leaseEnd: { en: 'Lease End', ar: 'نهاية العقد', bn: 'লিজ শেষ', ur: 'لیز کا ختم' },
  contractDuration: { en: 'Contract Duration (months)', ar: 'مدة العقد (أشهر)', bn: 'চুক্তির মেয়াদ (মাস)', ur: 'معاہدے کی مدت (مہینے)' },
  status: { en: 'Status', ar: 'الحالة', bn: 'অবস্থা', ur: 'حالت' },
  active: { en: 'Active', ar: 'نشط', bn: 'সক্রিয়', ur: 'فعال' },
  inactive2: { en: 'Inactive', ar: 'غير نشط', bn: 'নিষ্ক্রিয়', ur: 'غیر فعال' },
  evicted: { en: 'Evicted', ar: 'مُخلَى', bn: 'উচ্ছেদিত', ur: 'بے دخل' },
  notice: { en: 'Notice Period', ar: 'فترة الإشعار', bn: 'নোটিশ পিরিয়ড', ur: 'نوٹس پیریڈ' },
  tenantScore: { en: 'Tenant Score', ar: 'تقييم المستأجر', bn: 'ভাড়াটিয়া স্কোর', ur: 'کرایہ دار اسکور' },
  latePayments: { en: 'Late Payments', ar: 'مدفوعات متأخرة', bn: 'বিলম্বিত পেমেন্ট', ur: 'تاخیری ادائیگیاں' },
  paymentHistory: { en: 'Payment History', ar: 'سجل المدفوعات', bn: 'পেমেন্ট ইতিহাস', ur: 'ادائیگی کی تاریخ' },
  searchTenants: { en: 'Search tenants...', ar: 'بحث المستأجرين...', bn: 'ভাড়াটিয়া খুঁজুন...', ur: 'کرایہ دار تلاش کریں...' },
  allStatus: { en: 'All Status', ar: 'كل الحالات', bn: 'সকল অবস্থা', ur: 'تمام حالتیں' },
  deleteTenant: { en: 'Delete this tenant and all their payments?', ar: 'حذف هذا المستأجر وجميع مدفوعاته؟', bn: 'এই ভাড়াটিয়া এবং তাদের সকল পেমেন্ট মুছে ফেলবেন?', ur: 'یہ کرایہ دار اور ان کی تمام ادائیگیاں حذف کریں؟' },
  noPayments: { en: 'No payments recorded', ar: 'لا توجد مدفوعات', bn: 'কোনো পেমেন্ট রেকর্ড নেই', ur: 'کوئی ادائیگی ریکارڈ نہیں' },
  noTenantsFound: { en: 'No tenants found', ar: 'لم يتم العثور على مستأجرين', bn: 'কোনো ভাড়াটিয়া পাওয়া যায়নি', ur: 'کوئی کرایہ دار نہیں ملا' },
  scoreExcellent: { en: 'Excellent', ar: 'ممتاز', bn: 'চমৎকার', ur: 'بہترین' },
  scoreGood: { en: 'Good', ar: 'جيد', bn: 'ভালো', ur: 'اچھا' },
  scoreWarning: { en: 'Warning', ar: 'تحذير', bn: 'সতর্কতা', ur: 'انتباہ' },
  scorePoor: { en: 'Poor', ar: 'ضعيف', bn: 'দুর্বল', ur: 'کمزور' },
  cash: { en: 'Cash', ar: 'نقدي', bn: 'নগদ', ur: 'نقد' },
  bankTransfer: { en: 'Bank Transfer', ar: 'تحويل بنكي', bn: 'ব্যাংক ট্রান্সফার', ur: 'بینک ٹرانسفر' },
  cheque: { en: 'Cheque', ar: 'شيك', bn: 'চেক', ur: 'چیک' },
  nameEnglish: { en: 'Name (English)', ar: 'الاسم (إنجليزي)', bn: 'নাম (ইংরেজি)', ur: 'نام (انگریزی)' },
  nameArabic: { en: 'Arabic Name', ar: 'الاسم بالعربية', bn: 'আরবি নাম', ur: 'عربی نام' },
  nameBengali: { en: 'Bengali Name', ar: 'الاسم بالبنغالية', bn: 'বাংলা নাম', ur: 'بنگالی نام' },
  nameUrdu: { en: 'Urdu Name', ar: 'الاسم بالأردية', bn: 'উর্দু নাম', ur: 'اردو نام' },
  oneBedroom: { en: '1 Bedroom', ar: 'غرفة واحدة', bn: '১ বেডরুম', ur: '1 بیڈ روم' },
  twoBedroom: { en: '2 Bedroom', ar: 'غرفتان', bn: '২ বেডরুম', ur: '2 بیڈ روم' },
  threeBedroom: { en: '3 Bedroom', ar: '3 غرف', bn: '৩ বেডরুম', ur: '3 بیڈ روم' },
  selectProperty: { en: 'Select Property', ar: 'اختر العقار', bn: 'সম্পত্তি নির্বাচন', ur: 'پراپرٹی منتخب کریں' },
  tenantProfile: { en: 'Tenant Profile', ar: 'ملف المستأجر', bn: 'ভাড়াটিয়া প্রোফাইল', ur: 'کرایہ دار پروفائل' },
  personalInfo: { en: 'Personal Information', ar: 'المعلومات الشخصية', bn: 'ব্যক্তিগত তথ্য', ur: 'ذاتی معلومات' },
  contactInfo: { en: 'Contact Information', ar: 'معلومات الاتصال', bn: 'যোগাযোগ তথ্য', ur: 'رابطہ کی معلومات' },
  leaseInfo: { en: 'Lease Information', ar: 'معلومات العقد', bn: 'লিজ তথ্য', ur: 'لیز کی معلومات' },
  financialInfo: { en: 'Financial Information', ar: 'المعلومات المالية', bn: 'আর্থিক তথ্য', ur: 'مالیاتی معلومات' },
  months: { en: 'months', ar: 'أشهر', bn: 'মাস', ur: 'مہینے' },
  late: { en: 'Late', ar: 'متأخر', bn: 'বিলম্বিত', ur: 'تاخیر' },
  onTime: { en: 'On Time', ar: 'في الوقت', bn: 'সময়মতো', ur: 'بوقت' },
  building: { en: 'Building', ar: 'المبنى', bn: 'ভবন', ur: 'عمارت' },
  autoCalc: { en: 'Auto-calculated (5% of rent)', ar: 'حساب تلقائي (5% من الإيجار)', bn: 'স্বয়ংক্রিয় গণনা (ভাড়ার 5%)', ur: 'خودکار حساب (کرایے کا 5%)' },

  // Rent Collection
  rent: { en: 'Rent', ar: 'الإيجار', bn: 'ভাড়া', ur: 'کرایہ' },
  remaining: { en: 'Remaining', ar: 'المتبقي', bn: 'বাকি', ur: 'باقی' },
  markPaid: { en: 'Mark Paid', ar: 'تسجيل دفع', bn: 'পরিশোধিত চিহ্ন', ur: 'ادائیگی کا نشان' },
  recordPayment: { en: 'Record Payment', ar: 'تسجيل دفعة', bn: 'পেমেন্ট রেকর্ড করুন', ur: 'ادائیگی ریکارڈ کریں' },
  amount: { en: 'Amount (AED)', ar: 'المبلغ (درهم)', bn: 'পরিমাণ (দিরহাম)', ur: 'رقم (درہم)' },
  reference: { en: 'Reference / Receipt No.', ar: 'المرجع / رقم الإيصال', bn: 'রেফারেন্স / রশিদ নম্বর', ur: 'حوالہ / رسید نمبر' },
  notes: { en: 'Notes', ar: 'ملاحظات', bn: 'নোট', ur: 'نوٹس' },
  confirmPayment: { en: 'Confirm Payment', ar: 'تأكيد الدفع', bn: 'পেমেন্ট নিশ্চিত করুন', ur: 'ادائیگی کی تصدیق' },
  cancel: { en: 'Cancel', ar: 'إلغاء', bn: 'বাতিল', ur: 'منسوخ' },
  save: { en: 'Save', ar: 'حفظ', bn: 'সংরক্ষণ', ur: 'محفوظ کریں' },
  all: { en: 'All', ar: 'الكل', bn: 'সব', ur: 'سب' },
  unpaid: { en: 'Unpaid', ar: 'غير مدفوع', bn: 'অবৈতনিক', ur: 'غیر ادا شدہ' },
  collectionProgress: { en: 'Collection Progress', ar: 'تقدم التحصيل', bn: 'আদায় অগ্রগতি', ur: 'وصولی کی پیش رفت' },
  noTenantsMatchFilter: { en: 'No tenants match the filter', ar: 'لا يوجد مستأجرون مطابقون للفلتر', bn: 'কোনো ভাড়াটিয়া ফিল্টারে মেলেনি', ur: 'کوئی کرایہ دار فلٹر سے مطابق نہیں' },
  sendWhatsAppReminder: { en: 'Send WhatsApp Reminder', ar: 'إرسال تذكير واتساب', bn: 'হোয়াটসঅ্যাপ রিমাইন্ডার পাঠান', ur: 'واٹس ایپ یاد دہانی بھیجیں' },

  // Maintenance
  addTask: { en: 'Add Task', ar: 'إضافة مهمة', bn: 'কাজ যোগ করুন', ur: 'ٹاسک شامل کریں' },
  editTask: { en: 'Edit Task', ar: 'تعديل المهمة', bn: 'কাজ সম্পাদনা', ur: 'ٹاسک ترمیم' },
  pending: { en: 'Pending', ar: 'قيد الانتظار', bn: 'অপেক্ষমাণ', ur: 'زیر التواء' },
  inProgress: { en: 'In Progress', ar: 'قيد التنفيذ', bn: 'চলমান', ur: 'جاری ہے' },
  completed: { en: 'Completed', ar: 'مكتمل', bn: 'সম্পন্ন', ur: 'مکمل' },
  urgent: { en: 'Urgent', ar: 'عاجل', bn: 'জরুরি', ur: 'فوری' },
  high: { en: 'High', ar: 'مرتفع', bn: 'উচ্চ', ur: 'زیادہ' },
  medium: { en: 'Medium', ar: 'متوسط', bn: 'মাঝারি', ur: 'درمیانہ' },
  low: { en: 'Low', ar: 'منخفض', bn: 'নিম্ন', ur: 'کم' },
  title: { en: 'Title', ar: 'العنوان', bn: 'শিরোনাম', ur: 'عنوان' },
  description: { en: 'Description', ar: 'الوصف', bn: 'বিবরণ', ur: 'تفصیل' },
  priority: { en: 'Priority', ar: 'الأولوية', bn: 'অগ্রাধিকার', ur: 'ترجیح' },
  estimatedCost: { en: 'Estimated Cost (AED)', ar: 'التكلفة المقدرة (درهم)', bn: 'আনুমানিক খরচ (দিরহাম)', ur: 'تخمینی لاگت (درہم)' },
  actualCost: { en: 'Actual Cost (AED)', ar: 'التكلفة الفعلية (درهم)', bn: 'প্রকৃত খরচ (দিরহাম)', ur: 'اصل لاگت (درہم)' },
  vendor: { en: 'Vendor/Technician', ar: 'المورد/الفني', bn: 'বিক্রেতা/প্রযুক্তিবিদ', ur: 'وینڈر/ٹیکنیشن' },
  category: { en: 'Category', ar: 'الفئة', bn: 'বিভাগ', ur: 'زمرہ' },
  noTasks: { en: 'No tasks', ar: 'لا مهام', bn: 'কোনো কাজ নেই', ur: 'کوئی ٹاسک نہیں' },
  deleteTask: { en: 'Delete this task?', ar: 'حذف هذه المهمة؟', bn: 'এই কাজ মুছে ফেলবেন?', ur: 'یہ ٹاسک حذف کریں؟' },
  start: { en: 'Start', ar: 'بدء', bn: 'শুরু', ur: 'شروع' },
  complete: { en: 'Complete', ar: 'إكمال', bn: 'সম্পূর্ণ', ur: 'مکمل' },
  ac: { en: 'AC', ar: 'تكييف', bn: 'এসি', ur: 'ایئر کنڈیشنر' },
  plumbing: { en: 'Plumbing', ar: 'سباكة', bn: 'প্লাম্বিং', ur: 'پلمبنگ' },
  electrical: { en: 'Electrical', ar: 'كهرباء', bn: 'বৈদ্যুতিক', ur: 'بجلی' },
  lockDoor: { en: 'Lock/Door', ar: 'قفل/باب', bn: 'তালা/দরজা', ur: 'تالا/دروازہ' },
  painting: { en: 'Painting', ar: 'دهان', bn: 'রং', ur: 'پینٹنگ' },
  structural: { en: 'Structural', ar: 'هيكلي', bn: 'কাঠামোগত', ur: 'ساختی' },
  other: { en: 'Other', ar: 'أخرى', bn: 'অন্যান্য', ur: 'دیگر' },

  // Expenses
  addExpense: { en: 'Add Expense', ar: 'إضافة مصروف', bn: 'ব্যয় যোগ করুন', ur: 'اخراجات شامل کریں' },
  editExpense: { en: 'Edit Expense', ar: 'تعديل المصروف', bn: 'ব্যয় সম্পাদনা', ur: 'اخراجات ترمیم' },
  expenseCategory: { en: 'Category', ar: 'الفئة', bn: 'বিভাগ', ur: 'زمرہ' },
  totalExpenses: { en: 'Total Expenses', ar: 'إجمالي المصروفات', bn: 'মোট ব্যয়', ur: 'کل اخراجات' },
  thisMonth: { en: 'This Month', ar: 'هذا الشهر', bn: 'এই মাস', ur: 'اس مہینے' },
  recurring: { en: 'Recurring', ar: 'متكرر', bn: 'পুনরাবৃত্তি', ur: 'بار بار' },
  oneTime: { en: 'One-time', ar: 'مرة واحدة', bn: 'এককালীন', ur: 'ایک بار' },
  manpower: { en: 'Manpower/Staff', ar: 'القوى العاملة/الموظفين', bn: 'শ্রমিক/কর্মী', ur: 'افراد/اسٹاف' },
  municipalityFees: { en: 'Municipality Fees', ar: 'رسوم البلدية', bn: 'পৌরসভা ফি', ur: 'بلدیہ فیس' },
  maintenance2: { en: 'Maintenance', ar: 'الصيانة', bn: 'রক্ষণাবেক্ষণ', ur: 'دیکھ بھال' },
  utilities: { en: 'Utilities', ar: 'المرافق', bn: 'ইউটিলিটি', ur: 'سہولیات' },
  leasingCommission: { en: 'Leasing Commission', ar: 'عمولة التأجير', bn: 'লিজিং কমিশন', ur: 'لیزنگ کمیشن' },
  insurance: { en: 'Insurance', ar: 'التأمين', bn: 'বীমা', ur: 'انشورنس' },
  security: { en: 'Security', ar: 'الأمن', bn: 'নিরাপত্তা', ur: 'سیکیورٹی' },
  deleteExpense: { en: 'Delete this expense?', ar: 'حذف هذا المصروف؟', bn: 'এই ব্যয় মুছে ফেলবেন?', ur: 'یہ اخراجات حذف کریں؟' },

  // Reports (Owner/Admin only)
  monthlyReport: { en: 'Monthly Report', ar: 'التقرير الشهري', bn: 'মাসিক প্রতিবেদন', ur: 'ماہانہ رپورٹ' },
  revenueAnalysis: { en: 'Revenue Analysis', ar: 'تحليل الإيرادات', bn: 'রাজস্ব বিশ্লেষণ', ur: 'آمدنی کا تجزیہ' },
  profitAndLoss: { en: 'Profit & Loss', ar: 'الأرباح والخسائر', bn: 'লাভ ও ক্ষতি', ur: 'منافع اور نقصان' },
  rentalIncome: { en: 'Rental Income', ar: 'دخل الإيجارات', bn: 'ভাড়া আয়', ur: 'کرایے کی آمدنی' },
  otherIncome: { en: 'Other Income', ar: 'دخل آخر', bn: 'অন্যান্য আয়', ur: 'دیگر آمدنی' },
  grossRevenue: { en: 'Gross Revenue', ar: 'الإيرادات الإجمالية', bn: 'সমষ্টিগত রাজস্ব', ur: 'کل آمدنی' },
  netRevenue: { en: 'Net Revenue', ar: 'الإيرادات الصافية', bn: 'নিট রাজস্ব', ur: 'خالص آمدنی' },
  vacancyLoss: { en: 'Vacancy Loss', ar: 'خسارة الشغور', bn: 'শূন্যতা ক্ষতি', ur: 'خالی جگہ کا نقصان' },
  badDebt: { en: 'Bad Debt / Unpaid', ar: 'ديون معدومة / غير مدفوعة', bn: 'খেলাপি ঋণ / অবৈতনিক', ur: 'خراب قرضہ / غیر ادا شدہ' },
  costOfOperations: { en: 'Cost of Operations', ar: 'تكلفة العمليات', bn: 'পরিচালন ব্যয়', ur: 'آپریشن کی لاگت' },
  collectionRate: { en: 'Collection Rate', ar: 'نسبة التحصيل', bn: 'আদায় হার', ur: 'وصولی کی شرح' },

  // Contracts
  contractTracker: { en: 'Contract Tracker', ar: 'متتبع العقود', bn: 'চুক্তি ট্র্যাকার', ur: 'معاہدہ ٹریکر' },
  expiringSoon: { en: 'Expiring Soon', ar: 'ينتهي قريباً', bn: 'শীঘ্রই মেয়াদ শেষ', ur: 'جلد ختم ہو رہا' },
  expired: { en: 'Expired', ar: 'منتهي', bn: 'মেয়াদোত্তীর্ণ', ur: 'ختم شدہ' },
  renewed: { en: 'Renewed', ar: 'مجدّد', bn: 'নবায়নকৃত', ur: 'تجدید شدہ' },
  terminated: { en: 'Terminated', ar: 'ملغى', bn: 'বাতিল', ur: 'ختم شدہ' },
  daysUntilExpiry: { en: 'Days Until Expiry', ar: 'أيام حتى الانتهاء', bn: 'মেয়াদ শেষ পর্যন্ত দিন', ur: 'اختتام تک دن' },
  renewalStatus: { en: 'Renewal Status', ar: 'حالة التجديد', bn: 'নবায়ন অবস্থা', ur: 'تجدید کی حالت' },
  newRent: { en: 'New Rent (AED)', ar: 'الإيجار الجديد (درهم)', bn: 'নতুন ভাড়া (দিরহাম)', ur: 'نیا کرایہ (درہم)' },
  noContracts: { en: 'No contracts found', ar: 'لا توجد عقود', bn: 'কোনো চুক্তি পাওয়া যায়নি', ur: 'کوئی معاہدہ نہیں ملا' },

  // General
  actions: { en: 'Actions', ar: 'إجراءات', bn: 'কার্যক্রম', ur: 'اقدامات' },
  select: { en: 'Select', ar: 'اختر', bn: 'নির্বাচন', ur: 'منتخب' },
  none: { en: 'None', ar: 'بدون', bn: 'কোনোটিই নয়', ur: 'کوئی نہیں' },
  language: { en: 'Language', ar: 'اللغة', bn: 'ভাষা', ur: 'زبان' },
  lastPayment: { en: 'Last Payment', ar: 'آخر دفعة', bn: 'শেষ পেমেন্ট', ur: 'آخری ادائیگی' },
  propertyUnit: { en: 'Property / Unit', ar: 'العقار / الوحدة', bn: 'সম্পত্তি / ইউনিট', ur: 'پراپرٹی / یونٹ' },
  loading: { en: 'Loading...', ar: 'جارٍ التحميل...', bn: 'লোড হচ্ছে...', ur: 'لوڈ ہو رہا ہے...' },
  noResults: { en: 'No results found', ar: 'لم يتم العثور على نتائج', bn: 'কোনো ফলাফল পাওয়া যায়নি', ur: 'کوئی نتیجہ نہیں ملا' },
  vacateUnit: { en: 'Vacate Unit', ar: 'إخلاء الوحدة', bn: 'ইউনিট খালি করুন', ur: 'یونٹ خالی کریں' },
  addBuilding: { en: 'Add Building', ar: 'إضافة مبنى', bn: 'ভবন যোগ করুন', ur: 'عمارت شامل کریں' },
  propertySoldInfo: { en: 'When a building is sold or removed, it can be archived. Data is preserved for historical reports.', ar: 'عند بيع أو إزالة مبنى، يمكن أرشفته. يتم حفظ البيانات للتقارير التاريخية.', bn: 'কোনো ভবন বিক্রি বা অপসারিত হলে, এটি সংরক্ষণাগারে রাখা যায়। ঐতিহাসিক প্রতিবেদনের জন্য ডেটা সংরক্ষিত থাকে।', ur: 'جب عمارت فروخت یا ہٹا دی جاتی ہے، تو اسے آرکائیو کیا جا سکتا ہے۔ تاریخی رپورٹس کے لیے ڈیٹا محفوظ رہتا ہے۔' },
  accessDenied: { en: 'Access Denied - Financial data is only visible to Owner/Admin', ar: 'تم رفض الوصول - البيانات المالية مرئية فقط للمالك/المدير', bn: 'অ্যাক্সেস অস্বীকৃত - আর্থিক তথ্য শুধুমাত্র মালিক/প্রশাসকের দৃশ্যমান', ur: 'رسائی مسترد - مالیاتی ڈیٹا صرف مالک/ایڈمن کو نظر آتا ہے' },
  financialDataProtected: { en: 'Financial data is protected and only visible to the business owner and admin.', ar: 'البيانات المالية محمية ومرئية فقط لصاحب العمل والمدير.', bn: 'আর্থিক তথ্য সুরক্ষিত এবং শুধুমাত্র ব্যবসার মালিক এবং প্রশাসকের দৃশ্যমান।', ur: 'مالیاتی ڈیٹا محفوظ ہے اور صرف کاروبار کے مالک اور ایڈمن کو نظر آتا ہے۔' },

  // Additional keys for Maintenance, Expenses, Reports
  invoiceNumber: { en: 'Invoice Number', ar: 'رقم الفاتورة', bn: 'চালান নম্বর', ur: 'انوائس نمبر' },
  printReport: { en: 'Print Report', ar: 'طباعة التقرير', bn: 'প্রতিবেদন মুদ্রণ', ur: 'رپورٹ پرنٹ کریں' },
  thisMonthTotal: { en: 'This Month Total', ar: 'إجمالي هذا الشهر', bn: 'এই মাসের মোট', ur: 'اس مہینے کا کل' },
  expenseDetails: { en: 'Expense Details', ar: 'تفاصيل المصروفات', bn: 'ব্যয়ের বিস্তারিত', ur: 'اخراجات کی تفصیلات' },
  noExpensesMonth: { en: 'No expenses this month', ar: 'لا مصروفات هذا الشهر', bn: 'এই মাসে কোনো ব্যয় নেই', ur: 'اس مہینے کوئی اخراجات نہیں' },
  revenue: { en: 'Revenue', ar: 'الإيرادات', bn: 'রাজস্ব', ur: 'آمدنی' },
  profitOrLoss: { en: 'Profit / Loss', ar: 'الربح / الخسارة', bn: 'লাভ / ক্ষতি', ur: 'منافع / نقصان' },
  sixMonthTrend: { en: '6-Month Trend', ar: 'اتجاه 6 أشهر', bn: '6-মাস প্রবণতা', ur: '6 ماہ کا رجحان' },
  date: { en: 'Date', ar: 'التاريخ', bn: 'তারিখ', ur: 'تاریخ' },
  noExpensesFound: { en: 'No expenses found', ar: 'لم يتم العثور على مصروفات', bn: 'কোনো ব্যয় পাওয়া যায়নি', ur: 'کوئی اخراجات نہیں ملا' },
  expenseBreakdown: { en: 'Expense Breakdown', ar: 'توزيع المصروفات', bn: 'ব্যয় বিশ্লেষণ', ur: 'اخراجات کی تقسیم' },
  monthlyTrend: { en: 'Monthly Trend', ar: 'الاتجاه الشهري', bn: 'মাসিক প্রবণতা', ur: 'ماہانہ رجحان' },
  tasksCount: { en: 'tasks', ar: 'مهام', bn: 'টি কাজ', ur: 'ٹاسکس' },
  expensesCount: { en: 'expenses tracked', ar: 'مصروفات مسجلة', bn: 'টি ব্যয় ট্র্যাক করা', ur: 'اخراجات ٹریکڈ' },
  property: { en: 'Property', ar: 'العقار', bn: 'সম্পত্তি', ur: 'پراپرٹی' },
  totalRevenue: { en: 'Total Revenue', ar: 'إجمالي الإيرادات', bn: 'মোট রাজস্ব', ur: 'کل آمدنی' },
  operatingExpenses: { en: 'Operating Expenses', ar: 'المصروفات التشغيلية', bn: 'পরিচালন ব্যয়', ur: 'آپریٹنگ اخراجات' },
  grossProfit: { en: 'Gross Profit', ar: 'الربح الإجمالي', bn: 'সমষ্টিগত মুনাফা', ur: 'کل منافع' },
  netIncome: { en: 'Net Income', ar: 'صافي الدخل', bn: 'নিট আয়', ur: 'خالص آمدنی' },
  salary: { en: 'Salary / Wages', ar: 'الرواتب / الأجور', bn: 'বেতন / মজুরি', ur: 'تنخواہ / اجرت' },
  yes: { en: 'Yes', ar: 'نعم', bn: 'হ্যাঁ', ur: 'ہاں' },
  no: { en: 'No', ar: 'لا', bn: 'না', ur: 'نہیں' },
} as const

export type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, lang: Language): string {
  return translations[key]?.[lang] || translations[key]?.en || key
}

export function getNameByLang(obj: { name: string; nameAr?: string | null; nameBn?: string | null; nameUr?: string | null }, lang: Language): string {
  if (lang === 'ar' && obj.nameAr) return obj.nameAr
  if (lang === 'bn' && obj.nameBn) return obj.nameBn
  if (lang === 'ur' && obj.nameUr) return obj.nameUr
  return obj.name
}

export function getMonthName(month: number, lang: Language = 'en'): string {
  const months: Record<Language, string[]> = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    bn: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
    ur: ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'],
  }
  return months[lang]?.[month - 1] || months.en[month - 1]
}

export function getWhatsAppLink(phone: string, name: string, amount: number, month: number, year: number, lang: Language = 'en'): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const monthName = getMonthName(month, lang)
  const amountStr = new Intl.NumberFormat('en-AE').format(amount) + ' AED'

  const messages: Record<Language, string> = {
    en: `Dear ${name}, this is a reminder that your rent of ${amountStr} for ${monthName} ${year} is overdue. Please arrange payment at your earliest convenience. — Al Reef Al Janoubi`,
    ar: `عزيزي ${name}، تذكير بأن إيجارك بمبلغ ${amountStr} لشهر ${monthName} ${year} متأخر. يرجى ترتيب الدفع في أقرب وقت ممكن. — الريف الجنوبي`,
    bn: `প্রিয় ${name}, এটি স্মরণ করিয়ে দিচ্ছে যে আপনার ${monthName} ${year} এর জন্য ${amountStr} ভাড়া বকেয়া রয়েছে। দয়া করে শীঘ্রই পেমেন্টের ব্যবস্থা করুন। — আল রিফ আল জানুবি`,
    ur: `محترم ${name}، یہ یاد دہانی ہے کہ آپ کا ${monthName} ${year} کے لیے ${amountStr} کرایہ باقاعدہ ہے۔ براہ کرم جلد ادائیگی کا بندوبست کریں۔ — الريف الجنوبی`,
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messages[lang] || messages.en)}`
}

export function getTenantScoreLabel(score: number, lang: Language): string {
  if (score >= 80) return t('scoreExcellent', lang)
  if (score >= 60) return t('scoreGood', lang)
  if (score >= 40) return t('scoreWarning', lang)
  return t('scorePoor', lang)
}

export function getTenantScoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500 text-white'
  if (score >= 60) return 'bg-blue-500 text-white'
  if (score >= 40) return 'bg-amber-500 text-white'
  return 'bg-red-500 text-white'
}

export function calculateTenantScore(latePaymentCount: number, totalPayments: number): number {
  if (totalPayments === 0) return 100
  const onTimeRate = (totalPayments - latePaymentCount) / totalPayments
  return Math.round(onTimeRate * 100)
}

export function getPropertyTypeLabel(type: string, lang: Language): string {
  switch (type) {
    case 'apartment': return t('apartment', lang)
    case 'villa': return t('villa', lang)
    case 'office': return t('office', lang)
    case 'shop': return t('shop', lang)
    case 'studio': return t('studio', lang)
    case 'mixed_use': return t('mixedUse', lang)
    default: return type
  }
}

export function getMaintenanceCategoryLabel(category: string, lang: Language): string {
  switch (category) {
    case 'ac': return t('ac', lang)
    case 'plumbing': return t('plumbing', lang)
    case 'electrical': return t('electrical', lang)
    case 'lock_door': return t('lockDoor', lang)
    case 'painting': return t('painting', lang)
    case 'structural': return t('structural', lang)
    case 'other': return t('other', lang)
    default: return category
  }
}

export function getExpenseCategoryLabel(category: string, lang: Language): string {
  switch (category) {
    case 'manpower': return t('manpower', lang)
    case 'salary': return t('salary', lang)
    case 'municipality': return t('municipalityFees', lang)
    case 'maintenance': return t('maintenance2', lang)
    case 'utility': case 'utilities': return t('utilities', lang)
    case 'leasing': return t('leasingCommission', lang)
    case 'insurance': return t('insurance', lang)
    case 'security': return t('security', lang)
    case 'other': return t('other', lang)
    default: return category
  }
}
