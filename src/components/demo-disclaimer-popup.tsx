"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle } from "lucide-react"

/**
 * Demo Disclaimer Popup — shows on every page load/refresh.
 * Displays bilingual (Arabic + English) notice that this is a demonstration project.
 * No countdown timer — generic version for ongoing demo projects.
 */
export function DemoDisclaimerPopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(true)
  }, [])

  const handleAgree = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header with Phronesis branding */}
        <div className="bg-[#0a0f1e] text-white p-6 text-center">
          <img
            src="/phronesis-logo.png"
            alt="Phronesis Studio"
            className="h-14 w-14 mx-auto mb-3 object-contain"
          />
          <h2 className="text-lg font-bold tracking-wide">Studio of Phronesis</h2>
          <p className="text-xs text-white/60 mt-1 italic">
            مشروع توضيحي · Demonstration Project
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Arabic notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" dir="rtl">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground/80 leading-relaxed">
              هذا الموقع لأغراض العرض التوضيحي فقط. يُرجى عدم إدخال أي بيانات شخصية. وهو مشروع تجريبي يُبرز مدى دقة العمل وجودته.
            </div>
          </div>

          {/* English notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" dir="ltr">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground/80 leading-relaxed">
              This website is for demonstration purposes only. Please do not enter any personal information. It is a test project showcasing the precision and accuracy of our work.
            </div>
          </div>

          {/* Crafted by */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-[#c9a84c]" />
            <span>صُنع بإتقان بواسطة استوديو فرونيسس · Crafted with precision by Studio of Phronesis</span>
          </div>

          {/* Agree buttons — both languages */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleAgree}
              className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 dark:bg-[#c9a84c] dark:hover:bg-[#c9a84c]/90 dark:text-[#0a0f1e] font-semibold py-3"
              dir="rtl"
            >
              أنا أوافق
            </Button>
            <Button
              onClick={handleAgree}
              className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 dark:bg-[#c9a84c] dark:hover:bg-[#c9a84c]/90 dark:text-[#0a0f1e] font-semibold py-3"
              dir="ltr"
            >
              I Agree
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
