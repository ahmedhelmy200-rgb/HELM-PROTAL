import { useEffect } from 'react'
import { APP_DATA_CHANGED, subscribeAppEvent } from '@/lib/app-events'

export function usePageRefresh(loader, tables = []) {
  useEffect(() => {
    if (typeof loader !== 'function') return undefined
    const stop = subscribeAppEvent(APP_DATA_CHANGED, ({ table } = {}) => {
      if (!table || tables.length === 0 || tables.includes(table)) loader()
    })
    return stop
  }, [loader, JSON.stringify(tables)])
}
