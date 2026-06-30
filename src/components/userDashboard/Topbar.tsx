'use client'

import { Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import NotificationBell from '@/components/notifications/NotificationBell'
import { CurrencySelect } from '@/components/currency/CurrencySelect'
import { HeaderAuthActions } from '@/components/common/HeaderAuthActions'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { dashboardInputClass, dashboardSurfaceClass } from '@/components/dashboard/dashboard-ui'

type TopbarProps = {
  onMenuClick?: () => void
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const t = useTranslations('userDashboard')
  const tCommon = useTranslations('common')

  return (
    <header className={cn(dashboardSurfaceClass, 'mb-4 flex flex-col gap-3 p-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4')}>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onMenuClick ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={onMenuClick}
            aria-label={tCommon('toggleMenu')}
          >
            <Menu className="text-white" />
          </Button>
        ) : null}

        <div className="min-w-0 flex-1 sm:max-w-sm">
          <Input
            placeholder={t('searchPlaceholder')}
            className={cn(dashboardInputClass, 'w-full')}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
        <NotificationBell href="/userDashboard/notifications" variant="user" />

        <CurrencySelect triggerClassName="border-[#303030] bg-[#151515]" />

        <HeaderAuthActions />
      </div>
    </header>
  )
}

export default Topbar
