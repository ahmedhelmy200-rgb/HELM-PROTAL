# PRIME TRADING - MASTER DEPLOYMENT GUIDE
# الدليل الرئيسي للنشر على Vercel و GitHub

## ✅ ONE-CLICK DEPLOYMENT

### الخطوة 0: التحضير (Preparation)

#### على Windows:
```bash
# 1. افتح Command Prompt وانتقل للمجلد الذي يحتوي على الملفات
cd C:\path\to\your\files

# 2. شغل سكريبت الإعداد
setup.bat

# اتبع الخطوات على الشاشة
```

#### على Mac/Linux:
```bash
# 1. انتقل للمجلد الذي يحتوي على الملفات
cd /path/to/your/files

# 2. أعط صلاحيات التنفيذ للسكريبت
chmod +x setup.sh

# 3. شغل سكريبت الإعداد
./setup.sh

# اتبع الخطوات على الشاشة
```

---

## 📋 الخطوة 1: التحضير اليدوي (Manual Setup - If Not Using Scripts)

### أ) تحميل الملفات

```bash
# إنشاء مجلد جديد
mkdir prime-trading
cd prime-trading

# تهيئة Git
git init
git config user.name "Your Name"
git config user.email "your@email.com"
```

### ب) نسخ جميع الملفات إلى المجلدات الصحيحة

**ملفات الصفحات:**
```
app-page.jsx → pages/index.js
product-detail-page.jsx → pages/product/[id].js
account-page.jsx → pages/account/index.js
admin-dashboard.jsx → pages/admin/dashboard.js
contact-page.jsx → pages/contact/index.js
terms-policy-page.jsx → pages/legal/terms.js
auth-page.jsx → pages/auth/login.js
success-page.jsx → pages/checkout/success.js
```

**ملفات API:**
```
api-checkout.js → pages/api/checkout.js
email-service.js → pages/api/email.js
promotions-system.js → pages/api/promotions.js
reviews-system.js → pages/api/reviews.js
analytics-system.js → pages/api/analytics.js
advanced-search.js → pages/api/search.js
shipping-system.js → pages/api/shipping.js
```

**ملفات المكتبة:**
```
lib-products.js → lib/products.js
(أضف باقي الملفات إلى lib/)
```

**ملفات الإعدادات:**
```
package.json → ./package.json
next.config.js → ./next.config.js
tailwind.config.js → ./tailwind.config.js
postcss.config.js → ./postcss.config.js
.env.local.example → ./.env.local.example
.gitignore → ./.gitignore
```

---

## 🔑 الخطوة 2: إضافة مفاتيح Stripe

### أ) الحصول على المفاتيح

```
1. اذهب إلى: https://dashboard.stripe.com
2. تسجيل الدخول أو إنشاء حساب
3. اذهب إلى: Developers > API keys
4. نسخ المفتاحين:
   - Publishable Key (pk_test_...)
   - Secret Key (sk_test_...)
```

### ب) إضافة المفاتيح إلى .env.local

```bash
# نسخ الملف النموذجي
cp .env.local.example .env.local

# فتح الملف للتحرير
# على Windows: notepad .env.local
# على Mac/Linux: nano .env.local
```

**أضف هذه المتغيرات:**
```
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📦 الخطوة 3: تثبيت المكتبات

```bash
# تثبيت جميع المكتبات
npm install

# أو استخدام yarn
yarn install

# تنزيل حوالي 200 MB من الملفات
# قد يستغرق 5-10 دقائق
```

---

## 🧪 الخطوة 4: اختبار محلي

```bash
# بدء خادم التطوير
npm run dev

# سيرى الرسالة:
# > ready - started server on 0.0.0.0:3000, url: http://localhost:3000

# افتح في المتصفح:
# http://localhost:3000
```

**اختبر:**
- [ ] الصفحة الرئيسية تعرض المنتجات
- [ ] البحث يعمل
- [ ] سلة التسوق تعمل
- [ ] اللغة العربية تعمل
- [ ] استخدام بطاقة Stripe التجريبية: 4242 4242 4242 4242

---

## 📤 الخطوة 5: رفع إلى GitHub

### أ) إنشاء مستودع على GitHub

```
1. اذهب إلى: https://github.com
2. اضغط "New Repository"
3. اسم المستودع: prime-trading
4. وصف: "PRIME TRADING FZE LLC E-Commerce Platform"
5. اختر: Public أو Private
6. اضغط "Create repository"
```

### ب) رفع الملفات

```bash
# إضافة جميع الملفات
git add .

# إنشاء أول Commit
git commit -m "Initial commit: PRIME TRADING e-commerce platform"

# إضافة رابط المستودع (استبدل USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/prime-trading.git

# الرفع إلى GitHub
git push -u origin main

# إذا فشل، جرب:
git push -u origin master
```

**ستحصل على رسالة نجاح:**
```
Enumerating objects: X, done.
...
To https://github.com/YOUR_USERNAME/prime-trading.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from origin.
```

---

## 🚀 الخطوة 6: النشر على Vercel

### الطريقة الأولى: عبر الموقع (الأسهل)

```
1. اذهب إلى: https://vercel.com
2. اضغط "Sign up" أو "Sign in"
3. اختر "Continue with GitHub"
4. ادخل بيانات GitHub
5. اسمح لـ Vercel بالوصول إلى مستودعاتك
6. اضغط "New Project"
7. اختر مستودع prime-trading
8. اضغط "Import"
```

### إضافة متغيرات البيئة

```
في صفحة "Configure Project":

1. أضف متغيرات البيئة:
   Name: NEXT_PUBLIC_STRIPE_PUBLIC_KEY
   Value: pk_test_YOUR_KEY

   Name: STRIPE_SECRET_KEY
   Value: sk_test_YOUR_KEY

   Name: NEXT_PUBLIC_APP_URL
   Value: https://your-domain.vercel.app

2. اضغط "Deploy"
3. انتظر اكتمال النشر (عادة 2-3 دقائق)
4. اضغط "Visit" لفتح الموقع المباشر
```

### الطريقة الثانية: عبر CLI

```bash
# تثبيت أداة Vercel
npm install -g vercel

# تسجيل الدخول
vercel login

# النشر
vercel

# اتبع الخطوات:
# 1. أي مجلد تريد نشره؟ → اضغط Enter (الحالي)
# 2. هل تريد عمل "git push" و "git pull"؟ → y
# 3. أضف بيانات المشروع
# 4. اختر الإعدادات
```

---

## ✅ الخطوة 7: التحقق من النشر

```bash
# تحقق من:
1. الرابط يعمل: https://your-domain.vercel.app
2. الصفحة الرئيسية تحمل بسرعة
3. المنتجات تظهر
4. البحث يعمل
5. اختبار شراء تجريبية:
   - بطاقة: 4242 4242 4242 4242
   - تاريخ انتهاء: 12/25
   - CVC: 123
```

---

## 🔄 التحديثات المستقبلية

### عند تحديث الملفات:

```bash
# بعد تعديل الملفات محلياً:

# 1. اختبر محلياً
npm run dev

# 2. رفع إلى GitHub
git add .
git commit -m "Description of changes"
git push

# 3. Vercel سينشر تلقائياً!
# ستحصل على بريد إلكتروني بالتأكيد
```

---

## 🆘 استكشاف الأخطاء

### المشكلة: npm install فشل
```bash
# حل 1: حذف package-lock.json والمجلد node_modules
rm -rf node_modules package-lock.json
npm install

# حل 2: استخدام --legacy-peer-deps
npm install --legacy-peer-deps
```

### المشكلة: Port 3000 قيد الاستخدام
```bash
# استخدم port مختلف
npm run dev -- -p 3001
```

### المشكلة: Stripe keys غير صحيحة
```bash
# تحقق من:
1. المفاتيح بدأت بـ pk_test_ و sk_test_
2. لا توجد مسافات إضافية
3. أعد تحميل الصفحة بعد التعديل
```

### المشكلة: النشر على Vercel فشل
```bash
# تحقق من:
1. جميع الملفات موجودة
2. لا توجد أخطاء في build المحلي
3. npm run build ينجح
4. .env.local لم يُرفع (يجب أن يكون في .gitignore)
```

---

## 📋 قائمة التحقق النهائية

### Before Deploying
- [ ] جميع الملفات مُنسخة إلى المجلدات الصحيحة
- [ ] npm install اكتمل بنجاح
- [ ] .env.local تم إنشاؤه بمفاتيح Stripe الصحيحة
- [ ] npm run dev يعمل بدون أخطاء
- [ ] localhost:3000 يعرض الموقع بشكل صحيح
- [ ] git init و git config تم تنفيذهما

### After Pushing to GitHub
- [ ] جميع الملفات موجودة في GitHub
- [ ] .env.local لم يُرفع (موجود في .gitignore)
- [ ] الـ README.md يظهر على صفحة المستودع
- [ ] الكود نظيف وبدون أخطاء

### After Deploying to Vercel
- [ ] الموقع يفتح على الرابط Vercel
- [ ] الصفحات تحمل بسرعة (< 2 ثانية)
- [ ] متغيرات البيئة تم إضافتها بشكل صحيح
- [ ] الدفع عبر Stripe يعمل
- [ ] الأخطاء تظهر في لوحة تحكم Vercel

---

## 🎉 النتيجة النهائية

بعد اتباع جميع الخطوات:

✅ **متجر إلكتروني كامل العمل**
✅ **نظام دفع آمن**
✅ **مستضاف على Vercel (سريع جداً)**
✅ **مرمز على GitHub (نسخ احتياطية)**
✅ **جاهز لاستقبال طلبات حقيقية**

---

## 📞 الدعم والمساعدة

**البريد الإلكتروني:** support@primetrading.com
**الهاتف:** +971509752704
**الموقع:** https://primetrading.com

---

## ⏱️ الوقت المتوقع

| الخطوة | الوقت |
|-------|-------|
| التحضير | 5 دقائق |
| تثبيت المكتبات | 10 دقائق |
| الاختبار المحلي | 5 دقائق |
| رفع إلى GitHub | 2 دقيقة |
| النشر على Vercel | 5 دقائق |
| **المجموع** | **~30 دقيقة** |

---

## 🎯 كل شيء معاك الآن

لديك جميع الملفات والأدوات والتعليمات اللازمة للنشر الفوري!

**ابدأ الآن واطلق متجرك الإلكتروني! 🚀**

---

*آخر تحديث: يناير 2024*
*PRIME TRADING E-Commerce Platform v1.0*
*جميع الحقوق محفوظة ©*
