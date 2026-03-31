import React, { useEffect, useState } from 'react'
import { AlertCircle, WifiOff, Wifi } from 'lucide-react'

export default function AppStatusBar() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const onOnline = () => {
      setOnline(true)
      setMessage('تمت استعادة الاتصال بالإنترنت.')
      window.setTimeout(() => setMessage(''), 2500)
    }
    const onOffline = () => {
      setOnline(false)
      setMessage('أنت الآن بدون اتصال. قد لا يتم حفظ التعديلات أو جلب البيانات الجديدة.')
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (!message) return null

  return (
    <div className={`fixed left-1/2 top-3 z-[80] -translate-x-1/2 rounded-full border px-4 py-2 text-sm shadow-xl backdrop-blur ${online ? 'bg-emerald-500/90 text-white border-emerald-300/30' : 'bg-amber-500/90 text-slate-950 border-amber-200/30'}`} dir="rtl">
      <span className="inline-flex items-center gap-2">
        {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        {message}
      </span>
    </div>
  )
}

export function PageErrorState({ title = 'تعذر تحميل البيانات', message, onRetry }) {
  return (
    <div dir="rtl" className="rounded-3xl border border-destructive/15 bg-card p-6 text-center space-y-3">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{message || 'حدث خطأ أثناء جلب البيانات من الخادم أو من الاتصال المحلي.'}</p>
      </div>
      {onRetry && <button onClick={onRetry} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">إعادة المحاولة</button>}
    </div>
  )
}
