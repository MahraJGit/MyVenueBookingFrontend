'use client'

import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/features/notifications/api'
import type { NotificationPreferences } from '@/features/notifications/types'

export default function NotificationSettings() {
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
      <div className="mt-5 flex justify-center rounded-xl bg-[#121212] p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-xl bg-[#121212] p-8 ">
      <h2 className="text-lg font-semibold mb-6">settings</h2>

      <div className="space-y-4">
        <SettingItem
          title="Event Reminders"
          description="Get notified before your event starts, so you never miss it!"
          checked={settings.eventReminders}
          onChange={() => toggleSetting('eventReminders')}
        />

        <SettingItem
          title="Exclusive Offers & Discounts"
          description="Receive special offers and discounts only available for you."
          checked={settings.exclusiveOffers}
          onChange={() => toggleSetting('exclusiveOffers')}
        />

        <SettingItem
          title="Ticket Availability Alerts"
          description="Get notified when tickets for your desired event are available for purchase."
          checked={settings.ticketAlerts}
          onChange={() => toggleSetting('ticketAlerts')}
        />

        <SettingItem
          title="Email notifications"
          description="Stay updated with event news and updates directly to your email."
          checked={settings.emailNotifications}
          onChange={() => toggleSetting('emailNotifications')}
        />

        <SettingItem
          title="Push notifications"
          description="Receive instant updates and alerts on your phone for upcoming events and offers."
          checked={settings.pushNotifications}
          onChange={() => toggleSetting('pushNotifications')}
        />
      </div>

      <div className="mt-8">
        <label className="block text-sm font-medium mb-2">
          Select your preferred language
        </label>

        <Select
          value={settings.language}
          onValueChange={(value) => {
            const next = { ...settings, language: value }
            setSettings(next)
            saveMutation.mutate({ language: value })
          }}
        >
          <SelectTrigger className="w-60 bg-[#151515] border-[#242424]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="en">🇬🇧 English</SelectItem>
            <SelectItem value="fr">🇫🇷 French</SelectItem>
            <SelectItem value="es">🇪🇸 Spanish</SelectItem>
            <SelectItem value="de">🇩🇪 German</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
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
    <div className="flex items-center justify-between rounded-lg bg-[#151515] px-5 py-4">
      <div className="max-w-[80%]">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
