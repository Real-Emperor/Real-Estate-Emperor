'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t, rtlLanguages } from '@/lib/i18n'
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
  Shield,
  ShieldCheck,
  QrCode,
  KeyRound,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function TwoFactorSettings() {
  const { language, authUser } = useAppStore()
  const lang = language as Language
  const isRtl = rtlLanguages.includes(language)

  // Setup state
  const [setupStep, setSetupStep] = useState<'idle' | 'setup' | 'verify' | 'done'>('idle')
  const [secret, setSecret] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [codesCopied, setCodesCopied] = useState(false)

  // Disable state
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisablePassword, setShowDisablePassword] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)
  const [disableError, setDisableError] = useState('')

  // 2FA status - we check from authUser (which may not have the field yet)
  // We'll check via API on component mount
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [statusChecked, setStatusChecked] = useState(false)

  // Check 2FA status
  useState(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/users')
        if (res.ok) {
          const users = await res.json()
          const currentUser = Array.isArray(users) ? users.find((u: any) => u.id === authUser?.id) : null
          if (currentUser) {
            setTwoFactorEnabled(currentUser.twoFactorEnabled || false)
          }
        }
      } catch (e) {
        console.error('Failed to check 2FA status:', e)
      } finally {
        setStatusChecked(true)
      }
    }
    if (authUser) checkStatus()
  })

  const handleSetup = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSecret(data.secret)
        setQrCodeUrl(data.qrCodeUrl)
        setSetupStep('setup')
      } else {
        setError(data.error || 'Failed to setup 2FA')
      }
    } catch {
      setError('Failed to setup 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError(lang === 'en' ? 'Enter the 6-digit code' : lang === 'ar' ? 'أدخل الرمز المكون من 6 أرقام' : lang === 'bn' ? '৬-সংখ্যার কোড লিখুন' : '6 ہندسوں کا کوڈ درج کریں')
      return
    }

    setLoading(true)
    setError('')
    try {
      // First verify the code
      const verifyRes = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode }),
      })
      const verifyData = await verifyRes.json()

      if (!verifyRes.ok || !verifyData.verified) {
        setError(verifyData.error || 'Invalid code')
        setLoading(false)
        return
      }

      // Then enable 2FA
      const enableRes = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode }),
      })
      const enableData = await enableRes.json()

      if (enableRes.ok) {
        setBackupCodes(enableData.backupCodes || [])
        setTwoFactorEnabled(true)
        setSetupStep('done')
      } else {
        setError(enableData.error || 'Failed to enable 2FA')
      }
    } catch {
      setError('Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!disablePassword) {
      setDisableError(lang === 'en' ? 'Password is required' : lang === 'ar' ? 'كلمة المرور مطلوبة' : lang === 'bn' ? 'পাসওয়ার্ড প্রয়োজন' : 'پاس ورڈ ضروری ہے')
      return
    }

    setDisableLoading(true)
    setDisableError('')
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      })
      const data = await res.json()

      if (res.ok) {
        setTwoFactorEnabled(false)
        setShowDisableDialog(false)
        setDisablePassword('')
        setSetupStep('idle')
      } else {
        setDisableError(data.error || 'Failed to disable 2FA')
      }
    } catch {
      setDisableError('Failed to disable 2FA')
    } finally {
      setDisableLoading(false)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCodesCopied(true)
    setTimeout(() => setCodesCopied(false), 2000)
  }

  const t2fa = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      twoFactorAuth: { en: 'Two-Factor Authentication', ar: 'المصادقة الثنائية', bn: 'দুই-ফ্যাক্টর প্রমাণীকরণ', ur: 'دو عنصر کی تصدیق' },
      enabled: { en: 'Enabled', ar: 'مفعّل', bn: 'সক্রিয়', ur: 'فعال' },
      disabled: { en: 'Disabled', ar: 'معطّل', bn: 'নিষ্ক্রিয়', ur: 'غیر فعال' },
      setup2fa: { en: 'Set Up 2FA', ar: 'إعداد المصادقة الثنائية', bn: '2FA সেটআপ', ur: '2FA سیٹ اپ' },
      disable2fa: { en: 'Disable 2FA', ar: 'تعطيل المصادقة الثنائية', bn: '2FA নিষ্ক্রিয় করুন', ur: '2FA غیر فعال کریں' },
      scanQR: { en: 'Scan this QR code with your authenticator app', ar: 'امسح رمز QR بتطبيق المصادقة', bn: 'আপনার প্রমাণীকরণ অ্যাপ দিয়ে এই QR কোড স্ক্যান করুন', ur: 'اپنی تصدیق ایپ سے یہ QR کوڈ اسکین کریں' },
      orManual: { en: 'Or enter this key manually:', ar: 'أو أدخل هذا المفتاح يدوياً:', bn: 'অথবা এই কী ম্যানুয়ালি লিখুন:', ur: 'یا یہ کلید دستی طور پر درج کریں:' },
      enterCode: { en: 'Enter the 6-digit code from your authenticator app', ar: 'أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة', bn: 'আপনার প্রমাণীকরণ অ্যাপ থেকে ৬-সংখ্যার কোড লিখুন', ur: 'اپنی تصدیق ایپ سے 6 ہندسوں کا کوڈ درج کریں' },
      verifyEnable: { en: 'Verify & Enable', ar: 'التحقق والتفعيل', bn: 'যাচাই ও সক্রিয় করুন', ur: 'توثیق اور فعال کریں' },
      backupCodes: { en: 'Backup Codes', ar: 'رموز النسخ الاحتياطي', bn: 'ব্যাকআপ কোড', ur: 'بیک اپ کوڈز' },
      saveCodes: { en: 'Save these backup codes in a safe place. Each code can only be used once.', ar: 'احفظ رموز النسخ الاحتياطي في مكان آمن. كل رمز يمكن استخدامه مرة واحدة فقط.', bn: 'এই ব্যাকআপ কোডগুলো নিরাপদ স্থানে সংরক্ষণ করুন। প্রতিটি কোড একবারই ব্যবহার করা যায়।', ur: 'یہ بیک اپ کوڈز محفوظ جگہ پر رکھیں۔ ہر کوڈ صرف ایک بار استعمال ہو سکتا ہے۔' },
      done: { en: '2FA has been enabled successfully!', ar: 'تم تفعيل المصادقة الثنائية بنجاح!', bn: '2FA সফলভাবে সক্রিয় হয়েছে!', ur: '2FA کامیابی سے فعال ہو گیا!' },
      enterPassword: { en: 'Enter your password to disable 2FA', ar: 'أدخل كلمة المرور لتعطيل المصادقة الثنائية', bn: '2FA নিষ্ক্রিয় করতে আপনার পাসওয়ার্ড লিখুন', ur: '2FA غیر فعال کرنے کے لیے اپنا پاس ورڈ درج کریں' },
      protected: { en: 'Your account is protected with two-factor authentication', ar: 'حسابك محمي بالمصادقة الثنائية', bn: 'আপনার অ্যাকাউন্ট দুই-ফ্যাক্টর প্রমাণীকরণ দিয়ে সুরক্ষিত', ur: 'آپ کا اکاؤنٹ دو عنصر کی تصدیق سے محفوظ ہے' },
      notProtected: { en: 'Add an extra layer of security to your account', ar: 'أضف طبقة أمان إضافية لحسابك', bn: 'আপনার অ্যাকাউন্টে অতিরিক্ত নিরাপত্তা যোগ করুন', ur: 'اپنے اکاؤنٹ میں اضافی سیکیورٹی شامل کریں' },
    }
    return translations[key]?.[lang] || translations[key]?.en || key
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {twoFactorEnabled ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          ) : (
            <Shield className="w-5 h-5 text-muted-foreground" />
          )}
          {t2fa('twoFactorAuth')}
        </h3>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          twoFactorEnabled
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
          {twoFactorEnabled ? t2fa('enabled') : t2fa('disabled')}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        {twoFactorEnabled ? t2fa('protected') : t2fa('notProtected')}
      </p>

      {/* Setup flow */}
      {setupStep === 'idle' && (
        <div>
          {twoFactorEnabled ? (
            <Button
              variant="outline"
              onClick={() => setShowDisableDialog(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Shield className="w-4 h-4 mr-2" />
              {t2fa('disable2fa')}
            </Button>
          ) : (
            <Button
              onClick={handleSetup}
              disabled={loading}
              className="bg-deep-teal hover:bg-deep-teal/90 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              {t2fa('setup2fa')}
            </Button>
          )}
        </div>
      )}

      {/* Step 1: Show QR code */}
      {setupStep === 'setup' && (
        <div className="space-y-4 bg-white rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">{t2fa('scanQR')}</p>

          {/* QR Code display area */}
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border">
              <div className="text-center">
                <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  {lang === 'en' ? 'Scan with authenticator app' : lang === 'ar' ? 'امسح بتطبيق المصادقة' : lang === 'bn' ? 'প্রমাণীকরণ অ্যাপ দিয়ে স্ক্যান করুন' : 'تصدیق ایپ سے اسکین کریں'}
                </p>
              </div>
            </div>
          </div>

          {/* Manual key */}
          <div>
            <Label className="text-xs text-muted-foreground">{t2fa('orManual')}</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono break-all">{secret}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { navigator.clipboard.writeText(secret) }}
                className="shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Verification code input */}
          <div>
            <Label>{t2fa('enterCode')}</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg font-mono tracking-widest max-w-[200px]"
                maxLength={6}
              />
              <Button
                onClick={handleVerify}
                disabled={verifyCode.length !== 6 || loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t2fa('verifyEnable')}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSetupStep('idle'); setVerifyCode(''); setError(''); }}
            className="text-muted-foreground"
          >
            {t('cancel', lang)}
          </Button>
        </div>
      )}

      {/* Step 2: Done - show backup codes */}
      {setupStep === 'done' && (
        <div className="space-y-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{t2fa('done')}</span>
          </div>

          <div>
            <Label className="text-sm font-medium">{t2fa('backupCodes')}</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">{t2fa('saveCodes')}</p>
            <div className="grid grid-cols-2 gap-1 bg-white rounded-lg p-3 border">
              {backupCodes.map((code, i) => (
                <code key={i} className="text-sm font-mono text-center py-0.5">{code}</code>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyBackupCodes}
              className="mt-2"
            >
              {codesCopied ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {codesCopied ? (lang === 'en' ? 'Copied!' : lang === 'ar' ? 'تم النسخ!' : lang === 'bn' ? 'কপি হয়েছে!' : 'کاپی ہو گیا!') : (lang === 'en' ? 'Copy Codes' : lang === 'ar' ? 'نسخ الرموز' : lang === 'bn' ? 'কোড কপি করুন' : 'کوڈز کاپی کریں')}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSetupStep('idle')}
            className="text-muted-foreground"
          >
            {lang === 'en' ? 'Close' : lang === 'ar' ? 'إغلاق' : lang === 'bn' ? 'বন্ধ করুন' : 'بند کریں'}
          </Button>
        </div>
      )}

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Shield className="w-5 h-5" />
              {t2fa('disable2fa')}
            </DialogTitle>
            <DialogDescription>{t2fa('enterPassword')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {disableError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {disableError}
              </div>
            )}
            <div>
              <Label>{t('password', lang)}</Label>
              <div className="relative mt-1">
                <Input
                  type={showDisablePassword ? 'text' : 'password'}
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowDisablePassword(!showDisablePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showDisablePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDisableDialog(false); setDisablePassword(''); setDisableError(''); }}>
              {t('cancel', lang)}
            </Button>
            <Button
              onClick={handleDisable}
              disabled={!disablePassword || disableLoading}
              variant="destructive"
            >
              {disableLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              {t2fa('disable2fa')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
