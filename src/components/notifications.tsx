'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { t, rtlLanguages } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  CheckCircle2,
  CreditCard,
  AlertTriangle,
  FileText,
  Wrench,
  Info,
  X,
} from 'lucide-react'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  data: string | null
  read: boolean
  createdAt: string
}

export default function Notifications() {
  const { language, authUser } = useAppStore()
  const isRtl = rtlLanguages.includes(language)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    if (!authUser) return
    try {
      setLoading(true)
      const res = await fetch('/api/notifications?limit=30')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authUser) {
      fetchNotifications()
      // Poll every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [authUser])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (e) {
      console.error('Failed to mark as read:', e)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (e) {
      console.error('Failed to mark all as read:', e)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_receipt':
        return <CreditCard className="w-4 h-4 text-emerald-600" />
      case 'overdue_notice':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'lease_renewal':
        return <FileText className="w-4 h-4 text-amber-600" />
      case 'maintenance_update':
        return <Wrench className="w-4 h-4 text-blue-500" />
      case 'backup_success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      case 'backup_failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'daily_report':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'system':
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'payment_receipt': return 'bg-emerald-50 border-emerald-200'
      case 'overdue_notice': return 'bg-red-50 border-red-200'
      case 'lease_renewal': return 'bg-amber-50 border-amber-200'
      case 'maintenance_update': return 'bg-blue-50 border-blue-200'
      case 'backup_success': return 'bg-emerald-50 border-emerald-200'
      case 'backup_failed': return 'bg-red-50 border-red-200'
      case 'daily_report': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return language === 'ar' ? 'الآن' : language === 'bn' ? 'এইমাত্র' : language === 'ur' ? 'ابھی' : 'Just now'
    if (minutes < 60) return language === 'ar' ? `منذ ${minutes} دقيقة` : language === 'bn' ? `${minutes} মিনিট আগে` : language === 'ur' ? `${minutes} منٹ پہلے` : `${minutes}m ago`
    if (hours < 24) return language === 'ar' ? `منذ ${hours} ساعة` : language === 'bn' ? `${hours} ঘন্টা আগে` : language === 'ur' ? `${hours} گھنٹے پہلے` : `${hours}h ago`
    return language === 'ar' ? `منذ ${days} يوم` : language === 'bn' ? `${days} দিন আগে` : language === 'ur' ? `${days} دن پہلے` : `${days}d ago`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
        }}
        className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        title={language === 'ar' ? 'الإشعارات' : language === 'bn' ? 'বিজ্ঞপ্তি' : language === 'ur' ? 'اطلاعات' : 'Notifications'}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center leading-none animate-notify-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className={cn(
          'absolute top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-border z-50 overflow-hidden',
          isRtl ? 'right-0' : 'left-0'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">
              {language === 'ar' ? 'الإشعارات' : language === 'bn' ? 'বিজ্ঞপ্তি' : language === 'ur' ? 'اطلاعات' : 'Notifications'}
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-deep-teal hover:text-deep-teal/80 font-medium flex items-center gap-1 px-2 py-1 hover:bg-deep-teal/10 rounded transition-all"
                >
                  <CheckCheck className="w-3 h-3" />
                  {language === 'ar' ? 'قراءة الكل' : language === 'bn' ? 'সব পড়ুন' : language === 'ur' ? 'سب پڑھیں' : 'Mark all read'}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <ScrollArea className="max-h-96">
            {loading ? (
              <div className="p-6 text-center">
                <div className="w-6 h-6 border-2 border-deep-teal border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'لا توجد إشعارات' : language === 'bn' ? 'কোনো বিজ্ঞপ্তি নেই' : language === 'ur' ? 'کوئی اطلاعات نہیں' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'px-4 py-3 transition-colors cursor-pointer hover:bg-muted/50',
                      !notification.read && 'bg-deep-teal/5',
                    )}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 border', getNotificationBg(notification.type))}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn('text-sm truncate', !notification.read && 'font-semibold')}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-deep-teal shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
