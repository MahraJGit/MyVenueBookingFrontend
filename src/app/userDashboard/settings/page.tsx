'use client'

import React, { useState } from 'react'

import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    eventReminders: false,
    exclusiveOffers: true,
    ticketAlerts: false,
    emailNotifications: true,
    pushNotifications: false,
    language: 'en',
  })

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <>
      <div className="mt-5 rounded-xl bg-[#121212] p-8 ">
        {/* ---------- HEADER ---------- */}
        <h2 className="text-lg font-semibold mb-6">settings</h2>

        {/* ---------- SETTINGS LIST ---------- */}
        <div className="space-y-4">
          {/* Event Reminders */}
          <SettingItem
            title="Event Reminders"
            description="Get notified before your event starts, so you never miss it!"
            checked={settings.eventReminders}
            onChange={() => toggleSetting('eventReminders')}
          />

          {/* Exclusive Offers */}
          <SettingItem
            title="Exclusive Offers & Discounts"
            description="Receive special offers and discounts only available for you."
            checked={settings.exclusiveOffers}
            onChange={() => toggleSetting('exclusiveOffers')}
          />

          {/* Ticket Availability */}
          <SettingItem
            title="Ticket Availability Alerts"
            description="Get notified when tickets for your desired event are available for purchase."
            checked={settings.ticketAlerts}
            onChange={() => toggleSetting('ticketAlerts')}
          />

          {/* Email Notifications */}
          <SettingItem
            title="Email notifications"
            description="Stay updated with event news and updates directly to your email."
            checked={settings.emailNotifications}
            onChange={() => toggleSetting('emailNotifications')}
          />

          {/* Push Notifications */}
          <SettingItem
            title="Push notifications"
            description="Receive instant updates and alerts on your phone for upcoming events and offers."
            checked={settings.pushNotifications}
            onChange={() => toggleSetting('pushNotifications')}
          />
        </div>

        {/* ---------- LANGUAGE ---------- */}
        <div className="mt-8">
          <label className="block text-sm font-medium mb-2">
            Select your preferred language
          </label>

          <Select
            value={settings.language}
            onValueChange={value =>
              setSettings(prev => ({ ...prev, language: value }))
            }
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
    </>
  )
}

/* -------------------- REUSABLE ITEM -------------------- */
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
