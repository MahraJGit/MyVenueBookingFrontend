'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import NotificationBell from '@/components/notifications/NotificationBell'
import { CurrencySelect } from '@/components/currency/CurrencySelect'
import { HeaderAuthActions } from '@/components/common/HeaderAuthActions'
import { useTranslations } from 'next-intl'

type TopbarProps = {
  onMenuClick?: () => void
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const tCommon = useTranslations('common')

  return (
    <header className="mb-4 flex items-center gap-3 rounded-xl border border-[#242424] bg-[#121212] p-3 sm:mb-6 sm:gap-4 sm:p-4">
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

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-4">
        <NotificationBell href="/userDashboard/notifications" variant="user" />

        <CurrencySelect triggerClassName="bg-[#1a1a1a]" />

        <HeaderAuthActions />
      </div>
    </header>
  )
}

export default Topbar
