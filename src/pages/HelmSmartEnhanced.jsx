import React, { useCallback, useEffect, useRef } from 'react'
import HelmSmart from './HelmSmart'
import { useAuth } from '@/lib/AuthContext'
import { base44 } from '@/api/base44Client'
import { buildCompleteHelmSmartPayload } from '@/lib/helmSmartFullSync'

const ACK_MESSAGE_TYPE = 'HELM_SMART_SYNC_ACK'
const SYNC_MESSAGE_TYPE = 'HELM_PORTAL_SYNC_DATA'
const FRAME_TITLE = 'HELM Smart Modern Embedded'
const FULL_SYNC_INTERVAL_MS = 60_000

function getSmartFrame() {
  if (typeof document === 'undefined') return null
  return document.querySelector(`iframe[title="${FRAME_TITLE}"]`)
}

function normalizePriority(value) {
  const raw = String(value || '').toLowerCase()
  if (raw === 'high' || raw.includes('عال')) return 'high'
  if (raw === 'low' || raw.includes('منخفض')) return 'low'
  return 'normal'
}

function normalizeFullPayload(payload) {
  const now = new Date().toISOString()
  const clients = (payload.clients || []).map((client) => {
    if (client?.category !== 'other') return client
    const id = String(client.id || client.email || client.phone || client.name || 'other')
    return { ...client, id: id.startsWith('contact-') ? id : `contact-${id}` }
  })

  const reminders = (payload.reminders || []).map((item) => {
    let source = item?.source || { type: 'manual' }
    if (source.type === 'case') source = { type: 'case_hearing', caseId: source.caseId || '' }
    if (!['manual', 'case_hearing', 'doc_review'].includes(source.type)) source = { type: 'manual' }
    return {
      ...item,
      priority: normalizePriority(item?.priority),
      createdAt: item?.createdAt || now,
      source,
    }
  })

  return { ...payload, clients, reminders }
}

export default function HelmSmartEnhanced() {
  const { user } = useAuth()
  const runningRef = useRef(false)
  const lastSentAtRef = useRef(0)
  const timerRef = useRef(null)

  const sendFullSnapshot = useCallback(async ({ force = false } = {}) => {
    if (!user?.email || runningRef.current) return false
    const now = Date.now()
    if (!force && now - lastSentAtRef.current < 5_000) return false

    const frame = getSmartFrame()
    if (!frame?.contentWindow) return false

    runningRef.current = true
    try {
      const payload = normalizeFullPayload(await buildCompleteHelmSmartPayload(base44))
      frame.contentWindow.postMessage({ type: SYNC_MESSAGE_TYPE, payload }, '*')
      lastSentAtRef.current = Date.now()
      window.dispatchEvent(new CustomEvent('helm-smart-full-sync-sent', {
        detail: { syncedAt: payload.syncedAt, syncMeta: payload.syncMeta },
      }))
      return true
    } catch (error) {
      console.error('[HELM Portal] Full HELM Smart sync failed:', error)
      return false
    } finally {
      runningRef.current = false
    }
  }, [user?.email])

  useEffect(() => {
    if (!user?.email) return undefined

    const onMessage = (event) => {
      const data = event?.data
      if (!data || data.type !== ACK_MESSAGE_TYPE) return

      if (data.message === 'bridge-ready') {
        window.setTimeout(() => sendFullSnapshot({ force: true }), 1_200)
        return
      }

      // The legacy page may have just sent its smaller payload. Follow it with
      // the full Portal mirror unless a full sync was sent moments ago.
      if (data.status === 'ok' && Date.now() - lastSentAtRef.current > 5_000) {
        window.setTimeout(() => sendFullSnapshot(), 500)
      }
    }

    window.addEventListener('message', onMessage)

    timerRef.current = window.setInterval(() => {
      sendFullSnapshot()
    }, FULL_SYNC_INTERVAL_MS)

    // Safety pass after the iframe has had enough time to mount/reload.
    const initialTimer = window.setTimeout(() => sendFullSnapshot({ force: true }), 3_500)

    return () => {
      window.removeEventListener('message', onMessage)
      window.clearTimeout(initialTimer)
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [sendFullSnapshot, user?.email])

  return <HelmSmart />
}
