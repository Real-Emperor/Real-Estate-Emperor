'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useDataStore } from '@/lib/data-store'
import { t, rtlLanguages } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Building2,
  Users,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Moon,
  Sparkles,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'

interface OnboardingWizardProps {
  onComplete: () => void
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { language, setLanguage, authUser } = useAppStore()
  const { seedData, fetchAllData } = useDataStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const isRtl = rtlLanguages.includes(language)

  const [companyForm, setCompanyForm] = useState({
    name: '',
    nameAr: '',
    phone: '',
    email: '',
    address: '',
  })

  const handleLoadDemoData = async () => {
    setLoading(true)
    try {
      await seedData()
      await fetchAllData()
      onComplete()
    } catch (err) {
      console.error('Failed to load demo data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCompany = async () => {
    setLoading(true)
    try {
      await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyForm),
      })
      await fetchAllData()
      setStep(2)
    } catch (err) {
      console.error('Failed to update company:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'append')
      formData.append('type', 'auto')

      const res = await fetch('/api/import/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      setImportResult(data)
      await fetchAllData()
    } catch (err) {
      console.error('Import failed:', err)
      setImportResult({ error: 'Import failed. Please try again.' })
    } finally {
      setImporting(false)
    }
  }

  const steps = [
    { title: 'Welcome', icon: Moon },
    { title: 'Company Info', icon: Building2 },
    { title: 'Import Data', icon: Upload },
    { title: 'Ready!', icon: CheckCircle2 },
  ]

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                i <= step ? 'bg-deep-teal text-white' : 'bg-muted text-muted-foreground'
              }`}>
                <s.icon className="w-5 h-5" />
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 sm:w-24 h-1 mx-2 rounded transition-all ${
                  i < step ? 'bg-deep-teal' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl bg-deep-teal/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-deep-teal" />
              </div>
              <CardTitle className="text-2xl">Welcome to Al Reef Dashboard</CardTitle>
              <CardDescription className="text-base mt-2">
                Let's set up your property management system. This will only take a few minutes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* Language selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Choose your language</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'en', label: 'English', native: 'English' },
                    { code: 'ar', label: 'Arabic', native: 'العربية' },
                    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
                    { code: 'ur', label: 'Urdu', native: 'اردو' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code as Language)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        language === lang.code
                          ? 'border-deep-teal bg-deep-teal/5'
                          : 'border-border hover:border-deep-teal/50'
                      }`}
                    >
                      <p className="font-medium text-sm">{lang.label}</p>
                      <p className="text-xs text-muted-foreground">{lang.native}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(1)} className="bg-deep-teal hover:bg-deep-teal/90">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Company Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-deep-teal" />
                Company Information
              </CardTitle>
              <CardDescription>
                Enter your company details. This information will appear on reports and documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Al Reef Al Junoobi Real Estate"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="company-name-ar">Company Name (Arabic)</Label>
                <Input
                  id="company-name-ar"
                  value={companyForm.nameAr}
                  onChange={(e) => setCompanyForm(f => ({ ...f, nameAr: e.target.value }))}
                  placeholder="الريف الجنوبي للعقارات"
                  className="mt-1.5"
                  dir="rtl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-phone">Phone</Label>
                  <Input
                    id="company-phone"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+971 4 XXX XXXX"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="company-email">Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="info@example.com"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="company-address">Address</Label>
                <Input
                  id="company-address"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Building, Street, City, Country"
                  className="mt-1.5"
                />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleUpdateCompany}
                  className="bg-deep-teal hover:bg-deep-teal/90"
                  disabled={loading || !companyForm.name}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Import Data */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-deep-teal" />
                Import Your Data
              </CardTitle>
              <CardDescription>
                Upload your existing data from a spreadsheet, or start with demo data to explore the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File upload area */}
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-deep-teal/50 transition-colors">
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium mb-2">Upload Excel or CSV File</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports .xlsx, .xls, and .csv files with properties, tenants, expenses, or maintenance data
                </p>
                <label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileImport}
                    className="hidden"
                    disabled={importing}
                  />
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    disabled={importing}
                    asChild
                  >
                    <span>
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>

              {/* Import result */}
              {importResult && (
                <div className={`p-4 rounded-lg border ${
                  importResult.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                  {importResult.error ? (
                    <p className="text-sm text-red-700">{importResult.error}</p>
                  ) : (
                    <div className="text-sm">
                      <p className="font-medium text-green-800 mb-2">Import Successful!</p>
                      {importResult.summary && (
                        <div className="grid grid-cols-2 gap-1 text-green-700">
                          {importResult.summary.properties?.imported > 0 && <span>Properties: {importResult.summary.properties.imported}</span>}
                          {importResult.summary.tenants?.imported > 0 && <span>Tenants: {importResult.summary.tenants.imported}</span>}
                          {importResult.summary.expenses?.imported > 0 && <span>Expenses: {importResult.summary.expenses.imported}</span>}
                          {importResult.summary.maintenance?.imported > 0 && <span>Maintenance: {importResult.summary.maintenance.imported}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Or load demo data */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadDemoData}
                  disabled={loading}
                  className="w-full max-w-xs"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Load Demo Data to Explore
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Start with sample data to explore the dashboard features
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-deep-teal hover:bg-deep-teal/90"
                >
                  Skip & Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your property management dashboard is ready. You can always add more data, import files, or change settings from the dashboard.
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-left max-w-sm mx-auto">
                <p className="text-sm font-medium mb-2">Quick Tips:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Add properties from the Properties page</li>
                  <li>• Record rent payments from Rent Collection</li>
                  <li>• Import data anytime using the Import feature</li>
                  <li>• Export reports to Excel from the Reports page</li>
                  <li>• Manage users from Settings (admin only)</li>
                </ul>
              </div>
              <Button
                onClick={onComplete}
                size="lg"
                className="bg-deep-teal hover:bg-deep-teal/90 w-full max-w-xs"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
