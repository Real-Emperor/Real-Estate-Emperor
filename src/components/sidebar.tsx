'use client'

import { useAppStore } from '@/lib/store'
import type { PageType } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  Banknote,
  Wrench,
  Receipt,
  BarChart3,
  Moon,
  Languages,
  ChevronLeft,
  Menu,
} from 'lucide-react'

const navItems: { page: PageType; icon: React.ElementType; en: string; ar: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, en: 'Dashboard', ar: 'لوحة التحكم' },
  { page: 'properties', icon: Building2, en: 'Properties', ar: 'العقارات' },
  { page: 'tenants', icon: Users, en: 'Tenants', ar: 'المستأجرون' },
  { page: 'rent', icon: Banknote, en: 'Rent Collection', ar: 'تحصيل الإيجار' },
  { page: 'maintenance', icon: Wrench, en: 'Maintenance', ar: 'الصيانة' },
  { page: 'expenses', icon: Receipt, en: 'Expenses', ar: 'المصروفات' },
  { page: 'reports', icon: BarChart3, en: 'Reports', ar: 'التقارير' },
]

export default function Sidebar() {
  const { currentPage, setCurrentPage, language, setLanguage, sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full islamic-pattern transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-16',
          !sidebarOpen && 'overflow-hidden lg:overflow-visible'
        )}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gold/20 shrink-0">
            <Moon className="w-5 h-5 text-gold" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 animate-fade-in-up">
              <h1 className="text-white font-bold text-sm leading-tight truncate">
                {language === 'ar' ? 'الريف الجنوبي' : 'Al Reef Al Janoubi'}
              </h1>
              <p className="text-white/50 text-xs truncate">
                {language === 'ar' ? 'للعقارات' : 'Real Estate'}
              </p>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto text-white/60 hover:text-white shrink-0 hidden lg:block"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => {
                setCurrentPage(item.page)
                if (window.innerWidth < 1024) toggleSidebar()
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                currentPage === item.page
                  ? 'bg-gold/20 text-gold shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && (
                <span className="truncate">{language === 'ar' ? item.ar : item.en}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/10 p-3 space-y-2 shrink-0">
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <Languages className="w-5 h-5 shrink-0" />
            {sidebarOpen && (
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            )}
          </button>

          {/* User info */}
          {sidebarOpen && (
            <div className="px-3 py-2 animate-fade-in-up">
              <p className="text-white/90 text-sm font-medium">Ahmed Al Janoubi</p>
              <p className="text-white/40 text-xs">Owner</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile menu button */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-40 lg:hidden bg-deep-teal text-white p-2 rounded-lg shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  )
}
