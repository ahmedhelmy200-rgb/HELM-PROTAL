# إعداد Google OAuth في Supabase — دليل خطوة بخطوة

## المشكلة الشائعة
إذا ضغطت على زر تسجيل الدخول وتحدّث الصفحة بدون دخول، السبب في الغالب واحد من ثلاثة:

---

## ١. إعداد Google Cloud Console

1. اذهب إلى [console.cloud.google.com](https://console.cloud.google.com)
2. أنشئ مشروعاً جديداً أو اختر مشروعاً موجوداً
3. من القائمة: **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. اختر **Web application**
5. في **Authorized redirect URIs** أضف هذه الروابط:
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   http://localhost:5173
   ```
   > استبدل `YOUR_PROJECT` بـ ID مشروعك في Supabase
6. احفظ وانسخ **Client ID** و **Client Secret**

---

## ٢. إعداد Supabase

1. اذهب إلى [supabase.com/dashboard](https://supabase.com/dashboard)
2. اختر مشروعك → **Authentication** → **Providers**
3. فعّل **Google** وأدخل:
   - Client ID (من Google Console)
   - Client Secret (من Google Console)
4. اذهب إلى **Authentication** → **URL Configuration**
5. في **Site URL** أدخل: `http://localhost:5173`
6. في **Redirect URLs** أضف:
   ```
   http://localhost:5173
   http://localhost:5173/**
   ```

---

## ٣. ملف .env

تأكد أن ملف `.env` يحتوي على:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  (anon/public key)
VITE_SUPABASE_GOOGLE_REDIRECT_URL=http://localhost:5173
```

**ملاحظة:** استخدم **Anon Key** وليس **Service Role Key**

---

## ٤. جدول user_profiles

إذا دخل المستخدم لأول مرة ولا يوجد سجل له في `user_profiles`، سيُعامَل كـ `pending_client`.

لإضافة حسابك كـ admin، شغّل في Supabase → SQL Editor:
```sql
INSERT INTO public.user_profiles (email, role, full_name)
VALUES ('your-email@gmail.com', 'admin', 'اسمك')
ON CONFLICT (email) DO UPDATE SET role = 'admin';
```

---

## تشخيص المشكلة

بعد تشغيل البرنامج، افتح **Developer Tools** (F12) → **Console**.
إذا ظهرت أخطاء مثل:
- `invalid redirect_uri` → المشكلة في Google Console
- `Redirect URL not allowed` → المشكلة في Supabase URL Configuration  
- `user_profiles` → المستخدم غير موجود في قاعدة البيانات
