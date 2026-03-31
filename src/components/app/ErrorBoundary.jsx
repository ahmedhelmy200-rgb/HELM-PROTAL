import React from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global error boundary caught:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
        <div className="max-w-lg w-full rounded-3xl border border-destructive/20 bg-card p-6 shadow-xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold">حدث خطأ غير متوقع</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-7">تم منع الشاشة البيضاء. يمكنك إعادة تحميل الصفحة أو الرجوع خطوة للخلف. إذا تكرر الخطأ فالمشكلة في هذا المكوّن تحديدًا وليست في الجلسة كلها.</p>
          </div>
          {this.state.error?.message && (
            <div className="rounded-2xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground break-words">
              {this.state.error.message}
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => window.history.back()}>رجوع</Button>
            <Button onClick={this.handleReload} className="gap-2"><RefreshCcw className="h-4 w-4" />إعادة تحميل</Button>
          </div>
        </div>
      </div>
    )
  }
}
