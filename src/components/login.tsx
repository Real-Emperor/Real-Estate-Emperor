'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t, languageNames, rtlLanguages } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Moon, Languages, Loader2, Shield } from 'lucide-react'

export default function LoginPage() {
  const { login, language, setLanguage } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isRtl = rtlLanguages.includes(language)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use local data store instead of API
      const { useDataStore } = await import('@/lib/data-store')
      const user = useDataStore.getState().authenticate(email, password)
      if (user) {
        // Convert LocalUser to AuthUser format
        login({
          id: user.id,
          email: user.email,
          name: user.name,
          nameAr: user.nameAr,
          nameBn: user.nameBn,
          nameUr: user.nameUr,
          role: user.role,
          companyId: user.companyId,
        })
        // Auto-seed data if not seeded
        if (!useDataStore.getState().isSeeded) {
          useDataStore.getState().seedData()
        }
      } else {
        setError(t('loginError', language))
      }
    } catch {
      setError(t('loginError', language))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Left side - Islamic geometric pattern background */}
      <div className="hidden lg:flex lg:w-1/2 islamic-pattern-full flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full border border-gold/20" />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border border-gold/10" />
        <div className="absolute top-1/3 right-20 w-24 h-24 rounded-full border border-white/5" />

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold/10">
            <Moon className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {t('loginTitle', language)}
          </h1>
          <p className="text-white/70 text-lg mb-8">
            {t('loginSubtitle', language)}
          </p>
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10 max-w-sm">
            <Shield className="w-8 h-8 text-gold mx-auto mb-3" />
            <p className="text-white/80 text-sm">
              {language === 'en' && 'Secure access with role-based permissions. Staff cannot view financial data.'}
              {language === 'ar' && 'وصول آمن مع صلاحيات قائمة على الأدوار. لا يمكن للموظفين عرض البيانات المالية.'}
              {language === 'bn' && 'ভূমিকা-ভিত্তিক অনুমতি সহ নিরাপদ অ্যাক্সেস। কর্মীরা আর্থিক তথ্য দেখতে পারবেন না।'}
              {language === 'ur' && 'کردار پر مبنی اجازت کے ساتھ محفوظ رسائی۔ اسٹاف مالیاتی ڈیٹا نہیں دیکھ سکتے۔'}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-cream">
        <div className="w-full max-w-md">
          {/* Language selector */}
          <div className="flex justify-end mb-8">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                {(Object.keys(languageNames) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      language === lang
                        ? 'bg-deep-teal text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-deep-teal flex items-center justify-center">
              <Moon className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">{t('loginTitle', language)}</h2>
              <p className="text-sm text-muted-foreground">{t('loginSubtitle', language)}</p>
            </div>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-2xl shadow-lg border border-border p-8">
            <h2 className="text-2xl font-bold mb-2">{t('login', language)}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {language === 'en' && 'Enter your credentials to access the dashboard'}
              {language === 'ar' && 'أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم'}
              {language === 'bn' && 'ড্যাশবোর্ড অ্যাক্সেস করতে আপনার পরিচয়পত্র লিখুন'}
              {language === 'ur' && 'ڈیش بورڈ تک رسائی کے لیے اپنی اسناد درج کریں'}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 animate-fade-in-up">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">{t('email', language)}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@alreefjanoubi.ae"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">{t('password', language)}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-deep-teal hover:bg-deep-teal/90 text-white h-11"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('signInButton', language)
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                {language === 'en' && 'Demo Credentials:'}
                {language === 'ar' && 'بيانات تجريبية:'}
                {language === 'bn' && 'ডেমো পরিচয়পত্র:'}
                {language === 'ur' && 'ڈیمو اسناد:'}
              </p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => { setEmail('owner@alreef.ae'); setPassword('owner123') }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-emerald/5 hover:bg-emerald/10 text-xs transition-colors"
                >
                  <span className="font-semibold text-emerald">{t('ownerRole', language)}:</span>
                  <span className="text-muted-foreground ml-2">owner@alreef.ae / owner123</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('staff@alreef.ae'); setPassword('staff123') }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-xs transition-colors"
                >
                  <span className="font-semibold text-blue-600">{t('staffRole', language)}:</span>
                  <span className="text-muted-foreground ml-2">staff@alreef.ae / staff123</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
