'use client'

import { useEffect, useState } from 'react'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { t, rtlLanguages } from '@/lib/i18n'
import Login from '@/components/login'
import Sidebar from '@/components/sidebar'
import Dashboard from '@/components/dashboard'
import Properties from '@/components/properties'
import Tenants from '@/components/tenants'
import RentCollection from '@/components/rent-collection'
import Maintenance from '@/components/maintenance'
import Expenses from '@/components/expenses'
import Reports from '@/components/reports'
import Contracts from '@/components/contracts'

export default function Home() {
  const { isAuthenticated, authUser, currentPage, sidebarOpen, language, setSidebarOpen } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)

  // Set direction based on language
  useEffect(() => {
    document.documentElement.dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  // Handle responsive sidebar
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [setSidebarOpen])

  // Show login page if not authenticated
  if (!isAuthenticated || !authUser) {
    return <Login />
  }

  const isFinancialUser = isOwnerOrAdmin(authUser.role)

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'properties': return <Properties />
      case 'tenants': return <Tenants />
      case 'rent': return <RentCollection />
      case 'maintenance': return <Maintenance />
      case 'expenses': return isFinancialUser ? <Expenses /> : <AccessDenied />
      case 'reports': return isFinancialUser ? <Reports /> : <AccessDenied />
      case 'contracts': return <Contracts />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />
      <main
        className="transition-all duration-300 min-h-screen"
        style={{
          marginLeft: !isMobile && sidebarOpen ? '256px' : isMobile ? '0' : '0',
        }}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

function AccessDenied() {
  const { language } = useAppStore()

  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-foreground">{t('accessDenied', language)}</h2>
      <p className="text-muted-foreground text-sm text-center max-w-md">{t('financialDataProtected', language)}</p>
    </div>
  )
}
