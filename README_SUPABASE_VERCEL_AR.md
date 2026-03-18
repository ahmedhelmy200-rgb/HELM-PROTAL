# تحويل النظام إلى React + Vite + Supabase + Vercel

هذه النسخة تفصل المشروع عن Base44 وتحافظ على نفس الواجهة قدر الإمكان عبر Adapter محلي يحافظ على API القديمة `base44.*` لكن ينفذها فعليًا فوق Supabase.

## المطلوب قبل التشغيل
1. أنشئ مشروع Supabase.
2. فعّل Google provider من Auth > Providers.
3. نفّذ ملف SQL:
   - `supabase/migrations/001_init.sql`
4. أنشئ Storage bucket باسم:
   - `uploads`
5. ضع القيم داخل `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_STORAGE_BUCKET`
   - `VITE_SUPABASE_GOOGLE_REDIRECT_URL`

## التشغيل المحلي
```powershell
npm install
npm run dev
```

## النشر على Vercel
1. ارفع المشروع إلى GitHub.
2. أنشئ مشروع Vercel جديد.
3. أضف نفس متغيرات البيئة.
4. Build Command = `npm run build`
5. Output Directory = `dist`

## ملاحظات مهمة
- تم حذف اعتماد Base44 من `package.json` و `vite.config.js`.
- تم الإبقاء على اسم الملف `src/api/base44Client.js` فقط لتجنب تعديل جميع الصفحات.
- `UploadFile` يعمل عبر Supabase Storage.
- `ExtractDataFromUploadedFile` يعمل عبر Supabase Edge Function اسمها الافتراضي `extract-ocr`.


## تحديث مهم
شغّل ملفي الهجرة بالترتيب:
1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_client_portal_security.sql`

