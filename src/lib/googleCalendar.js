// تكامل Google Calendar — إضافة الجلسات والأحداث لتقويم المستخدم

import { supabase } from '@/integrations/supabase/client'
import { format, parseISO } from 'date-fns'

// ── طلب صلاحية Google Calendar أثناء login ──────────────────────────────────
export async function loginWithCalendarScope(redirectUrl) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl || window.location.origin,
      scopes: 'openid email profile https://www.googleapis.com/auth/calendar.events',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent select_account',
      },
    },
  })
  if (error) throw error
}

// ── جلب access_token من Supabase session ─────────────────────────────────────
async function getGoogleToken() {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.provider_token
  if (!token) throw new Error('لم يتم منح صلاحية Google Calendar. سجّل الدخول مجدداً.')
  return token
}

// ── إضافة حدث لـ Google Calendar ─────────────────────────────────────────────
export async function addSessionToGoogleCalendar(session) {
  const token = await getGoogleToken()

  if (!session.session_date) throw new Error('لا يوجد تاريخ للجلسة.')

  const startDate = new Date(session.session_date)
  const endDate   = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // +2 ساعة

  const event = {
    summary: `⚖️ جلسة: ${session.case_title || 'قضية'}`,
    description: [
      session.court    && `المحكمة: ${session.court}`,
      session.hall     && `القاعة: ${session.hall}`,
      session.client_name && `الموكل: ${session.client_name}`,
      session.session_type && `النوع: ${session.session_type}`,
      session.notes    && `ملاحظات: ${session.notes}`,
    ].filter(Boolean).join('\n'),
    location: session.court || '',
    start: {
      dateTime: startDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup',  minutes: 1440 }, // يوم قبل
        { method: 'popup',  minutes: 60  }, // ساعة قبل
        { method: 'email',  minutes: 1440 },
      ],
    },
    colorId: '9', // أزرق
  }

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method : 'POST',
      headers: {
        Authorization : `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    // إذا انتهت صلاحية التوكن
    if (res.status === 401) throw new Error('انتهت صلاحية Google. سجّل الدخول مجدداً.')
    // إذا لم تكن الصلاحية ممنوحة
    if (res.status === 403) throw new Error('صلاحية التقويم غير ممنوحة. سجّل الدخول مجدداً لمنح الصلاحية.')
    throw new Error(err?.error?.message || 'تعذر إضافة الحدث لتقويم Google.')
  }

  const created = await res.json()
  return { success: true, eventId: created.id, htmlLink: created.htmlLink }
}

// ── إضافة تذكير (task) لـ Google Calendar ─────────────────────────────────────
export async function addTaskToGoogleCalendar(task) {
  const token = await getGoogleToken()
  if (!task.due_date) throw new Error('لا يوجد موعد نهائي للمهمة.')

  const dueDate = new Date(task.due_date)
  const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000) // +1 ساعة

  const event = {
    summary    : `✅ مهمة: ${task.title || 'مهمة'}`,
    description: [
      task.case_title  && `القضية: ${task.case_title}`,
      task.client_name && `الموكل: ${task.client_name}`,
      task.priority    && `الأولوية: ${task.priority}`,
      task.notes       && `ملاحظات: ${task.notes}`,
    ].filter(Boolean).join('\n'),
    start: { dateTime: dueDate.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    end  : { dateTime: endDate.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
    colorId: task.priority === 'عالية' ? '11' : '5',
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method : 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body   : JSON.stringify(event),
  })

  if (!res.ok) {
    const err = await res.json()
    if (res.status === 401 || res.status === 403) throw new Error('صلاحية Google Calendar منتهية. سجّل الدخول مجدداً.')
    throw new Error(err?.error?.message || 'تعذر الإضافة لتقويم Google.')
  }
  return { success: true }
}

// ── التحقق من توفر صلاحية Calendar ───────────────────────────────────────────
export async function hasCalendarPermission() {
  try {
    const token = await getGoogleToken()
    if (!token) return false
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch { return false }
}

// ── بناء رابط Google Calendar مباشر (بدون API) ───────────────────────────────
export function buildGoogleCalendarUrl(session) {
  if (!session.session_date) return null
  const start = new Date(session.session_date)
  const end   = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const fmt   = (d) => d.toISOString().replace(/[-:]/g, '').replace('.000', '')
  const title = encodeURIComponent(`⚖️ جلسة: ${session.case_title || 'قضية'}`)
  const loc   = encodeURIComponent(session.court || '')
  const desc  = encodeURIComponent([session.client_name, session.court, session.hall].filter(Boolean).join(' | '))
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&location=${loc}&details=${desc}`
}
