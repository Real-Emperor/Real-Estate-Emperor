'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import Sidebar from '@/components/sidebar'
import Dashboard from '@/components/dashboard'
import Properties from '@/components/properties'
import Tenants from '@/components/tenants'
import RentCollection from '@/components/rent-collection'
import Maintenance from '@/components/maintenance'
import Expenses from '@/components/expenses'
import Reports from '@/components/reports'

export default function Home() {
  const { currentPage, sidebarOpen, language, setSidebarOpen } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)

  // Set direction based on language
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
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

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'properties': return <Properties />
      case 'tenants': return <Tenants />
      case 'rent': return <RentCollection />
      case 'maintenance': return <Maintenance />
      case 'expenses': return <Expenses />
      case 'reports': return <Reports />
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
