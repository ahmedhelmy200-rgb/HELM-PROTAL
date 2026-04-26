// ── نظام الثيمات الكامل — HELM v10 Pro ───────────────────────────────────────

export const THEMES = [
  {
    id: 'midnight',
    label: 'منتصف الليل',
    desc: 'أزرق داكن عميق — الثيم الافتراضي',
    icon: '🌙',
    preview: { bg: '#03070f', primary: '#3b82f6', accent: '#06b6d4', sidebar: '#040a1c' },
    vars: {
      '--background':        '222 55% 6%',
      '--foreground':        '210 45% 97%',
      '--card':              '220 50% 9%',
      '--card-foreground':   '210 45% 97%',
      '--primary':           '213 96% 62%',
      '--primary-foreground':'0 0% 100%',
      '--muted':             '220 35% 12%',
      '--muted-foreground':  '214 22% 72%',
      '--accent':            '183 96% 50%',
      '--accent-foreground': '220 40% 8%',
      '--border':            '220 32% 22%',
      '--destructive':       '0 85% 62%',
      '--sidebar-background':'222 70% 7%',
    },
    body: 'radial-gradient(ellipse at 20% 20%, rgba(37,99,235,.18), transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(6,182,212,.12), transparent 45%), hsl(222 55% 6%)',
  },
  {
    id: 'emerald',
    label: 'زمردي',
    desc: 'أخضر داكن راقٍ — طابع قانوني',
    icon: '💚',
    preview: { bg: '#030f0a', primary: '#10b981', accent: '#34d399', sidebar: '#041209' },
    vars: {
      '--background':        '158 55% 5%',
      '--foreground':        '150 35% 96%',
      '--card':              '158 50% 8%',
      '--card-foreground':   '150 35% 96%',
      '--primary':           '160 84% 39%',
      '--primary-foreground':'0 0% 100%',
      '--muted':             '158 35% 11%',
      '--muted-foreground':  '158 20% 65%',
      '--accent':            '152 70% 55%',
      '--accent-foreground': '158 55% 6%',
      '--border':            '158 30% 20%',
      '--destructive':       '0 85% 62%',
      '--sidebar-background':'158 70% 6%',
    },
    body: 'radial-gradient(ellipse at 20% 20%, rgba(16,185,129,.16), transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(52,211,153,.1), transparent 45%), hsl(158 55% 5%)',
  },
  {
    id: 'crimson',
    label: 'قرمزي',
    desc: 'أحمر داكن جريء — لمكاتب متميزة',
    icon: '🔴',
    preview: { bg: '#0f0306', primary: '#ef4444', accent: '#f97316', sidebar: '#0c0204' },
    vars: {
      '--background':        '350 55% 5%',
      '--foreground':        '0 30% 97%',
      '--card':              '350 50% 8%',
      '--card-foreground':   '0 30% 97%',
      '--primary':           '0 84% 60%',
      '--primary-foreground':'0 0% 100%',
      '--muted':             '350 35% 11%',
      '--muted-foreground':  '350 18% 65%',
      '--accent':            '25 95% 55%',
      '--accent-foreground': '350 55% 6%',
      '--border':            '350 28% 20%',
      '--destructive':       '0 85% 62%',
      '--sidebar-background':'350 70% 6%',
    },
    body: 'radial-gradient(ellipse at 20% 20%, rgba(239,68,68,.16), transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(249,115,22,.1), transparent 45%), hsl(350 55% 5%)',
  },
  {
    id: 'violet',
    label: 'بنفسجي',
    desc: 'بنفسجي ملكي فاخر',
    icon: '💜',
    preview: { bg: '#08040f', primary: '#8b5cf6', accent: '#a78bfa', sidebar: '#060212' },
    vars: {
      '--background':        '270 55% 5%',
      '--foreground':        '270 25% 97%',
      '--card':              '268 50% 8%',
      '--card-foreground':   '270 25% 97%',
      '--primary':           '262 83% 65%',
      '--primary-foreground':'0 0% 100%',
      '--muted':             '268 35% 11%',
      '--muted-foreground':  '268 18% 65%',
      '--accent':            '258 90% 75%',
      '--accent-foreground': '270 55% 6%',
      '--border':            '268 28% 20%',
      '--destructive':       '0 85% 62%',
      '--sidebar-background':'270 70% 6%',
    },
    body: 'radial-gradient(ellipse at 20% 20%, rgba(139,92,246,.18), transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(167,139,250,.1), transparent 45%), hsl(270 55% 5%)',
  },
  {
    id: 'gold',
    label: 'ذهبي',
    desc: 'ذهبي فاخر — هيبة ورسمية',
    icon: '🥇',
    preview: { bg: '#0a0700', primary: '#f59e0b', accent: '#fbbf24', sidebar: '#080500' },
    vars: {
      '--background':        '38 55% 4%',
      '--foreground':        '38 25% 97%',
      '--card':              '38 50% 7%',
      '--card-foreground':   '38 25% 97%',
      '--primary':           '38 92% 50%',
      '--primary-foreground':'0 0% 0%',
      '--muted':             '38 35% 10%',
      '--muted-foreground':  '38 18% 62%',
      '--accent':            '45 96% 58%',
      '--accent-foreground': '38 55% 5%',
      '--border':            '38 28% 18%',
      '--destructive':       '0 85% 62%',
      '--sidebar-background':'38 70% 5%',
    },
    body: 'radial-gradient(ellipse at 20% 20%, rgba(245,158,11,.16), transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(251,191,36,.1), transparent 45%), hsl(38 55% 4%)',
  },
  {
    id: 'slate',
    label: 'رمادي فاتح',
    desc: 'وضع نهاري محايد',
    icon: '☀️',
    light: true,
    preview: { bg: '#f8fafc', primary: '#1d4ed8', accent: '#0891b2', sidebar: '#0f1f4b' },
    vars: {
      '--background':        '220 30% 97%',
      '--foreground':        '218 55% 10%',
      '--card':              '0 0% 100%',
      '--card-foreground':   '218 55% 10%',
      '--primary':           '216 95% 44%',
      '--primary-foreground':'0 0% 100%',
      '--muted':             '216 28% 93%',
      '--muted-foreground':  '215 22% 40%',
      '--accent':            '186 92% 38%',
      '--accent-foreground': '0 0% 100%',
      '--border':            '216 28% 82%',
      '--destructive':       '0 78% 52%',
      '--sidebar-background':'218 65% 11%',
    },
    body: 'radial-gradient(ellipse at top right, rgba(219,234,254,.6), transparent 50%), hsl(220 30% 97%)',
  },
  {
    id: 'ocean',
    label: 'محيطي',
    desc: 'أزرق محيطي هادئ',
    icon: '🌊',
    preview: { bg: '#030d18', primary: '#0ea5e9', accent: '#38bdf8', sidebar: '#020b14' },
    vars: {
      '--background':        '210 60% 6%',
      '--foreground':        '196 35% 96%',
      '--card':              '210 55% 9%',
      '--card-foreground':   '196 35% 96%',
      '--primary':           '199 89% 48%',
      '--primary-foreground':'0 0% 100%',
      '--muted':             '210 38% 12%',
      '--muted-foreground':  '200 22% 65%',
      '--accent':            '198 93% 60%',
      '--accent-foreground': '210 60% 6%',
      '--border':            '210 32% 22%',
      '--destructive':       '0 85% 62%',
      '--sidebar-background':'210 70% 7%',
    },
    body: 'radial-gradient(ellipse at 20% 20%, rgba(14,165,233,.18), transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(56,189,248,.12), transparent 45%), hsl(210 60% 6%)',
  },
  {
    id: 'rose',
    label: 'وردي',
    desc: 'وردي عصري مميز',
    icon: '🌸',
    preview: { bg: '#0f030a', primary: '#ec4899', accent: '#f472b6', sidebar: '#0c0208' },
    vars: {
      '--background':        '330 55% 5%',
      '--foreground':        '330 25% 97%',
      '--card':              '330 50% 8%',
      '--card-foreground':   '330 25% 97%',
      '--primary':           '330 81% 60%',
      '--primary-foreground':'0 0% 100%',
      '--muted':             '330 35% 11%',
      '--muted-foreground':  '330 18% 64%',
      '--accent':            '340 90% 65%',
      '--accent-foreground': '330 55% 6%',
      '--border':            '330 28% 20%',
      '--destructive':       '0 85% 62%',
      '--sidebar-background':'330 70% 6%',
    },
    body: 'radial-gradient(ellipse at 20% 20%, rgba(236,72,153,.16), transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(244,114,182,.1), transparent 45%), hsl(330 55% 5%)',
  },
]

const THEME_KEY = 'helm_active_theme'

export function getActiveThemeId() {
  return localStorage.getItem(THEME_KEY) || 'midnight'
}

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const root  = document.documentElement

  // تطبيق CSS variables
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))

  // تطبيق theme mode
  if (theme.light) {
    root.classList.remove('theme-dark')
    root.classList.add('theme-light')
    root.setAttribute('data-theme', 'light')
  } else {
    root.classList.remove('theme-light')
    root.classList.add('theme-dark')
    root.setAttribute('data-theme', 'dark')
  }

  // تطبيق خلفية الـ body
  if (theme.body) {
    document.body.style.background = theme.body
  }

  localStorage.setItem(THEME_KEY, themeId)
  return theme
}

export function initTheme() {
  const id = getActiveThemeId()
  applyTheme(id)
}
