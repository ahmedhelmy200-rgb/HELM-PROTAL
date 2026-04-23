import React from 'react'

// أنيميشن shimmer مخصص
function Shimmer({ className = '' }) {
  return (
    <div className={`skeleton-shimmer rounded-2xl ${className}`} />
  )
}

// Skeleton لبطاقات البيانات
export function CardsSkeleton({ count = 4, cols = 4 }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-3xl p-5 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <Shimmer className="h-10 w-10" />
            <Shimmer className="h-4 w-16" />
          </div>
          <Shimmer className="h-7 w-24" />
          <Shimmer className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

// Skeleton لقوائم البيانات
export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4">
          <Shimmer className="h-12 w-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-1/3" />
            <Shimmer className="h-3 w-1/2" />
          </div>
          <Shimmer className="h-6 w-20 shrink-0" />
        </div>
      ))}
    </div>
  )
}

// Skeleton للـ Dashboard
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero */}
      <div className="rounded-3xl border border-border bg-card p-6 h-40">
        <Shimmer className="h-5 w-48 mb-3" />
        <Shimmer className="h-8 w-72 mb-2" />
        <Shimmer className="h-4 w-56" />
      </div>
      {/* Stats */}
      <CardsSkeleton count={4} cols={4} />
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Shimmer className="h-4 w-32" />
          <ListSkeleton count={3} />
        </div>
        <div className="space-y-3">
          <Shimmer className="h-4 w-32" />
          <ListSkeleton count={3} />
        </div>
      </div>
    </div>
  )
}

// Generic page skeleton
export default function PageSkeleton({ type = 'list' }) {
  if (type === 'dashboard') return <DashboardSkeleton />
  if (type === 'cards')     return <div className="space-y-5"><CardsSkeleton /><ListSkeleton /></div>
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <Shimmer className="h-8 w-48" />
        <Shimmer className="h-10 w-32" />
      </div>
      <Shimmer className="h-12 w-full" />
      <ListSkeleton count={6} />
    </div>
  )
}
