# Task 1: Fix Urdu Translations & Expand WhatsApp Language Selection

**Task ID**: 1
**Agent**: main
**Date**: 2024-03-05

## Summary

Completed two major tasks:

1. **Fixed ALL Urdu translations in i18n.ts** - Replaced English transliterations written in Urdu script (e.g., 'پراپرٹی ڈیش بورڈ' → 'املاک کا ڈیش بورڈ') with proper academic/professional Urdu translations across 100+ translation keys.

2. **Expanded WhatsApp Language Selection from 3 to 5 languages** - Added Urdu, Hindi, and Bengali as WhatsApp message language options, removed the Arabic+English bilingual option.

## Files Modified

- `/home/z/my-project/src/lib/i18n.ts` - Complete rewrite with:
  - All Urdu translations fixed to proper academic Urdu
  - Added `WhatsAppLanguage` type ('en' | 'ar' | 'bn' | 'ur' | 'hi')
  - Added `sendUrdu`, `sendHindi`, `sendBengali` translation keys
  - Removed `sendBilingual` key
  - Updated `sendArabic` and `sendEnglish` keys with native script labels
  - Updated `getWhatsAppLink()` to accept `WhatsAppLanguage` parameter
  - Added professional WhatsApp messages for all 5 languages (Arabic, English, Urdu, Hindi, Bengali)
  - Added Hindi month names for WhatsApp messages
  - Extracted phone number cleaning into `cleanPhoneNumber()` helper
  - Removed `getWhatsAppLinkBilingual()` function

- `/home/z/my-project/src/components/rent-collection.tsx` - Updated:
  - Import changed from `Language` to `WhatsAppLanguage`
  - Removed `getWhatsAppLinkBilingual` import
  - `sendAllRemindersWithLang` now accepts `WhatsAppLanguage`
  - Removed `sendAllRemindersBilingual` function
  - WhatsApp dialog now shows 5 language buttons:
    - Arabic (العربية) - green
    - English - blue
    - Urdu (اردو) - teal
    - Hindi (हिन्दी) - orange
    - Bengali (বাংলা) - purple

- `/home/z/my-project/src/components/tenants.tsx` - Updated:
  - Added `WhatsAppLanguage` type import
  - Removed `getWhatsAppLinkBilingual` import
  - WhatsApp dialog updated to 5 language buttons (same colors as rent-collection)

- `/home/z/my-project/src/components/dashboard.tsx` - Updated:
  - Removed `getWhatsAppLinkBilingual` from import (was unused)

## Key Urdu Translation Fixes (Examples)

| Key | Before (Transliteration) | After (Proper Urdu) |
|-----|--------------------------|---------------------|
| login | سائن ان | داخل ہوں |
| loginTitle | پراپرٹی ڈیش بورڈ | املاک کا ڈیش بورڈ |
| properties | پراپرٹیز | املاک |
| adminRole | ایڈمن | ناظم |
| staffRole | اسٹاف | ملازم |
| overdue | باقاعدہ | تاخیری ادائیگی |
| addProperty | پراپرٹی شامل کریں | نئی ملکیت شامل کریں |
| editProperty | پراپرٹی ترمیم | ملکیت میں ترمیم |
| maintenance | دیکھ بھال | دیكھ بھال کا شعبہ |
| reports | رپورٹس | رپورٹیں |
| userManagement | صارف کا نظم | صارفین کا انتظام |

## Build Verification

- `npx next build` ✅ Compiled successfully
- `npx eslint` on modified files ✅ No errors
