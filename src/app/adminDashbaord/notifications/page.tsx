'use client'

import { useTranslations } from 'next-intl'
import NotificationsList from '@/components/notifications/NotificationsList'

export default function AdminNotifications() {
  const t = useTranslations('notifications')
  const tAdmin = useTranslations('adminNotifications')

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-2">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {tAdmin('description')}
      </p>
      <NotificationsList className="rounded-xl bg-[#121212] p-8" />
    </div>
  )
}
