'use client'

import { Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import NotificationBell from '@/components/notifications/NotificationBell'
import { CurrencySelect } from '@/components/currency/CurrencySelect'
import { HeaderAuthActions } from '@/components/common/HeaderAuthActions'
import { useTranslations } from 'next-intl'

type TopbarProps = {
  onMenuClick?: () => void
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const t = useTranslations('adminDashboard')

  return (
    <header className="mb-4 flex flex-col gap-3 rounded-lg border border-muted bg-[#121212] p-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onMenuClick ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="text-white" />
          </Button>
        ) : null}

        <div className="min-w-0 flex-1 sm:max-w-sm">
          <Input
            placeholder={t('searchPlaceholder')}
            className="w-full border-muted bg-[#1a1a1a] text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
        <NotificationBell href="/userDashboard/notifications" variant="user" />

        <CurrencySelect triggerClassName="bg-[#1a1a1a]" />

        <HeaderAuthActions />
      </div>
    </header>
  )
}

export default Topbar
