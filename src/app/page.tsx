'use client'

import { useEffect, useState, useCallback } from 'react'
import { SessionProvider, useSession, signOut } from 'next-auth/react'
import { useAppStore, isOwnerOrAdmin, isAdminOnly } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { t, rtlLanguages } from '@/lib/i18n'
import Login from '@/components/login'
import Sidebar from '@/components/sidebar'
import Dashboard from '@/components/dashboard'
import Properties from '@/components/properties'
import Tenants from '@/components/tenants'
import RentCollection from '@/components/rent-collection'
import Maintenance from '@/components/maintenance'
import Expenses from '@/components/expenses'
import RecurringBills from '@/components/recurring-bills'
import DailyExpensesReport from '@/components/daily-expenses-report'
import Reports from '@/components/reports'
import Contracts from '@/components/contracts'
import Reservations from '@/components/reservations'
import UserManagement from '@/components/user-management'
import SystemManagement from '@/components/system-management'
import SettingsPage from '@/components/settings-page'
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react'

function AppContent() {
  const { data: session, status } = useSession()
  const { isAuthenticated, authUser, currentPage, sidebarOpen, language, setSidebarOpen, login, logout } = useAppStore()
  const { fetchAllData, isInitialized } = useDataStore()
  const [isMobile, setIsMobile] = useState(false)

  // Sync NextAuth session with Zustand store
  // CRITICAL: When status becomes 'unauthenticated', immediately clear auth state
  // This ensures the login page is shown without any race condition
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const sessionUser = session.user as any
      login({
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.name || '',
        nameAr: sessionUser.nameAr,
        nameBn: sessionUser.nameBn,
        nameUr: sessionUser.nameUr,
        role: sessionUser.role,
        companyId: sessionUser.companyId,
        mustChangePassword: sessionUser.mustChangePassword,
      })
    } else if (status === 'unauthenticated') {
      logout()
    }
    // When status is 'loading', don't change auth state — avoid flash
  }, [status, session, login, logout])

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      fetchAllData()
    }
  }, [isAuthenticated, isInitialized, fetchAllData])

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

  // Show loading while session is being checked
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-deep-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated || !authUser) {
    return <Login />
  }

  // Show loading while data is being fetched
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-deep-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    )
  }

  // Must change password — show change password dialog before allowing dashboard access
  if (authUser?.mustChangePassword) {
    return <ChangePasswordDialog />
  }

  const isFinancialUser = isOwnerOrAdmin(authUser.role)
  const isSystemAdmin = isAdminOnly(authUser.role)

  const renderPage = () => {
    const pageContent = (() => {
      switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'properties': return <Properties />
      case 'tenants': return <Tenants />
      case 'reservations': return <Reservations />
      case 'rent': return <RentCollection />
      case 'maintenance': return <Maintenance />
      case 'expenses': return <Expenses />
      case 'recurring-bills': return <RecurringBills />
      case 'daily-report': return isFinancialUser ? <DailyExpensesReport /> : <AccessDenied />
      case 'reports': return isFinancialUser ? <Reports /> : <AccessDenied />
      case 'contracts': return <Contracts />
      case 'settings': return isSystemAdmin ? <SettingsPage /> : <AccessDenied type="admin" />
      case 'system': return isSystemAdmin ? <SystemManagement /> : <AccessDenied type="admin" />
      default: return <Dashboard />
    }
    })()

    return (
      <div key={currentPage} className="animate-page-slide">
        {pageContent}
      </div>
    )
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

function AccessDenied({ type = 'financial' }: { type?: 'financial' | 'admin' }) {
  const { language } = useAppStore()

  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-foreground">{t('accessDenied', language)}</h2>
      <p className="text-muted-foreground text-sm text-center max-w-md">
        {type === 'admin'
          ? t('adminDataProtected', language)
          : t('financialDataProtected', language)
        }
      </p>
    </div>
  )
}

// Change Password Dialog — shown when mustChangePassword is true
function ChangePasswordDialog() {
  const { authUser, language, login, logout } = useAppStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError(language === 'en' ? 'Passwords do not match' : 'Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError(language === 'en' ? 'Password must be at least 8 characters' : 'Password must be at least 8 characters')
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError(language === 'en' ? 'Password must contain at least one uppercase letter' : 'Password must contain at least one uppercase letter')
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setError(language === 'en' ? 'Password must contain at least one number' : 'Password must contain at least one number')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to change password')
        return
      }

      setSuccess(true)
      // Update authUser to clear mustChangePassword after short delay
      setTimeout(() => {
        if (authUser) {
          login({ ...authUser, mustChangePassword: false })
        }
      }, 1500)
    } catch {
      setError('Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [currentPassword, newPassword, confirmPassword, language, authUser, login])

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Password Changed Successfully</h2>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-border p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <KeyRound className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Change Your Password</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Your administrator requires you to set a new password before continuing.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm"
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Min 8 characters, at least 1 uppercase letter and 1 number
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full bg-deep-teal hover:bg-deep-teal/90 text-white h-11 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Change Password'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t text-center">
          <button
            type="button"
            onClick={() => { logout(); signOut({ redirect: false }) }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
      <AppContent />
    </SessionProvider>
  )
}
