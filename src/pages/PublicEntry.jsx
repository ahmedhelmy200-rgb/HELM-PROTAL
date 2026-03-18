import React from 'react'
import { ShieldCheck, BriefcaseBusiness, LogIn, FileUser, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { appParams } from '@/lib/app-params'
import { useAuth } from '@/lib/AuthContext'

export default function PublicEntry() {
  const { navigateToLogin } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="mx-auto max-w-4xl rounded-3xl border bg-white/90 shadow-xl backdrop-blur">
          <div className="grid md:grid-cols-[1.05fr,0.95fr] gap-0">
            <div className="p-6 md:p-10 border-b md:border-b-0 md:border-l bg-slate-950 text-white rounded-t-3xl md:rounded-r-3xl md:rounded-tl-none">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center ring-1 ring-white/10">
                  <Building2 className="h-7 w-7 text-sky-300" />
                </div>
                <div>
                  <div className="text-sm text-white/70">نظام المكتب</div>
                  <h1 className="text-2xl font-bold">{appParams.appName}</h1>
                </div>
              </div>
              <p className="text-white/80 leading-8 text-sm md:text-base">
                صفحة دخول موحّدة للمكتب والموكّلين. دخول Google مطلوب، وبعده يتم توجيه كل حساب تلقائيًا إلى الواجهة المناسبة له.
              </p>
              <div className="mt-8 space-y-3 text-sm text-white/75">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> حسابات المكتب تدخل إلى لوحة الإدارة مباشرة.</div>
                <div className="flex items-center gap-2"><FileUser className="h-4 w-4 text-amber-300" /> الموكّل غير المسجل يُحوّل إلى استكمال بياناته فقط.</div>
                <div className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-sky-300" /> الموكّل المسجل يرى بياناته وقضاياه ومستنداته فقط.</div>
              </div>
            </div>

            <div className="p-6 md:p-10 flex flex-col justify-center gap-4">
              <Card className="border-primary/15 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h2 className="font-bold text-lg">دخول المكتب</h2>
                    <p className="text-sm text-muted-foreground mt-1">للإدارة، المحامين، والموظفين المعتمدين.</p>
                  </div>
                  <Button className="w-full gap-2" onClick={() => navigateToLogin()}>
                    <LogIn className="h-4 w-4" /> تسجيل الدخول عبر Google
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/15 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h2 className="font-bold text-lg">بوابة الموكّل</h2>
                    <p className="text-sm text-muted-foreground mt-1">إذا لم تكن مسجلًا مسبقًا، ستنتقل بعد الدخول إلى صفحة استكمال البيانات ورفع المستندات.</p>
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={() => navigateToLogin()}>
                    <FileUser className="h-4 w-4" /> دخول أو تسجيل موكّل
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
