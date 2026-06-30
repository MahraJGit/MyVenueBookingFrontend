'use client'

import type { ComponentProps, ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ── Design tokens ───────────────────────────────────────────── */

export const dashboardPanelClass =
  'w-full min-w-0 space-y-6 rounded-2xl border border-[#303030] bg-[#0e0e0e] p-4 text-white sm:p-6'

export const dashboardSurfaceClass =
  'w-full min-w-0 rounded-xl border border-[#303030] bg-[#121212] p-4 sm:p-6'

export const dashboardInputClass =
  'h-9 border-[#303030] bg-[#151515] text-sm text-white shadow-none placeholder:text-zinc-500 focus-visible:border-primary/50 focus-visible:ring-primary/20'

export const dashboardSelectTriggerClass =
  'h-9 border-[#303030] bg-[#151515] text-sm text-white shadow-none focus-visible:border-primary/50 focus-visible:ring-primary/20'

export const dashboardTextareaClass =
  'min-h-[100px] border-[#303030] bg-[#151515] text-sm text-white shadow-none placeholder:text-zinc-500 focus-visible:border-primary/50 focus-visible:ring-primary/20'

export const dashboardDropdownContentClass =
  'border-[#303030] bg-[#1B1B1B] text-white'

export const dashboardSortButtonClass =
  'h-8 w-full shrink-0 border-[#303030] bg-[#151515] text-sm text-muted-foreground hover:bg-[#1B1B1B] hover:text-white sm:w-auto'

export const dashboardTabCountClass =
  'ml-1.5 rounded-full bg-[#252525] px-1.5 py-0.5 text-xs tabular-nums text-zinc-400'

export const dashboardEyebrowClass =
  'mb-2 inline-flex items-center gap-2 rounded-full border border-[#303030] bg-[#151515] px-3 py-1 text-xs font-medium text-primary'

/* ── Layout shells ───────────────────────────────────────────── */

export function DashboardPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn(dashboardPanelClass, className)}>{children}</div>
}

export function DashboardSurface({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn(dashboardSurfaceClass, className)}>{children}</div>
}

export function DashboardPageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('space-y-6', className)}>{children}</div>
}

/* ── Form controls ───────────────────────────────────────────── */

export function DashboardSearchInput({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500"
        aria-hidden
      />
      <Input
        className={cn(dashboardInputClass, 'pl-9', className)}
        {...props}
      />
    </div>
  )
}

export function DashboardSortButton({
  className,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(dashboardSortButtonClass, className)}
      {...props}
    >
      {children}
    </Button>
  )
}

/* ── Tabs & filters ──────────────────────────────────────────── */

type DashboardTabItem<T extends string> = {
  value: T
  label: ReactNode
}

type DashboardScrollableTabsProps<T extends string> = {
  value: T
  onValueChange: (value: T) => void
  items: DashboardTabItem<T>[]
  className?: string
  listClassName?: string
  triggerClassName?: string
}

const dashboardTabTriggerClass =
  'h-8 shrink-0 flex-none rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-400 shadow-none transition-colors hover:border-[#303030] hover:bg-[#151515] hover:text-zinc-200 data-[state=active]:border-[#303030] data-[state=active]:bg-[#151515] data-[state=active]:text-white'

export { dashboardTabTriggerClass }

export function DashboardScrollableTabs<T extends string>({
  value,
  onValueChange,
  items,
  className,
  listClassName,
  triggerClassName,
}: DashboardScrollableTabsProps<T>) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      className={cn('w-full min-w-0 max-w-full', className)}
    >
      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsList
          className={cn(
            'inline-flex h-auto w-max min-w-full flex-nowrap items-center justify-start gap-1.5 bg-transparent p-0 sm:gap-2',
            listClassName,
          )}
        >
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className={cn(dashboardTabTriggerClass, triggerClassName)}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  )
}

export function DashboardFilterBar({
  children,
  action,
  className,
}: {
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-[#303030] pb-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 w-full flex-1">{children}</div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </div>
  )
}
