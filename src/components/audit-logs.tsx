'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, isOwnerOrAdmin } from '@/lib/store'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Shield,
  Search,
  Download,
  Clock,
  User,
  Building2,
  Users,
  DollarSign,
  Wrench,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
} from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  userId: string | null
  details: any
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-800',
  LOGIN_FAILED: 'bg-red-100 text-red-800',
  LOGIN_LOCKED: 'bg-red-200 text-red-900',
  CREATE: 'bg-blue-100 text-blue-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
  ARCHIVE: 'bg-gray-100 text-gray-800',
  UNARCHIVE: 'bg-gray-100 text-gray-800',
  IMPORT: 'bg-purple-100 text-purple-800',
  IMPORT_FILE: 'bg-purple-100 text-purple-800',
  SEED: 'bg-indigo-100 text-indigo-800',
  BACKUP: 'bg-teal-100 text-teal-800',
  RESTORE_START: 'bg-orange-100 text-orange-800',
  RESTORE_COMPLETE: 'bg-green-100 text-green-800',
}

const ENTITY_ICONS: Record<string, any> = {
  User: Users,
  Property: Building2,
  Tenant: User,
  Payment: DollarSign,
  Expense: FileText,
  Maintenance: Wrench,
  Company: Building2,
}

export default function AuditLogs() {
  const { authUser, language } = useAppStore()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (actionFilter && actionFilter !== 'all') params.set('action', actionFilter)
      if (entityFilter && entityFilter !== 'all') params.set('entity', entityFilter)

      const res = await fetch(`/api/audit-logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [actionFilter, entityFilter])

  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  const handleExportLogs = async () => {
    try {
      const params = new URLSearchParams({ page: '1', limit: '10000' })
      if (actionFilter && actionFilter !== 'all') params.set('action', actionFilter)
      if (entityFilter && entityFilter !== 'all') params.set('entity', entityFilter)

      const res = await fetch(`/api/audit-logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        const csvRows = [
          ['Date', 'Action', 'Entity', 'Entity ID', 'User', 'Details'].join(','),
          ...data.logs.map((log: AuditLog) => [
            new Date(log.createdAt).toLocaleString(),
            log.action,
            log.entity,
            log.entityId || '',
            log.user?.name || log.userId || 'System',
            JSON.stringify(log.details || {}).replace(/,/g, ';'),
          ].join(','))
        ].join('\n')

        const blob = new Blob([csvRows], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Failed to export logs:', err)
    }
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const filteredLogs = searchQuery
    ? logs.filter(log =>
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : logs

  if (!authUser || !isOwnerOrAdmin(authUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t('accessDenied', language)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-deep-teal" />
            Audit Log
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track all actions and changes in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.page)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            disabled={logs.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="LOGIN">Login</SelectItem>
            <SelectItem value="LOGIN_FAILED">Failed Login</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
            <SelectItem value="IMPORT_FILE">Import</SelectItem>
            <SelectItem value="BACKUP">Backup</SelectItem>
            <SelectItem value="RESTORE_COMPLETE">Restore</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="User">Users</SelectItem>
            <SelectItem value="Property">Properties</SelectItem>
            <SelectItem value="Tenant">Tenants</SelectItem>
            <SelectItem value="Payment">Payments</SelectItem>
            <SelectItem value="Expense">Expenses</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Company">Company</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <div className="border rounded-xl bg-white">
        <ScrollArea className="h-[calc(100vh-320px)]">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No audit logs found</p>
              <p className="text-sm">Actions will appear here as users interact with the system</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log) => {
                const EntityIcon = ENTITY_ICONS[log.entity] || FileText
                const actionColor = ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <EntityIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={actionColor}>
                          {formatAction(log.action)}
                        </Badge>
                        <span className="text-sm font-medium">{log.entity}</span>
                        {log.user && (
                          <span className="text-xs text-muted-foreground">
                            by {log.user.name} ({log.user.role})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {log.details ? JSON.stringify(log.details).substring(0, 120) : 'No details'}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Log Detail
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <Badge className={ACTION_COLORS[selectedLog.action] || 'bg-gray-100 text-gray-800'}>
                    {formatAction(selectedLog.action)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entity</p>
                  <p className="text-sm font-medium">{selectedLog.entity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">User</p>
                  <p className="text-sm">{selectedLog.user?.name || 'System'}</p>
                  {selectedLog.user?.email && (
                    <p className="text-xs text-muted-foreground">{selectedLog.user.email}</p>
                  )}
                </div>
              </div>
              {selectedLog.entityId && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Entity ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{selectedLog.entityId}</code>
                </div>
              )}
              {selectedLog.details && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Details</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
