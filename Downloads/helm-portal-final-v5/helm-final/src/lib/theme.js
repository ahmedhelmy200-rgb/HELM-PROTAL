const THEME_PREF_KEY = 'helm_theme_preference';

export function getStoredThemePreference() {
  if (typeof window === 'undefined') return 'system';
  return localStorage.getItem(THEME_PREF_KEY) || 'system';
}

export function setStoredThemePreference(value) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_PREF_KEY, value);
}

function clamp(v, min = 0, max = 255) {
  return Math.min(max, Math.max(min, v));
}

function normalizeHex(hex, fallback) {
  const value = String(hex || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  return fallback;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex, '#2563eb');
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

export function hexToHsl(hex, fallback = '#2563eb') {
  const { r, g, b } = hexToRgb(normalizeHex(hex, fallback));
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rr:
        h = (gg - bb) / d + (gg < bb ? 6 : 0);
        break;
      case gg:
        h = (bb - rr) / d + 2;
        break;
      default:
        h = (rr - gg) / d + 4;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function mixHex(hexA, hexB, ratio = 0.5) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const t = Math.min(1, Math.max(0, ratio));
  const r = clamp(Math.round(a.r + (b.r - a.r) * t));
  const g = clamp(Math.round(a.g + (b.g - a.g) * t));
  const bMix = clamp(Math.round(a.b + (b.b - a.b) * t));
  return `#${[r, g, bMix].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

export function applyVisualIdentity(settings = {}, resolvedTheme = 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  root.classList.remove('theme-dark', 'theme-light');
  root.classList.add(resolvedTheme === 'light' ? 'theme-light' : 'theme-dark');

  const primaryDefault = resolvedTheme === 'light' ? '#1d4ed8' : '#3b82f6';
  const accentDefault = resolvedTheme === 'light' ? '#0f766e' : '#14b8a6';
  const sidebarDefault = resolvedTheme === 'light' ? '#102a5f' : '#06142c';

  const primary = normalizeHex(settings.primary_color, primaryDefault);
  const accent = normalizeHex(settings.secondary_color, accentDefault);
  const sidebar = normalizeHex(settings.sidebar_color, sidebarDefault);

  const background = resolvedTheme === 'light'
    ? mixHex(primary, '#ffffff', 0.92)
    : mixHex(sidebar, '#020617', 0.55);
  const card = resolvedTheme === 'light'
    ? mixHex(primary, '#ffffff', 0.97)
    : mixHex(sidebar, '#0b1220', 0.45);
  const muted = resolvedTheme === 'light'
    ? mixHex(primary, '#f1f5f9', 0.9)
    : mixHex(sidebar, '#111827', 0.35);
  const secondary = resolvedTheme === 'light'
    ? mixHex(accent, '#eff6ff', 0.88)
    : mixHex(sidebar, accent, 0.12);
  const border = resolvedTheme === 'light'
    ? mixHex(primary, '#cbd5e1', 0.82)
    : mixHex(sidebar, '#64748b', 0.18);
  const chart3 = mixHex(primary, '#a855f7', 0.45);
  const chart4 = mixHex(accent, '#22c55e', 0.42);
  const chart5 = mixHex(primary, '#f59e0b', 0.55);

  root.style.setProperty('--primary', hexToHsl(primary, primaryDefault));
  root.style.setProperty('--accent', hexToHsl(accent, accentDefault));
  root.style.setProperty('--ring', hexToHsl(primary, primaryDefault));
  root.style.setProperty('--chart-1', hexToHsl(primary, primaryDefault));
  root.style.setProperty('--chart-2', hexToHsl(accent, accentDefault));
  root.style.setProperty('--chart-3', hexToHsl(chart3, '#a855f7'));
  root.style.setProperty('--chart-4', hexToHsl(chart4, '#22c55e'));
  root.style.setProperty('--chart-5', hexToHsl(chart5, '#f59e0b'));
  root.style.setProperty('--sidebar-background', hexToHsl(sidebar, sidebarDefault));
  root.style.setProperty('--sidebar-foreground', resolvedTheme === 'light' ? '0 0% 100%' : '213 31% 92%');
  root.style.setProperty('--sidebar-border', hexToHsl(mixHex(sidebar, '#94a3b8', resolvedTheme === 'light' ? 0.24 : 0.09), '#1f2d48'));
  root.style.setProperty('--sidebar-accent', hexToHsl(primary, primaryDefault));
  root.style.setProperty('--sidebar-accent-foreground', '0 0% 100%');
  root.style.setProperty('--background', hexToHsl(background, resolvedTheme === 'light' ? '#f8fbff' : '#09101c'));
  root.style.setProperty('--card', hexToHsl(card, resolvedTheme === 'light' ? '#ffffff' : '#0d1525'));
  root.style.setProperty('--popover', hexToHsl(card, resolvedTheme === 'light' ? '#ffffff' : '#0d1525'));
  root.style.setProperty('--muted', hexToHsl(muted, resolvedTheme === 'light' ? '#eef4fb' : '#121b2d'));
  root.style.setProperty('--secondary', hexToHsl(secondary, resolvedTheme === 'light' ? '#eff6ff' : '#122033'));
  root.style.setProperty('--border', hexToHsl(border, resolvedTheme === 'light' ? '#cbd5e1' : '#243247'));
  root.style.setProperty('--input', hexToHsl(border, resolvedTheme === 'light' ? '#cbd5e1' : '#243247'));

  const font = settings.app_font || 'Cairo';
  body.style.fontFamily = `'${font}', 'Segoe UI', sans-serif`;
}
