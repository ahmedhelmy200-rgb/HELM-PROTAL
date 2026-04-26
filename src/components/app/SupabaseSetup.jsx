import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { appParams } from '@/lib/app-params'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2, XCircle, Loader2, RefreshCw,
  HardDrive, Shield, AlertTriangle, Zap, Copy, ExternalLink,
} from 'lucide-react'

// ── حالة كل عنصر فحص ─────────────────────────────────────────────────────
const STATUS = { IDLE: 'idle', LOADING: 'loading', OK: 'ok', ERROR: 'error', WARN: 'warn' }

function StatusIcon({ status }) {
  if (status === STATUS.LOADING) return <Loader2 className="h-4 w-4 animate-spin text-primary" />
  if (status === STATUS.OK)      return <CheckCircle2 className="h-4 w-4 text-green-500" />
  if (status === STATUS.ERROR)   return <XCircle className="h-4 w-4 text-destructive" />
  if (status === STATUS.WARN)    return <AlertTriangle className="h-4 w-4 text-amber-500" />
  return <div className="h-4 w-4 rounded-full border-2 border-border" />
}

function CheckRow({ label, status, detail, action }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <StatusIcon status={status} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {detail && (
            <p className={`text-xs mt-0.5 ${status === STATUS.ERROR ? 'text-destructive' : status === STATUS.WARN ? 'text-amber-600' : 'text-muted-foreground'}`}>
              {detail}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="shrink-0">{action}</div>
      )}
    </div>
  )
}

// ── سكريبت SQL لإنشاء الـ RLS Policies ───────────────────────────────────
const STORAGE_POLICY_SQL = `-- تشغيل هذا في Supabase → SQL Editor
-- إنشاء bucket التخزين
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads', 'uploads', false, 15728640,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg', 'image/png', 'image/webp', 'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- السماح للمستخدمين المصادق عليهم برفع الملفات
CREATE POLICY "authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uploads');

-- السماح للمستخدمين المصادق عليهم بقراءة ملفاتهم
CREATE POLICY "authenticated users can read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'uploads');

-- السماح بحذف الملفات
CREATE POLICY "authenticated users can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'uploads');`

export default function SupabaseSetup() {
  const bucketName = appParams.storageBucket || 'uploads'

  const [checks, setChecks] = useState({
    connection : { status: STATUS.IDLE, detail: '' },
    auth       : { status: STATUS.IDLE, detail: '' },
    bucket     : { status: STATUS.IDLE, detail: '' },
    policy     : { status: STATUS.IDLE, detail: '' },
  })
  const [creating,  setCreating ] = useState(false)
  const [createMsg, setCreateMsg] = useState('')
  const [copied,    setCopied   ] = useState(false)
  const [allOk,     setAllOk    ] = useState(false)

  const setCheck = (key, status, detail = '') =>
    setChecks(prev => ({ ...prev, [key]: { status, detail } }))

  // ── الفحص الشامل ──────────────────────────────────────────────────────────
  const runChecks = useCallback(async () => {
    setAllOk(false)
    setCreateMsg('')

    // 1. اتصال Supabase
    setCheck('connection', STATUS.LOADING)
    try {
      const { error } = await supabase.from('office_settings').select('id').limit(1)
      if (error && !error.message?.includes('permission')) throw error
      setCheck('connection', STATUS.OK, 'الاتصال بـ Supabase يعمل')
    } catch (e) {
      setCheck('connection', STATUS.ERROR, e.message || 'تعذر الاتصال بـ Supabase')
      return
    }

    // 2. المصادقة
    setCheck('auth', STATUS.LOADING)
    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user) {
      setCheck('auth', STATUS.OK, `مسجّل دخول: ${authData.user.email}`)
    } else {
      setCheck('auth', STATUS.WARN, 'لا يوجد مستخدم مسجّل دخول حالياً')
    }

    // 3. فحص وجود bucket
    setCheck('bucket', STATUS.LOADING)
    try {
      const { data: bucketData, error: bucketErr } = await supabase.storage.getBucket(bucketName)
      if (bucketData) {
        const sizeMB = bucketData.file_size_limit ? `${Math.round(bucketData.file_size_limit / 1024 / 1024)} MB` : 'غير محدد'
        setCheck('bucket', STATUS.OK, `الحاوية "${bucketName}" موجودة · الحد الأقصى: ${sizeMB}`)
      } else {
        setCheck('bucket', STATUS.ERROR, `الحاوية "${bucketName}" غير موجودة — يجب إنشاؤها`)
      }
    } catch (e) {
      setCheck('bucket', STATUS.ERROR, `تعذر فحص الحاوية: ${e.message}`)
    }

    // 4. فحص صلاحية الرفع
    setCheck('policy', STATUS.LOADING)
    try {
      const testBlob = new Blob(['test'], { type: 'text/plain' })
      const testPath = `__test__/${Date.now()}.txt`
      const { error: uploadErr } = await supabase.storage
        .from(bucketName)
        .upload(testPath, testBlob, { upsert: true })

      if (!uploadErr) {
        // حذف ملف الاختبار
        await supabase.storage.from(bucketName).remove([testPath]).catch(() => {})
        setCheck('policy', STATUS.OK, 'صلاحيات الرفع تعمل بشكل صحيح')
        setAllOk(true)
      } else if (uploadErr.message?.includes('Bucket not found')) {
        setCheck('policy', STATUS.ERROR, 'الحاوية غير موجودة — أنشئها أولاً')
      } else if (uploadErr.message?.includes('permission') || uploadErr.message?.includes('policy') || uploadErr.message?.includes('authorized')) {
        setCheck('policy', STATUS.ERROR, 'سياسات الأمان (RLS) لا تسمح بالرفع — راجع التعليمات أدناه')
      } else {
        setCheck('policy', STATUS.WARN, `تحذير: ${uploadErr.message}`)
      }
    } catch (e) {
      setCheck('policy', STATUS.WARN, `تعذر اختبار الصلاحيات: ${e.message}`)
    }
  }, [bucketName])

  useEffect(() => { runChecks() }, [runChecks])

  // ── إنشاء الـ bucket تلقائياً ─────────────────────────────────────────────
  const handleCreateBucket = async () => {
    setCreating(true)
    setCreateMsg('')
    try {
      // محاولة الإنشاء
      const { error: createErr } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 15 * 1024 * 1024,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg', 'image/png', 'image/webp', 'text/plain',
        ],
      })

      if (createErr) {
        if (createErr.message?.includes('already exists') || createErr.message?.includes('Duplicate')) {
          setCreateMsg('✅ الحاوية موجودة بالفعل. يتم إعادة الفحص...')
        } else {
          setCreateMsg(
            `⚠️ لم نتمكن من الإنشاء التلقائي (${createErr.message}).\n` +
            `هذا يحدث عادةً عندما لا تملك الـ anon key صلاحية إنشاء buckets.\n` +
            `استخدم سكريبت SQL أدناه في Supabase Dashboard.`
          )
          setCreating(false)
          return
        }
      } else {
        setCreateMsg('✅ تم إنشاء الحاوية بنجاح! يتم التحقق...')
      }

      await new Promise(r => setTimeout(r, 800))
      await runChecks()
    } catch (e) {
      setCreateMsg(`❌ خطأ: ${e.message}`)
    } finally {
      setCreating(false)
    }
  }

  const copySQL = () => {
    navigator.clipboard?.writeText(STORAGE_POLICY_SQL).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bucketStatus = checks.bucket.status
  const needsSetup   = bucketStatus === STATUS.ERROR

  return (
    <div className="space-y-5" dir="rtl">

      {/* ── نتيجة الفحص الشاملة ─────────────────────────────────────────── */}
      {allOk ? (
        <Card className="p-4 bg-green-500/8 border-green-500/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
            <div>
              <p className="font-bold text-foreground">كل شيء يعمل بشكل صحيح ✅</p>
              <p className="text-sm text-muted-foreground mt-0.5">حاوية التخزين مُعدَّة وصلاحيات الرفع تعمل.</p>
            </div>
          </div>
        </Card>
      ) : needsSetup ? (
        <Card className="p-4 bg-destructive/8 border-destructive/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-foreground">حاوية التخزين غير موجودة</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                لا يمكن رفع الملفات حتى يتم إنشاء الحاوية. جرّب الإنشاء التلقائي أدناه أو اتبع التعليمات اليدوية.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* ── قائمة الفحوصات ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              تشخيص حالة التخزين
            </span>
            <Button variant="ghost" size="sm" onClick={runChecks} className="gap-1.5 h-8">
              <RefreshCw className="h-3.5 w-3.5" />إعادة الفحص
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CheckRow label="الاتصال بـ Supabase"   status={checks.connection.status} detail={checks.connection.detail} />
          <CheckRow label="حالة المصادقة"          status={checks.auth.status}       detail={checks.auth.detail}       />
          <CheckRow
            label={`حاوية التخزين (${bucketName})`}
            status={checks.bucket.status}
            detail={checks.bucket.detail}
            action={
              needsSetup ? (
                <Button size="sm" onClick={handleCreateBucket} disabled={creating} className="gap-1.5 h-8">
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                  {creating ? 'جارٍ الإنشاء...' : 'إنشاء تلقائي'}
                </Button>
              ) : undefined
            }
          />
          <CheckRow label="صلاحيات الرفع (RLS)"   status={checks.policy.status}     detail={checks.policy.detail}     />
        </CardContent>
      </Card>

      {/* ── نتيجة محاولة الإنشاء ───────────────────────────────────────── */}
      {createMsg && (
        <Card className="p-4 bg-muted/40 border-border">
          <p className="text-sm text-foreground whitespace-pre-line leading-6">{createMsg}</p>
        </Card>
      )}

      {/* ── الإعداد اليدوي ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            الإعداد اليدوي (إذا فشل التلقائي)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="font-bold text-foreground shrink-0 w-5">١.</span>
              <p>اذهب إلى <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">supabase.com/dashboard</a> واختر مشروعك</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-foreground shrink-0 w-5">٢.</span>
              <p>اضغط على <strong className="text-foreground">Storage</strong> من القائمة الجانبية</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-foreground shrink-0 w-5">٣.</span>
              <p>اضغط <strong className="text-foreground">New bucket</strong> وأدخل الاسم: <Badge variant="outline" className="font-mono text-xs">{bucketName}</Badge> ثم اضغط Create</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-foreground shrink-0 w-5">٤.</span>
              <p>اذهب إلى <strong className="text-foreground">SQL Editor</strong> وشغّل السكريبت التالي لإضافة صلاحيات الرفع:</p>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-muted rounded-2xl p-4 text-xs leading-6 overflow-x-auto text-foreground font-mono border border-border max-h-52 overflow-y-auto" dir="ltr">
              {STORAGE_POLICY_SQL}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 left-2 gap-1.5 h-7 text-xs"
              onClick={copySQL}
            >
              <Copy className="h-3 w-3" />
              {copied ? 'تم النسخ ✓' : 'نسخ'}
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href="https://supabase.com/dashboard/project/_/storage/buckets" target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                فتح Supabase Storage
              </a>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                فتح SQL Editor
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
