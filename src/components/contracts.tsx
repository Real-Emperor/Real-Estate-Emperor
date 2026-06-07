'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TenantData } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { t, getNameByLang, getMonthName } from '@/lib/i18n'
import { formatAED, formatDate, cn2, isFinanciallyActive } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, FileText, AlertTriangle, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function Contracts() {
  const { language } = useAppStore()
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired' | 'active'>('all')

  const fetchData = useCallback(() => {
    try {
      const tenants = useDataStore.getState().getTenantsWithRelations()
      setTenants(tenants)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const now = new Date()

  const getContractStatus = (tenant: TenantData): 'active' | 'expiring' | 'expired' | 'no-contract' => {
    if (!tenant.leaseEnd) return 'no-contract'
    const endDate = new Date(tenant.leaseEnd)
    const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil < 0) return 'expired'
    if (daysUntil <= 60) return 'expiring'
    return 'active'
  }

  const getDaysUntilExpiry = (leaseEnd: string | null): number | null => {
    if (!leaseEnd) return null
    return Math.ceil((new Date(leaseEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const filtered = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      (tenant.nameAr && tenant.nameAr.includes(search)) ||
      (tenant.nameBn && tenant.nameBn.includes(search)) ||
      tenant.unitNumber?.toLowerCase().includes(search.toLowerCase()) ||
      tenant.emiratesId?.includes(search)

    const status = getContractStatus(tenant)
    const matchesFilter = filter === 'all' || filter === status

    return matchesSearch && matchesFilter && isFinanciallyActive(tenant.status)
  })

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
  }

  const expiringCount = tenants.filter(t => getContractStatus(t) === 'expiring').length
  const expiredCount = tenants.filter(t => getContractStatus(t) === 'expired').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('contractTracker', language)}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {tenants.filter(t => isFinanciallyActive(t.status)).length} {t('activeTenants', language).toLowerCase()}
        </p>
      </div>

      {/* Alert for expiring/expired */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {expiringCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-amber-800">{expiringCount} {t('expiringSoon', language)}</p>
                <p className="text-amber-600 text-sm">{t('daysUntilExpiry', language)} &lt; 60</p>
              </div>
            </div>
          )}
          {expiredCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-red-800">{expiredCount} {t('expired', language)}</p>
                <p className="text-red-600 text-sm">{t('renewalStatus', language)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchTenants', language)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'expiring', 'expired'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-deep-teal hover:bg-deep-teal/90 text-white' : ''}
            >
              {f === 'all' && t('all', language)}
              {f === 'active' && t('active', language)}
              {f === 'expiring' && t('expiringSoon', language)}
              {f === 'expired' && t('expired', language)}
            </Button>
          ))}
        </div>
      </div>

      {/* Contract cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {filtered.map(tenant => {
          const contractStatus = getContractStatus(tenant)
          const daysUntil = getDaysUntilExpiry(tenant.leaseEnd)

          return (
            <Card key={tenant.id} className={cn2(
              'card-hover',
              contractStatus === 'expired' && 'ring-1 ring-red-300',
              contractStatus === 'expiring' && 'ring-1 ring-amber-300'
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn2(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      contractStatus === 'active' ? 'bg-emerald/10' : contractStatus === 'expiring' ? 'bg-amber-100' : 'bg-red-100'
                    )}>
                      <FileText className={cn2(
                        'w-4 h-4',
                        contractStatus === 'active' ? 'text-emerald' : contractStatus === 'expiring' ? 'text-amber-500' : 'text-red-500'
                      )} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{getNameByLang(tenant, language)}</h3>
                      <p className="text-xs text-muted-foreground">{tenant.unitNumber || '—'}</p>
                    </div>
                  </div>
                  <Badge className={cn2(
                    'text-xs',
                    contractStatus === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    contractStatus === 'expiring' ? 'bg-amber-100 text-amber-800' :
                    contractStatus === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  )}>
                    {contractStatus === 'active' && <><CheckCircle className="w-3 h-3 mr-1" />{t('active', language)}</>}
                    {contractStatus === 'expiring' && <><Clock className="w-3 h-3 mr-1" />{t('expiringSoon', language)}</>}
                    {contractStatus === 'expired' && <><XCircle className="w-3 h-3 mr-1" />{t('expired', language)}</>}
                    {contractStatus === 'no-contract' && t('noContracts', language)}
                  </Badge>
                  {tenant.status === 'notice' && (
                    <Badge className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-100 px-1.5 py-0 ml-1">
                      {t('noticePeriod', language)}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('monthlyRent', language)}</span>
                    <span className="font-semibold">{formatAED(tenant.rentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('leaseStart', language)}</span>
                    <span>{tenant.leaseStart ? formatDate(tenant.leaseStart) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('leaseEnd', language)}</span>
                    <span className={contractStatus === 'expired' ? 'text-red-600 font-semibold' : ''}>
                      {tenant.leaseEnd ? formatDate(tenant.leaseEnd) : '—'}
                    </span>
                  </div>
                  {daysUntil !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('daysUntilExpiry', language)}</span>
                      <span className={cn2(
                        'font-bold',
                        daysUntil < 0 ? 'text-red-600' : daysUntil <= 30 ? 'text-amber-600' : 'text-emerald'
                      )}>
                        {daysUntil < 0 ? `${Math.abs(daysUntil)} days past` : `${daysUntil} days`}
                      </span>
                    </div>
                  )}
                  {tenant.emiratesId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('emiratesId', language)}</span>
                      <span className="text-xs">{tenant.emiratesId}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('tenantScore', language)}</span>
                    <Badge className={cn2(
                      'text-xs',
                      tenant.tenantScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                      tenant.tenantScore >= 60 ? 'bg-blue-100 text-blue-800' :
                      tenant.tenantScore >= 40 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {tenant.tenantScore}/100
                    </Badge>
                  </div>
                </div>

                {/* Geometric divider */}
                <div className="geometric-divider my-3" />

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{tenant.property?.name || '—'}</span>
                  <span>•</span>
                  <span>{tenant.nationality || '—'}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t('noContracts', language)}
        </div>
      )}
    </div>
  )
}
