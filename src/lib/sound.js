// ── محرك الصوت الكهربائي — HELM v10 Pro ──────────────────────────────────────
let audioContext = null

function getCtx() {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioContext) audioContext = new Ctx()
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {})
  return audioContext
}

// ── مكوّنات أساسية ────────────────────────────────────────────────────────────
function arcSpark({ start=1180, end=360, duration=0.075, volume=0.018, type='sawtooth', q=6 }={}) {
  const ctx = getCtx(); if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filt = ctx.createBiquadFilter()
  filt.type = 'bandpass'; filt.frequency.setValueAtTime(start*.9, now); filt.Q.value = q
  osc.type = type
  osc.frequency.setValueAtTime(start, now)
  osc.frequency.exponentialRampToValueAtTime(Math.max(60, end), now + duration)
  gain.gain.setValueAtTime(Math.max(0.0001, volume), now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination)
  osc.start(now); osc.stop(now + duration)
}

function noiseBurst({ duration=0.03, volume=0.012, band=2200 }={}) {
  const ctx = getCtx(); if (!ctx) return
  const len = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d   = buf.getChannelData(0)
  for (let i=0; i<len; i++) d[i] = (Math.random()*2-1)*(1-i/len)
  const src  = ctx.createBufferSource()
  const filt = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  filt.type = 'highpass'; filt.frequency.value = band
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+duration)
  src.buffer = buf; src.connect(filt); filt.connect(gain); gain.connect(ctx.destination)
  src.start(); src.stop(ctx.currentTime+duration)
}

function tone({ freq=440, duration=0.12, volume=0.08, type='sine', attack=0.01, release=0.08, delay=0 }={}) {
  window.setTimeout(() => {
    const ctx = getCtx(); if (!ctx) return
    const now  = ctx.currentTime
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type; osc.frequency.setValueAtTime(freq, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(volume, now + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(now); osc.stop(now + duration + 0.05)
  }, delay)
}

function electricTick({ start, end, duration, volume, delay=0, noise=true }) {
  window.setTimeout(() => {
    arcSpark({ start, end, duration, volume, type:'sawtooth' })
    if (noise) noiseBurst({ duration: Math.max(0.018, duration*.58), volume: volume*.52, band: Math.max(1400, start*1.1) })
  }, delay)
}

// ── ثيمات الصوت ───────────────────────────────────────────────────────────────
export const SOUND_THEMES = {
  electric: {
    id: 'electric', label: 'كهربائي', icon: '⚡',
    nav  : () => { electricTick({ start:1280, end:480, duration:0.042, volume:0.012 }); electricTick({ start:760, end:300, duration:0.038, volume:0.0085, delay:14, noise:false }) },
    click: () => { electricTick({ start:1450, end:540, duration:0.05, volume:0.016 }); electricTick({ start:980, end:420, duration:0.06, volume:0.011, delay:24 }) },
    save : () => { electricTick({ start:1520, end:620, duration:0.052, volume:0.018 }); electricTick({ start:1120, end:420, duration:0.068, volume:0.013, delay:26 }); electricTick({ start:720, end:260, duration:0.085, volume:0.009, delay:52, noise:false }) },
    error: () => { electricTick({ start:300, end:120, duration:0.12, volume:0.022 }); electricTick({ start:220, end:90, duration:0.15, volume:0.015, delay:40 }) },
    success: () => { electricTick({ start:880, end:1200, duration:0.06, volume:0.016 }); electricTick({ start:1100, end:1600, duration:0.07, volume:0.013, delay:35 }) },
    delete: () => { electricTick({ start:600, end:200, duration:0.1, volume:0.02 }); electricTick({ start:400, end:150, duration:0.12, volume:0.014, delay:35 }) },
    notification: () => { electricTick({ start:1800, end:900, duration:0.04, volume:0.014 }); electricTick({ start:1400, end:700, duration:0.05, volume:0.01, delay:60 }); electricTick({ start:1800, end:900, duration:0.04, volume:0.014, delay:130 }) },
    open : () => { electricTick({ start:900, end:1400, duration:0.055, volume:0.013 }) },
    close: () => { electricTick({ start:1400, end:900, duration:0.055, volume:0.013 }) },
    toggle: () => { electricTick({ start:1450, end:540, duration:0.05, volume:0.016 }); electricTick({ start:980, end:420, duration:0.06, volume:0.011, delay:24 }) },
  },
  crystal: {
    id: 'crystal', label: 'كريستال', icon: '💎',
    nav  : () => { tone({ freq:1047, duration:0.1, volume:0.06, type:'sine', attack:0.005 }) },
    click: () => { tone({ freq:1319, duration:0.08, volume:0.07, type:'triangle', attack:0.003 }) },
    save : () => { tone({ freq:1047, duration:0.1, volume:0.07, attack:0.005 }); tone({ freq:1319, duration:0.12, volume:0.06, delay:80, attack:0.005 }); tone({ freq:1568, duration:0.15, volume:0.08, delay:160, attack:0.01 }) },
    error: () => { tone({ freq:196, duration:0.2, volume:0.07, type:'triangle' }) },
    success: () => { tone({ freq:784, duration:0.1, volume:0.06 }); tone({ freq:988, duration:0.12, volume:0.07, delay:90 }); tone({ freq:1175, duration:0.18, volume:0.08, delay:180 }) },
    delete: () => { tone({ freq:392, duration:0.15, volume:0.07, type:'triangle' }); tone({ freq:294, duration:0.18, volume:0.06, delay:80 }) },
    notification: () => { tone({ freq:1568, duration:0.08, volume:0.07, attack:0.004 }); tone({ freq:1568, duration:0.08, volume:0.05, delay:150, attack:0.004 }) },
    open : () => { tone({ freq:880, duration:0.09, volume:0.06, attack:0.006 }) },
    close: () => { tone({ freq:698, duration:0.09, volume:0.05, attack:0.003 }) },
    toggle: () => { tone({ freq:1319, duration:0.08, volume:0.07, type:'triangle', attack:0.003 }) },
  },
  wood: {
    id: 'wood', label: 'خشبي', icon: '🪵',
    nav  : () => { noiseBurst({ duration:0.04, volume:0.03, band:800 }) },
    click: () => { noiseBurst({ duration:0.06, volume:0.04, band:600 }) },
    save : () => { noiseBurst({ duration:0.05, volume:0.04, band:700 }); noiseBurst({ duration:0.06, volume:0.035, band:900 }) },
    error: () => { noiseBurst({ duration:0.15, volume:0.05, band:200 }) },
    success: () => { noiseBurst({ duration:0.04, volume:0.03, band:1200 }); noiseBurst({ duration:0.04, volume:0.035, band:900 }) },
    delete: () => { noiseBurst({ duration:0.1, volume:0.045, band:400 }) },
    notification: () => { noiseBurst({ duration:0.035, volume:0.03, band:1400 }); noiseBurst({ duration:0.035, volume:0.025, band:1400 }) },
    open : () => { noiseBurst({ duration:0.05, volume:0.025, band:1000 }) },
    close: () => { noiseBurst({ duration:0.05, volume:0.025, band:600 }) },
    toggle: () => { noiseBurst({ duration:0.06, volume:0.04, band:600 }) },
  },
  minimal: {
    id: 'minimal', label: 'خفيف', icon: '🌊',
    nav  : () => { tone({ freq:440, duration:0.06, volume:0.025, type:'sine', attack:0.004 }) },
    click: () => { tone({ freq:523, duration:0.05, volume:0.02, type:'sine', attack:0.003 }) },
    save : () => { tone({ freq:523, duration:0.08, volume:0.025, attack:0.01 }); tone({ freq:659, duration:0.1, volume:0.03, delay:70, attack:0.01 }) },
    error: () => { tone({ freq:233, duration:0.15, volume:0.025, type:'sine' }) },
    success: () => { tone({ freq:523, duration:0.07, volume:0.025, attack:0.01 }); tone({ freq:784, duration:0.12, volume:0.03, delay:80, attack:0.01 }) },
    delete: () => { tone({ freq:349, duration:0.1, volume:0.022, type:'sine' }) },
    notification: () => { tone({ freq:880, duration:0.06, volume:0.02, attack:0.006 }); tone({ freq:880, duration:0.06, volume:0.018, delay:120 }) },
    open : () => { tone({ freq:523, duration:0.06, volume:0.018, attack:0.008 }) },
    close: () => { tone({ freq:392, duration:0.06, volume:0.015, attack:0.004 }) },
    toggle: () => { tone({ freq:523, duration:0.05, volume:0.02, type:'sine', attack:0.003 }) },
  },
  silent: {
    id: 'silent', label: 'صامت', icon: '🔇',
    nav: ()=>{}, click: ()=>{}, save: ()=>{}, error: ()=>{},
    success: ()=>{}, delete: ()=>{}, notification: ()=>{}, open: ()=>{}, close: ()=>{}, toggle: ()=>{},
  },
}

// ── المشغّل الرئيسي ───────────────────────────────────────────────────────────
const THEME_KEY  = 'helm_sound_theme'
const ENABLED_KEY = 'helm_sound_enabled'

export function getSoundTheme() {
  return localStorage.getItem(THEME_KEY) || 'electric'
}
export function setSoundTheme(id) {
  localStorage.setItem(THEME_KEY, id)
}
export function getSoundEnabled() {
  return localStorage.getItem(ENABLED_KEY) !== 'false'
}
export function setSoundEnabled(v) {
  localStorage.setItem(ENABLED_KEY, String(v))
}

export function playUiTone(name, enabled = true) {
  if (!enabled || !getSoundEnabled()) return
  const theme = SOUND_THEMES[getSoundTheme()] || SOUND_THEMES.electric
  const fn = theme[name] || theme.click
  try { fn() } catch {}
}

export function previewTheme(themeId) {
  const theme = SOUND_THEMES[themeId]
  if (!theme) return
  try { theme.save() } catch {}
}
