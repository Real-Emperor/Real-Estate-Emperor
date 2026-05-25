import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAED(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' AED'
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getMonthName(month: number, lang: 'en' | 'ar' = 'en'): string {
  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  return lang === 'ar' ? monthsAr[month - 1] : monthsEn[month - 1]
}

export function getMonthShort(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month - 1] || ''
}

export function getWhatsAppLink(phone: string, name: string, amount: number, month: number, year: number, lang: 'en' | 'ar' = 'en'): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const monthName = getMonthName(month, lang)

  let message: string
  if (lang === 'ar') {
    message = `عزيزي ${name}، تذكير بأن إيجارك بمبلغ ${amount} درهم لشهر ${monthName} ${year} متأخر. يرجى ترتيب الدفع في أقرب وقت ممكن. — الريف الجنوبي`
  } else {
    message = `Dear ${name}, this is a reminder that your rent of ${formatAED(amount)} for ${monthName} ${year} is overdue. Please arrange payment at your earliest convenience. — Al Reef Al Janoubi`
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function getPropertyTypeLabel(type: string, lang: 'en' | 'ar' = 'en'): string {
  const types: Record<string, { en: string; ar: string }> = {
    apartment: { en: 'Apartment', ar: 'شقة' },
    villa: { en: 'Villa', ar: 'فيلا' },
    office: { en: 'Office', ar: 'مكتب' },
    shop: { en: 'Shop', ar: 'محل' },
  }
  return types[type]?.[lang] || type
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'evicted': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getPaymentStatusColor(status: 'paid' | 'overdue' | 'partial' | 'inactive' | 'due-soon'): string {
  switch (status) {
    case 'paid': return 'bg-emerald-500 text-white'
    case 'overdue': return 'bg-red-500 text-white'
    case 'partial': return 'bg-amber-500 text-white'
    case 'due-soon': return 'bg-yellow-400 text-gray-900'
    case 'inactive': return 'bg-gray-300 text-gray-600'
    default: return 'bg-gray-300 text-gray-600'
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-500 text-white'
    case 'high': return 'bg-orange-500 text-white'
    case 'medium': return 'bg-amber-500 text-white'
    case 'low': return 'bg-emerald-500 text-white'
    default: return 'bg-gray-400 text-white'
  }
}

export function getMaintenanceStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'utility': return '⚡'
    case 'maintenance': return '🔧'
    case 'insurance': return '🛡️'
    case 'salary': return '👤'
    case 'other': return '📦'
    default: return '📦'
  }
}
