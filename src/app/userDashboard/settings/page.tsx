'use client'

import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CountryFlag } from '@/components/i18n/CountryFlag'
import { LOCALE_OPTIONS } from '@/i18n/locales'
import {
  DashboardContentPanel,
  dashboardListItemClass,
} from '@/components/dashboard/dashboard-shared'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/features/notifications/api'
import type { NotificationPreferences } from '@/features/notifications/types'

export default function NotificationSettings() {
  const t = useTranslations('notifications')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<NotificationPreferences | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
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
      queryClient.setQueryData(['notification-preferences'], updated)
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
      <DashboardContentPanel>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardContentPanel>
    )
  }

  return (
    <DashboardContentPanel>
      <h2 className="text-lg font-semibold mb-6">{t('settingsTitle')}</h2>

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

      <div className="mt-8">
        <label className="block text-sm font-medium mb-2">
          {t('preferredLanguage')}
        </label>

        <Select
          value={settings.language}
          onValueChange={(value) => {
            const next = { ...settings, language: value }
            setSettings(next)
            saveMutation.mutate({ language: value })
          }}
        >
          <SelectTrigger className={`w-full border-[#242424] bg-[#151515] sm:w-60`}>
            <SelectValue placeholder={tCommon('selectLanguage')} />
          </SelectTrigger>

          <SelectContent>
            {LOCALE_OPTIONS.map((option) => (
              <SelectItem key={option.code} value={option.code}>
                <div className="flex items-center gap-2">
                  <CountryFlag code={option.countryCode} className="h-3.5 w-5" />
                  <span>{option.nativeLabel}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </DashboardContentPanel>
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
    <div className={`flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${dashboardListItemClass}`}>
      <div className="min-w-0 sm:max-w-[80%]">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0 self-end sm:self-auto" />
    </div>
  )
}
