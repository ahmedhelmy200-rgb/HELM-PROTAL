export const APP_DATA_CHANGED = 'app:data-changed'
export const APP_SHORTCUT_NEW = 'app:shortcut:new'
export const APP_SHORTCUT_SEARCH = 'app:shortcut:search'
export const APP_SHORTCUT_HELP = 'app:shortcut:help'

export function emitAppEvent(name, detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

export function subscribeAppEvent(name, handler) {
  if (typeof window === 'undefined') return () => {}
  const wrapped = (event) => handler(event.detail, event)
  window.addEventListener(name, wrapped)
  return () => window.removeEventListener(name, wrapped)
}
