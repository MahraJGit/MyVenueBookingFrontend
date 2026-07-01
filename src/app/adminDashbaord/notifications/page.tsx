'use client'

import { useTranslations } from 'next-intl'
import NotificationsList from '@/components/notifications/NotificationsList'
import { DashboardPageShell, DashboardPanel } from '@/components/dashboard/dashboard-ui'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-shared'

export default function AdminNotifications() {
  const t = useTranslations('notifications')
  const tAdmin = useTranslations('adminNotifications')

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={t('title')}
          description={tAdmin('description')}
        />
        <NotificationsList embedded />
      </DashboardPanel>
    </DashboardPageShell>
  )
}
