'use client'

import type { ReactNode } from 'react'
import { Construction, Loader2, Menu, AlertCircle, LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/auth-context'

export const dashboardShellClass =
  'flex min-h-screen bg-black bg-[radial-gradient(circle_at_left_center,rgba(80,0,40,0.6)_0%,rgba(40,0,20,0.4)_30%,rgba(10,0,10,0.2)_50%,#000_80%)]'

export const dashboardMainClass = 'flex min-w-0 flex-1 flex-col'

export const dashboardContentClass =
  'flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6'

export const dashboardOverlayClass =
  'fixed inset-0 z-40 bg-black/60 lg:hidden'

/** Primary content panel — matches notifications / list pages */
export const dashboardContentPanelClass =
  'w-full min-w-0 space-y-6 rounded-2xl border border-[#303030] bg-[#0e0e0e] p-4 text-white sm:p-6'

export const dashboardFilterBarBorderClass = 'border-[#303030]'

export const dashboardListItemClass =
  'rounded-xl bg-[#151515] transition-colors hover:bg-[#1a1a1a]'

export const dashboardSurfaceBorderClass = 'border-[#303030]'

export const dashboardPanelClass = dashboardContentPanelClass

export function DashboardContentPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn(dashboardContentPanelClass, className)}>{children}</div>
  )
}

export {
  DashboardPanel,
  DashboardSurface,
  DashboardPageShell,
  DashboardSearchInput,
  DashboardSortButton,
  DashboardScrollableTabs,
  DashboardFilterBar,
  dashboardSurfaceClass,
  dashboardInputClass,
  dashboardSelectTriggerClass,
  dashboardTextareaClass,
  dashboardDropdownContentClass,
  dashboardSortButtonClass,
  dashboardTabCountClass,
  dashboardEyebrowClass,
  dashboardTabTriggerClass,
  dashboardBorderClass,
  dashboardCardClass,
  dashboardTopbarClass,
  dashboardStatCardClass,
  dashboardTableWrapperClass,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardOutlineButtonClass,
  dashboardDialogContentClass,
  dashboardTabsListClass,
  DashboardTableWrapper,
  DashboardStatCard,
  DashboardErrorAlert,
  DashboardPagination,
} from './dashboard-ui'

export { DashboardDataTable } from './dashboard-data-table'

export const dashboardSidebarClass =
  'fixed top-0 left-0 z-50 flex h-full w-[280px] flex-col border-r border-white/10 bg-[#1B1B1B] p-4 text-white transition-transform duration-300 lg:static lg:m-4 lg:min-h-[calc(100vh-2rem)] lg:rounded-2xl lg:border-r-0'

export function DashboardMobileHeader({
  onMenuClick,
  title,
}: {
  onMenuClick: () => void
  title?: string
}) {
  const tCommon = useTranslations('common')

  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 lg:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label={tCommon('toggleMenu')}
      >
        <Menu className="text-white" />
      </Button>
      {title ? (
        <span className="truncate text-sm font-medium text-white">{title}</span>
      ) : null}
    </div>
  )
}

export function DashboardPageHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function DashboardComingSoon({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const tCommon = useTranslations('common')

  return (
    <Card className="border-[#303030] bg-[#1B1B1B]">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
          <Construction className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <CardTitle className="text-xl text-white">{title}</CardTitle>
        <CardDescription className="max-w-md text-base">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-8">
        <span className="rounded-full border border-[#303030] bg-[#121212] px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {tCommon('comingSoon')}
        </span>
      </CardContent>
    </Card>
  )
}

export function DashboardLoadingState({
  message,
  className,
}: {
  message?: string
  className?: string
}) {
  const tCommon = useTranslations('common')

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 text-center',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">
        {message ?? tCommon('loading')}
      </p>
    </div>
  )
}

export function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  const tCommon = useTranslations('common')

  return (
    <Card className="border-destructive/40 bg-[#1B1B1B]">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" aria-hidden />
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
        {onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            {tCommon('retry')}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function DashboardLogoutButton({
  className,
  onAfterLogout,
}: {
  className?: string
  onAfterLogout?: () => void
}) {
  const { logout } = useAuth()
  const t = useTranslations('userDashboard')

  return (
    <button
      type="button"
      onClick={async () => {
        onAfterLogout?.()
        await logout()
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-4 py-2 text-sm text-gray-300 transition hover:bg-red-500/10 hover:text-red-400',
        className,
      )}
    >
      <LogOut size={18} className="shrink-0" aria-hidden />
      {t('logOut')}
    </button>
  )
}
