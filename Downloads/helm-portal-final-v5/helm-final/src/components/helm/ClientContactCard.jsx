import React, { useState } from 'react'
import { toast } from 'sonner'
import { Phone, Mail, MessageCircle, Send, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { base44 } from '@/api/base44Client'

const PHONE = '0544144149'
const EMAIL = 'AHMEDHELMY200@GMAIL.COM'

export default function ClientContactCard({ user, officeSettings }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const officeEmail = officeSettings?.email || EMAIL
  const whatsappRaw = (officeSettings?.social_whatsapp || PHONE).replace(/\D+/g, '')
  const phone = officeSettings?.phone || PHONE

  const sendInsideApp = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await base44.entities.Notification.create({
        title: 'طلب / استفسار من الموكّل',
        message: `${user?.full_name || user?.email || 'موكّل'}: ${message.trim()}`,
        type: 'عام',
        reference_type: 'ClientContact',
        user_email: officeEmail,
      })
      setMessage('')
      toast.success('تم إرسال الاستفسار بنجاح إلى الإدارة.')
    } catch (error) {
      console.error(error)
      const subject = encodeURIComponent('استفسار من بوابة الموكّل')
      const body = encodeURIComponent(`${user?.full_name || user?.email || 'موكّل'}:

${message.trim()}`)
      window.location.href = `mailto:${officeEmail}?subject=${subject}&body=${body}`
      toast.error('تعذر الإرسال داخل البرنامج. تم فتح البريد كبديل مباشر.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="dashboard-card-elevated rounded-3xl p-5 md:p-6 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_36%)] pointer-events-none" />
      <div className="relative space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center ring-1 ring-white/10">
            <ShieldCheck className="h-5 w-5 text-sky-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold">تواصل مباشر مع المستشار أحمد حلمي</h3>
            <p className="text-white/65 text-sm">اتصال، بريد، واتساب، أو إرسال طلب من داخل البوابة.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a href={`tel:${phone}`} className="dashboard-row-card hover:border-sky-300/25 transition-colors">
            <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-sky-300" /> اتصال مباشر</span>
            <span className="text-sm text-white/70">{phone}</span>
          </a>
          <a href={`mailto:${officeEmail}`} className="dashboard-row-card hover:border-sky-300/25 transition-colors">
            <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-sky-300" /> البريد</span>
            <span className="text-sm text-white/70 truncate">{officeEmail}</span>
          </a>
          <a href={`https://wa.me/${whatsappRaw}`} target="_blank" rel="noreferrer" className="dashboard-row-card hover:border-sky-300/25 transition-colors">
            <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-sky-300" /> واتساب</span>
            <span className="text-sm text-white/70">فتح المحادثة</span>
          </a>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-white/70">إرسال طلب أو استفسار من داخل البرنامج</p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب طلبك أو استفسارك هنا..."
            className="min-h-[110px] bg-black/20 border-white/10 text-white placeholder:text-white/35"
          />
          <div className="flex justify-end">
            <Button onClick={sendInsideApp} disabled={sending || !message.trim()} className="gap-2 bg-primary text-white hover:bg-primary/90">
              <Send className="h-4 w-4" />
              {sending ? 'جارٍ الإرسال...' : 'إرسال الاستفسار'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
