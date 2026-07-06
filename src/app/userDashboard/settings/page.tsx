'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Switch } from '@/components/ui/switch'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/features/notifications/api'
import { notificationPreferencesQueryKey } from '@/features/auth/auth-cache'
import { useAuth } from '@/features/auth/auth-context'
import type { NotificationPreferences } from '@/features/notifications/types'
import {
  DashboardPanel,
  DashboardPageShell,
} from '@/components/dashboard/dashboard-ui'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-shared'

export default function NotificationSettings() {
  const t = useTranslations('notifications')
  const { user, isAuthenticated, isReady } = useAuth()
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<NotificationPreferences | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: notificationPreferencesQueryKey(user?.id),
    queryFn: getNotificationPreferences,
    enabled: isAuthenticated && isReady && !!user?.id,
  })

  useEffect(() => {
    if (data) {
      setSettings(data)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (updated) => {
      setSettings(updated)
      queryClient.setQueryData(notificationPreferencesQueryKey(user?.id), updated)
    },
  })

  const toggleSetting = (key: keyof Omit<NotificationPreferences, 'userId' | 'language'>) => {
    if (!settings) return
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    saveMutation.mutate({ [key]: next[key] })
  }

  if (isLoading || !settings) {
    return (
      <DashboardPanel className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </DashboardPanel>
    )
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader title={t('settingsTitle')} />
      <DashboardPanel>

      <div className="space-y-4">
        <SettingItem
          title={t('eventReminders')}
          description={t('eventRemindersDesc')}
          checked={settings.eventReminders}
          onChange={() => toggleSetting('eventReminders')}
        />

        <SettingItem
          title={t('exclusiveOffers')}
          description={t('exclusiveOffersDesc')}
          checked={settings.exclusiveOffers}
          onChange={() => toggleSetting('exclusiveOffers')}
        />

        <SettingItem
          title={t('ticketAlerts')}
          description={t('ticketAlertsDesc')}
          checked={settings.ticketAlerts}
          onChange={() => toggleSetting('ticketAlerts')}
        />

        <SettingItem
          title={t('emailNotifications')}
          description={t('emailNotificationsDesc')}
          checked={settings.emailNotifications}
          onChange={() => toggleSetting('emailNotifications')}
        />

        <SettingItem
          title={t('pushNotifications')}
          description={t('pushNotificationsDesc')}
          checked={settings.pushNotifications}
          onChange={() => toggleSetting('pushNotifications')}
        />
      </div>
      </DashboardPanel>
    </DashboardPageShell>
  )
}

function SettingItem({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-[#151515] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0 sm:max-w-[80%]">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0 self-end sm:self-auto" />
    </div>
  )
}
