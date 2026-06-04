'use client'

import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileUp,
} from 'lucide-react'

interface ImportResult {
  message: string
  sheetsProcessed: string[]
  summary: {
    properties: { imported: number; errors: number; errorDetails: string[] }
    tenants: { imported: number; errors: number; errorDetails: string[] }
    expenses: { imported: number; errors: number; errorDetails: string[] }
    maintenance: { imported: number; errors: number; errorDetails: string[] }
  }
}

export default function DataImport() {
  const { language } = useAppStore()
  const lang = language as Language

  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'append' | 'replace'>('append')
  const [dataType, setDataType] = useState<'auto' | 'properties' | 'tenants' | 'expenses' | 'maintenance'>('auto')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ]
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(ext)) {
      setError(lang === 'en' ? 'Invalid file type. Please upload .xlsx, .xls, or .csv files' : lang === 'ar' ? 'نوع ملف غير صالح. يرجى رفع ملفات .xlsx أو .xls أو .csv' : 'অবৈধ ফাইল টাইপ। অনুগ্রহ করে .xlsx, .xls, বা .csv ফাইল আপলোড করুন')
      return
    }

    setFile(selectedFile)
    setError('')
    setResult(null)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }, [lang])

  const handleImport = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', mode)
      formData.append('type', dataType)

      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 300)

      const res = await fetch('/api/import/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await res.json()

      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Import failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`/api/import/template?type=${dataType === 'auto' ? 'all' : dataType}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'al-reef-import-template.xlsx'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Template download error:', err)
    }
  }

  const totalImported = result
    ? result.summary.properties.imported + result.summary.tenants.imported + result.summary.expenses.imported + result.summary.maintenance.imported
    : 0
  const totalErrors = result
    ? result.summary.properties.errors + result.summary.tenants.errors + result.summary.expenses.errors + result.summary.maintenance.errors
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileUp className="w-7 h-7 text-deep-teal" />
            {lang === 'en' ? 'Import Data' : lang === 'ar' ? 'استيراد البيانات' : lang === 'bn' ? 'ডেটা ইম্পোর্ট' : 'ڈیٹا امپورٹ'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {lang === 'en' ? 'Import data from XLSX or CSV files' : lang === 'ar' ? 'استيراد البيانات من ملفات XLSX أو CSV' : lang === 'bn' ? 'XLSX বা CSV ফাইল থেকে ডেটা ইম্পোর্ট করুন' : 'XLSX یا CSV فائلز سے ڈیٹا امپورٹ کریں'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadTemplate}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {lang === 'en' ? 'Download Template' : lang === 'ar' ? 'تحميل القالب' : lang === 'bn' ? 'টেমপ্লেট ডাউনলোড' : 'ٹیمپلیٹ ڈاؤنلوڈ'}
        </Button>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{lang === 'en' ? 'Import Mode' : lang === 'ar' ? 'وضع الاستيراد' : lang === 'bn' ? 'ইম্পোর্ট মোড' : 'امپورٹ موڈ'}</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'append' | 'replace')}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="append">
                  {lang === 'en' ? 'Append (add to existing)' : lang === 'ar' ? 'إلحاق (إضافة إلى الموجود)' : lang === 'bn' ? 'যোগ (বিদ্যমানে যোগ করুন)' : 'شامل (موجودہ میں شامل)'}
                </SelectItem>
                <SelectItem value="replace">
                  {lang === 'en' ? 'Replace (delete existing first)' : lang === 'ar' ? 'استبدال (حذف الموجود أولاً)' : lang === 'bn' ? 'প্রতিস্থাপন (প্রথমে বিদ্যমান মুছুন)' : 'تبدیل (پہلے موجودہ حذف کریں)'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{lang === 'en' ? 'Data Type' : lang === 'ar' ? 'نوع البيانات' : lang === 'bn' ? 'ডেটা টাইপ' : 'ڈیٹا کی قسم'}</Label>
            <Select value={dataType} onValueChange={(v) => setDataType(v as any)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{lang === 'en' ? 'Auto-detect' : lang === 'ar' ? 'كشف تلقائي' : lang === 'bn' ? 'স্বয়ংক্রিয় সনাক্তকরণ' : 'آٹو ڈیٹیکٹ'}</SelectItem>
                <SelectItem value="properties">{lang === 'en' ? 'Properties' : lang === 'ar' ? 'العقارات' : lang === 'bn' ? 'সম্পত্তি' : 'پراپرٹیز'}</SelectItem>
                <SelectItem value="tenants">{lang === 'en' ? 'Tenants' : lang === 'ar' ? 'المستأجرون' : lang === 'bn' ? 'ভাড়াটে' : 'کرایہ دار'}</SelectItem>
                <SelectItem value="expenses">{lang === 'en' ? 'Expenses' : lang === 'ar' ? 'المصروفات' : lang === 'bn' ? 'খরচ' : 'اخراجات'}</SelectItem>
                <SelectItem value="maintenance">{lang === 'en' ? 'Maintenance' : lang === 'ar' ? 'الصيانة' : lang === 'bn' ? 'রক্ষণাবেক্ষণ' : 'دیکھ بھال'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-deep-teal bg-deep-teal/5'
            : 'border-border hover:border-muted-foreground/50'
        } ${file ? 'bg-green-50/50 border-green-200' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet className="w-10 h-10 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null)
                setResult(null)
              }}
            >
              <XCircle className="w-4 h-4 text-red-400" />
            </Button>
          </div>
        ) : (
          <div>
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-1">
              {lang === 'en' ? 'Drag & drop your file here' : lang === 'ar' ? 'اسحب وأفلت ملفك هنا' : lang === 'bn' ? 'আপনার ফাইল এখানে টেনে আনুন' : 'اپنی فائل یہاں گھسیٹیں'}
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              {lang === 'en' ? 'or click to browse' : lang === 'ar' ? 'أو انقر للتصفح' : lang === 'bn' ? 'বা ব্রাউজ করতে ক্লিক করুন' : 'یا براؤز کرنے کے لیے کلک کریں'}
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {lang === 'en' ? 'Choose File' : lang === 'ar' ? 'اختر ملف' : lang === 'bn' ? 'ফাইল বেছে নিন' : 'فائل منتخب کریں'}
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0]
            if (selectedFile) handleFileSelect(selectedFile)
          }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 animate-spin text-deep-teal" />
            <p className="text-sm font-medium">
              {lang === 'en' ? 'Importing data...' : lang === 'ar' ? 'جاري استيراد البيانات...' : lang === 'bn' ? 'ডেটা ইম্পোর্ট হচ্ছে...' : 'ڈیٹا امپورٹ ہو رہا ہے...'}
            </p>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Import Button */}
      {file && !uploading && !result && (
        <Button
          onClick={handleImport}
          className="w-full bg-deep-teal hover:bg-deep-teal/90 text-white h-11"
          disabled={!file}
        >
          <FileSpreadsheet className="w-5 h-5 mr-2" />
          {lang === 'en' ? `Import ${file.name}` : lang === 'ar' ? `استيراد ${file.name}` : lang === 'bn' ? `${file.name} ইম্পোর্ট করুন` : `${file.name} امپورٹ کریں`}
        </Button>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold">
              {lang === 'en' ? 'Import Complete' : lang === 'ar' ? 'اكتمل الاستيراد' : lang === 'bn' ? 'ইম্পোর্ট সম্পন্ন' : 'امپورٹ مکمل'}
            </h3>
          </div>

          <p className="text-sm text-muted-foreground">{result.message}</p>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: lang === 'en' ? 'Properties' : lang === 'ar' ? 'العقارات' : lang === 'bn' ? 'সম্পত্তি' : 'پراپرٹیز', data: result.summary.properties },
              { label: lang === 'en' ? 'Tenants' : lang === 'ar' ? 'المستأجرون' : lang === 'bn' ? 'ভাড়াটে' : 'کرایہ دار', data: result.summary.tenants },
              { label: lang === 'en' ? 'Expenses' : lang === 'ar' ? 'المصروفات' : lang === 'bn' ? 'খরচ' : 'اخراجات', data: result.summary.expenses },
              { label: lang === 'en' ? 'Maintenance' : lang === 'ar' ? 'الصيانة' : lang === 'bn' ? 'রক্ষণাবেক্ষণ' : 'دیکھ بھال', data: result.summary.maintenance },
            ].map(({ label, data }) => (
              <div key={label} className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-green-600">{data.imported}</span>
                  {data.errors > 0 && (
                    <span className="text-sm text-red-600">({data.errors} {lang === 'en' ? 'errors' : lang === 'ar' ? 'أخطاء' : lang === 'bn' ? 'ত্রুটি' : 'غلطیاں'})</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div className="bg-deep-teal/10 rounded-lg p-3 flex items-center justify-between">
            <span className="font-medium text-sm">
              {lang === 'en' ? 'Total Records Imported' : lang === 'ar' ? 'إجمالي السجلات المستوردة' : lang === 'bn' ? 'মোট রেকর্ড ইম্পোর্ট হয়েছে' : 'کل ریکارڈز امپورٹ'}
            </span>
            <span className="text-xl font-bold text-deep-teal">{totalImported}</span>
          </div>

          {/* Error Details */}
          {totalErrors > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-red-800 mb-2">
                {lang === 'en' ? 'Error Details' : lang === 'ar' ? 'تفاصيل الأخطاء' : lang === 'bn' ? 'ত্রুটির বিস্তারিত' : 'غلطی کی تفصیلات'}:
              </p>
              {[
                { label: 'Properties', details: result.summary.properties.errorDetails },
                { label: 'Tenants', details: result.summary.tenants.errorDetails },
                { label: 'Expenses', details: result.summary.expenses.errorDetails },
                { label: 'Maintenance', details: result.summary.maintenance.errorDetails },
              ].map(({ label, details }) =>
                details.length > 0 && (
                  <div key={label} className="mb-2">
                    <p className="text-xs font-semibold text-red-700">{label}:</p>
                    {details.map((detail, i) => (
                      <p key={i} className="text-xs text-red-600 ml-2">• {detail}</p>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* Reset Button */}
          <Button
            variant="outline"
            onClick={() => {
              setFile(null)
              setResult(null)
              setError('')
              setProgress(0)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="w-full"
          >
            {lang === 'en' ? 'Import Another File' : lang === 'ar' ? 'استيراد ملف آخر' : lang === 'bn' ? 'আরেকটি ফাইল ইম্পোর্ট করুন' : 'دوسری فائل امپورٹ کریں'}
          </Button>
        </div>
      )}
    </div>
  )
}
