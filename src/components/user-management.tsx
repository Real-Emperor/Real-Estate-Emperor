'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import type { LocalUser, ResetRequest } from '@/lib/data-store'
import { t, getNameByLang } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
  Shield,
  User,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Bell,
  BellRing,
  Clock,
  Check,
  X,
  MessageSquare,
} from 'lucide-react'

export default function UserManagement() {
  const { language, authUser } = useAppStore()
  const { users, resetRequests, addUser, updateUser, deleteUser, resetUserPassword, generateRandomPassword, resolveResetRequest, dismissResetRequest } = useDataStore()
  const lang = language as Language

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  // Active tab: 'users' or 'requests'
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users')

  // Add user form
  const [newName, setNewName] = useState('')
  const [newNameAr, setNewNameAr] = useState('')
  const [newNameBn, setNewNameBn] = useState('')
  const [newNameUr, setNewNameUr] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'owner' | 'admin' | 'staff'>('staff')
  const [newPassword, setNewPassword] = useState('')
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; name: string } | null>(null)

  // Edit user form
  const [editName, setEditName] = useState('')
  const [editNameAr, setEditNameAr] = useState('')
  const [editNameBn, setEditNameBn] = useState('')
  const [editNameUr, setEditNameUr] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<'owner' | 'admin' | 'staff'>('staff')

  // Reset password
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetCredentials, setResetCredentials] = useState<{ email: string; password: string } | null>(null)

  const pendingRequests = resetRequests.filter(r => r.status === 'pending')
  const resolvedRequests = resetRequests.filter(r => r.status !== 'pending')

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Shield className="w-4 h-4 text-purple-600" />
    if (role === 'owner') return <ShieldCheck className="w-4 h-4 text-emerald-600" />
    return <User className="w-4 h-4 text-muted-foreground" />
  }

  const getRoleLabel = (role: string) => {
    if (role === 'owner') return t('ownerRole', lang)
    if (role === 'admin') return t('adminRole', lang)
    return t('staffRole', lang)
  }

  const getRoleBadgeClass = (role: string) => {
    if (role === 'admin') return 'bg-purple-100 text-purple-700 border-purple-200'
    if (role === 'owner') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const handleAddUser = () => {
    if (users.some(u => u.email === newEmail)) {
      alert(t('emailAlreadyExists', lang))
      return
    }

    const password = newPassword || generateRandomPassword()
    const user = addUser({
      email: newEmail,
      password,
      name: newName,
      nameAr: newNameAr,
      nameBn: newNameBn,
      nameUr: newNameUr,
      role: newRole,
      companyId: 'company-1',
    })

    setCreatedCredentials({ email: newEmail, password, name: newName })
    setShowCredentialsDialog(true)
    setShowAddDialog(false)
    resetAddForm()
  }

  const resetAddForm = () => {
    setNewName('')
    setNewNameAr('')
    setNewNameBn('')
    setNewNameUr('')
    setNewEmail('')
    setNewRole('staff')
    setNewPassword('')
  }

  const handleEditUser = () => {
    if (!selectedUser) return
    if (editEmail !== selectedUser.email && users.some(u => u.email === editEmail)) {
      alert(t('emailAlreadyExists', lang))
      return
    }
    updateUser(selectedUser.id, {
      name: editName,
      nameAr: editNameAr,
      nameBn: editNameBn,
      nameUr: editNameUr,
      email: editEmail,
      role: editRole,
    })
    setShowEditDialog(false)
    setSelectedUser(null)
  }

  const handleDeleteUser = () => {
    if (!selectedUser) return
    // Admin can delete anyone except themselves
    if (selectedUser.id === authUser?.id) {
      alert(lang === 'en' ? 'You cannot delete your own account' : lang === 'ar' ? 'لا يمكنك حذف حسابك الخاص' : lang === 'bn' ? 'আপনি নিজের অ্যাকাউন্ট মুছতে পারবেন না' : 'آپ اپنا اکاؤنٹ حذف نہیں کر سکتے')
      return
    }
    deleteUser(selectedUser.id)
    setShowDeleteDialog(false)
    setSelectedUser(null)
  }

  const handleResetPassword = () => {
    if (!selectedUser) return
    const password = resetNewPassword || generateRandomPassword()
    resetUserPassword(selectedUser.id, password)
    setResetCredentials({ email: selectedUser.email, password })
    setShowResetDialog(false)
    setShowCredentialsDialog(true)
    setResetNewPassword('')
    setSelectedUser(null)
  }

  const handleResolveRequest = (request: ResetRequest) => {
    // Find if user exists with this email
    const existingUser = users.find(u => u.email === request.email)
    if (existingUser) {
      // Open reset password dialog for this user
      setSelectedUser(existingUser)
      setResetNewPassword('')
      setShowResetDialog(true)
      // Mark request as resolved
      resolveResetRequest(request.id, authUser?.name || 'admin')
    } else {
      // User not found - open add user dialog with email pre-filled
      setNewName(request.name)
      setNewEmail(request.email)
      setNewNameAr('')
      setNewNameBn('')
      setNewNameUr('')
      setNewRole('staff')
      setNewPassword('')
      setShowAddDialog(true)
      // Mark request as resolved
      resolveResetRequest(request.id, authUser?.name || 'admin')
    }
  }

  const handleDismissRequest = (request: ResetRequest) => {
    dismissResetRequest(request.id, authUser?.name || 'admin')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }))
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(lang === 'ar' ? 'ar-AE' : lang === 'bn' ? 'bn-BD' : lang === 'ur' ? 'ur-PK' : 'en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-deep-teal" />
            {t('userManagement', lang)}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {users.length} {t('usersCount', lang)}
          </p>
        </div>
        <Button
          onClick={() => {
            resetAddForm()
            setShowAddDialog(true)
          }}
          className="bg-deep-teal hover:bg-deep-teal/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addNewUser', lang)}
        </Button>
      </div>

      {/* Tabs: Users / Reset Requests */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          {lang === 'en' ? 'Users' : lang === 'ar' ? 'المستخدمون' : lang === 'bn' ? 'ব্যবহারকারী' : 'صارفین'}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {pendingRequests.length > 0 ? (
            <BellRing className="w-4 h-4 text-amber-600" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          {lang === 'en' ? 'Reset Requests' : lang === 'ar' ? 'طلبات إعادة التعيين' : lang === 'bn' ? 'রিসেট অনুরোধ' : 'ری سیٹ کی درخواستیں'}
          {pendingRequests.length > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <>
          {/* Info Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                {t('shareCredentials', lang)}
              </p>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">{t('roleName', lang)}</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">{t('username', lang)}</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">{t('password', lang)}</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">{t('role', lang)}</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">{t('actions', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`border-b border-border last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/20'} hover:bg-muted/30 transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <div>
                            <p className="font-medium text-sm">{getNameByLang(user, lang)}</p>
                            {user.nameAr && (
                              <p className="text-xs text-muted-foreground" dir="rtl">{user.nameAr}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">{user.email}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
                            {visiblePasswords[user.id] ? user.password : '••••••••'}
                          </code>
                          <button
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title={visiblePasswords[user.id] ? t('hidePassword', lang) : t('showPassword', lang)}
                          >
                            {visiblePasswords[user.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(user.password)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title={t('copyPassword', lang)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setEditName(user.name)
                              setEditNameAr(user.nameAr)
                              setEditNameBn(user.nameBn)
                              setEditNameUr(user.nameUr)
                              setEditEmail(user.email)
                              setEditRole(user.role)
                              setShowEditDialog(true)
                            }}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title={t('editUser', lang)}
                          >
                            <Pencil className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setResetNewPassword('')
                              setShowResetDialog(true)
                            }}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title={t('resetPassword', lang)}
                          >
                            <KeyRound className="w-4 h-4 text-amber-600" />
                          </button>
                          {user.id !== authUser?.id && (
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowDeleteDialog(true)
                              }}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title={t('deleteUser', lang)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* RESET REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-600" />
                {lang === 'en' ? 'Pending Requests' : lang === 'ar' ? 'الطلبات المعلقة' : lang === 'bn' ? 'অপেক্ষমাণ অনুরোধ' : 'زیر التواء درخواستیں'}
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              </h3>
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl border-2 border-amber-200 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{request.name || lang === 'en' ? 'Unknown User' : lang === 'ar' ? 'مستخدم غير معروف' : lang === 'bn' ? 'অজানা ব্যবহারকারী' : 'نامعلوم صارف'}</p>
                          <p className="text-xs text-muted-foreground">{request.email}</p>
                        </div>
                      </div>
                      {request.message && (
                        <div className="flex items-start gap-2 mb-2 ml-10">
                          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">{request.message}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 ml-10 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(request.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleResolveRequest(request)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                        {lang === 'en' ? 'Reset & Resolve' : lang === 'ar' ? 'إعادة تعيين وحل' : lang === 'bn' ? 'রিসেট ও সমাধান' : 'ری سیٹ اور حل'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDismissRequest(request)}
                        className="text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        {lang === 'en' ? 'Dismiss' : lang === 'ar' ? 'رفض' : lang === 'bn' ? 'বাতিল' : 'مسترد'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolved/Dismissed Requests */}
          {resolvedRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                <Check className="w-5 h-5" />
                {lang === 'en' ? 'History' : lang === 'ar' ? 'السجل' : lang === 'bn' ? 'ইতিহাস' : 'تاریخ'}
              </h3>
              {resolvedRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl border border-border shadow-sm p-4 opacity-60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${request.status === 'resolved' ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {request.status === 'resolved' ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-gray-400" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{request.name || (lang === 'en' ? 'Unknown User' : lang === 'ar' ? 'مستخدم غير معروف' : lang === 'bn' ? 'অজানা ব্যবহারকারী' : 'نامعلوم صارف')}</p>
                          <p className="text-xs text-muted-foreground">{request.email}</p>
                        </div>
                      </div>
                      {request.message && (
                        <p className="text-xs text-muted-foreground ml-8">{request.message}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {request.status === 'resolved'
                          ? (lang === 'en' ? 'Resolved' : lang === 'ar' ? 'تم الحل' : lang === 'bn' ? 'সমাধিত' : 'حل شدہ')
                          : (lang === 'en' ? 'Dismissed' : lang === 'ar' ? 'مرفوض' : lang === 'bn' ? 'বাতিল' : 'مسترد')}
                      </span>
                      {request.resolvedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(request.resolvedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No requests */}
          {resetRequests.length === 0 && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {lang === 'en' ? 'No Reset Requests' : lang === 'ar' ? 'لا توجد طلبات إعادة تعيين' : lang === 'bn' ? 'কোনো রিসেট অনুরোধ নেই' : 'کوئی ری سیٹ کی درخواست نہیں'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {lang === 'en' ? 'When users request a password reset, their requests will appear here for you to review and resolve.' : lang === 'ar' ? 'عندما يطلب المستخدمون إعادة تعيين كلمة المرور، ستظهر طلباتهم هنا لمراجعتها وحلها.' : lang === 'bn' ? 'ব্যবহারকারীরা যখন পাসওয়ার্ড রিসেট অনুরোধ করবেন, তাদের অনুরোধ আপনার পর্যালোচনা ও সমাধানের জন্য এখানে প্রদর্শিত হবে।' : 'جب صارفین پاس ورڈ ری سیٹ کی درخواست کریں گے تو ان کی درخواستیں آپ کے جائزے اور حل کے لیے یہاں نظر آئیں گی۔'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ADD USER DIALOG */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-deep-teal" />
              {t('addNewUser', lang)}
            </DialogTitle>
            <DialogDescription>{t('shareCredentials', lang)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('roleName', lang)} (EN) *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1" placeholder="Full Name" />
              </div>
              <div>
                <Label>{t('roleNameAr', lang)}</Label>
                <Input value={newNameAr} onChange={(e) => setNewNameAr(e.target.value)} className="mt-1" placeholder="الاسم بالعربية" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('roleNameBn', lang)}</Label>
                <Input value={newNameBn} onChange={(e) => setNewNameBn(e.target.value)} className="mt-1" placeholder="বাংলা নাম" />
              </div>
              <div>
                <Label>{t('roleNameUr', lang)}</Label>
                <Input value={newNameUr} onChange={(e) => setNewNameUr(e.target.value)} className="mt-1" placeholder="اردو نام" dir="rtl" />
              </div>
            </div>
            <div>
              <Label>{t('username', lang)} *</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mt-1" type="email" placeholder="staff@alreef.ae" />
            </div>
            <div>
              <Label>{t('role', lang)} *</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as 'owner' | 'admin' | 'staff')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">{t('ownerRole', lang)}</SelectItem>
                  <SelectItem value="admin">{t('adminRole', lang)}</SelectItem>
                  <SelectItem value="staff">{t('staffRole', lang)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('password', lang)}</Label>
              <div className="flex gap-2 mt-1">
                <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={lang === 'en' ? 'Leave blank to auto-generate' : lang === 'ar' ? 'اتركه فارغاً للتوليد التلقائي' : 'স্বয়ংক্রিয়ভাবে তৈরি করতে খালি রাখুন'} className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewPassword(generateRandomPassword())}
                  className="shrink-0"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {t('generatePassword', lang)}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleAddUser} disabled={!newName || !newEmail} className="bg-deep-teal hover:bg-deep-teal/90 text-white">
              {t('addNewUser', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT USER DIALOG */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-600" />
              {t('editUser', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('roleName', lang)} (EN) *</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>{t('roleNameAr', lang)}</Label>
                <Input value={editNameAr} onChange={(e) => setEditNameAr(e.target.value)} className="mt-1" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('roleNameBn', lang)}</Label>
                <Input value={editNameBn} onChange={(e) => setEditNameBn(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>{t('roleNameUr', lang)}</Label>
                <Input value={editNameUr} onChange={(e) => setEditNameUr(e.target.value)} className="mt-1" dir="rtl" />
              </div>
            </div>
            <div>
              <Label>{t('username', lang)} *</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="mt-1" type="email" />
            </div>
            <div>
              <Label>{t('role', lang)} *</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as 'owner' | 'admin' | 'staff')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">{t('ownerRole', lang)}</SelectItem>
                  <SelectItem value="admin">{t('adminRole', lang)}</SelectItem>
                  <SelectItem value="staff">{t('staffRole', lang)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleEditUser} disabled={!editName || !editEmail} className="bg-blue-600 hover:bg-blue-700 text-white">
              {t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESET PASSWORD DIALOG */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              {t('resetPassword', lang)}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>{getNameByLang(selectedUser, lang)} ({selectedUser.email})</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t('newPassword', lang)}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder={lang === 'en' ? 'Leave blank to auto-generate' : 'স্বয়ংক্রিয়ভাবে তৈরি করতে খালি রাখুন'}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetNewPassword(generateRandomPassword())}
                  className="shrink-0"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {t('generatePassword', lang)}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleResetPassword} className="bg-amber-600 hover:bg-amber-700 text-white">
              <KeyRound className="w-4 h-4 mr-2" />
              {t('resetPassword', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE USER DIALOG */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t('deleteUser', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-red-800 font-medium">{t('deleteConfirm', lang)}</p>
                  {selectedUser && (
                    <p className="text-sm text-red-600 mt-1">
                      {getNameByLang(selectedUser, lang)} ({selectedUser.email})
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>{t('cancel', lang)}</Button>
            <Button onClick={handleDeleteUser} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              {t('deleteUser', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREDENTIALS DISPLAY DIALOG */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              {t('credentialsInfo', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
              <p className="text-sm text-green-800 font-medium">{t('passwordGenerated', lang)}</p>
              {(createdCredentials || resetCredentials) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('username', lang)}</p>
                      <code className="text-sm font-mono font-semibold">{(createdCredentials || resetCredentials)?.email}</code>
                    </div>
                    <button onClick={() => copyToClipboard((createdCredentials || resetCredentials)?.email || '')} className="p-1.5 hover:bg-muted rounded">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('password', lang)}</p>
                      <code className="text-sm font-mono font-semibold">{(createdCredentials || resetCredentials)?.password}</code>
                    </div>
                    <button onClick={() => copyToClipboard((createdCredentials || resetCredentials)?.password || '')} className="p-1.5 hover:bg-muted rounded">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {createdCredentials?.name && (
                    <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200">
                      <div>
                        <p className="text-xs text-muted-foreground">{t('roleName', lang)}</p>
                        <p className="text-sm font-semibold">{createdCredentials.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setShowCredentialsDialog(false); setCreatedCredentials(null); setResetCredentials(null) }} className="bg-green-600 hover:bg-green-700 text-white">
              {t('save', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
