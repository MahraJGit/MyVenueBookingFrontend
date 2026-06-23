'use client'

import React from 'react'

import { Input } from '@/components/ui/input'
import NotificationBell from '@/components/notifications/NotificationBell'
import { CurrencySelect } from '@/components/currency/CurrencySelect'
import { HeaderAuthActions } from '@/components/common/HeaderAuthActions'
import { useTranslations } from 'next-intl'

const Topbar = () => {
  const t = useTranslations('adminDashboard')

  return (
    <header className="flex items-center justify-between gap-4 p-4 bg-[#121212]  border-muted rounded-lg mb-6">
      
      <div className="w-full max-w-sm">
        <Input
          placeholder={t('searchPlaceholder')}
          className="bg-[#1a1a1a] border-muted text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell href="/userDashboard/notifications" variant="user" />

        <div className="hidden lg:block">
          <CurrencySelect triggerClassName="bg-[#1a1a1a]" />
        </div>

        <HeaderAuthActions />
      </div>
    </header>
  )
}

export default Topbar
