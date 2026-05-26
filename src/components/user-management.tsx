'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import type { LocalUser } from '@/lib/data-store'
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
} from 'lucide-react'

export default function UserManagement() {
  const { language, authUser } = useAppStore()
  const { users, addUser, updateUser, deleteUser, resetUserPassword, generateRandomPassword } = useDataStore()
  const lang = language as Language

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  // Add user form
  const [newName, setNewName] = useState('')
  const [newNameAr, setNewNameAr] = useState('')
  const [newNameBn, setNewNameBn] = useState('')
  const [newNameUr, setNewNameUr] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'staff' | 'admin'>('staff')
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

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <ShieldCheck className="w-4 h-4 text-emerald-600" />
    if (role === 'admin') return <Shield className="w-4 h-4 text-blue-600" />
    return <User className="w-4 h-4 text-muted-foreground" />
  }

  const getRoleLabel = (role: string) => {
    if (role === 'owner') return t('ownerRole', lang)
    if (role === 'admin') return t('adminRole', lang)
    return t('staffRole', lang)
  }

  const getRoleBadgeClass = (role: string) => {
    if (role === 'owner') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (role === 'admin') return 'bg-blue-100 text-blue-700 border-blue-200'
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
    if (selectedUser.role === 'owner') {
      alert(t('ownerCannotBeDeleted', lang))
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }))
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
                      {user.role !== 'owner' && (
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
              <Select value={newRole} onValueChange={(v) => setNewRole(v as 'staff' | 'admin')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">{t('staffRole', lang)}</SelectItem>
                  <SelectItem value="admin">{t('adminRole', lang)}</SelectItem>
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
            {selectedUser?.role !== 'owner' && (
              <div>
                <Label>{t('role', lang)} *</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as 'owner' | 'admin' | 'staff')}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">{t('staffRole', lang)}</SelectItem>
                    <SelectItem value="admin">{t('adminRole', lang)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
