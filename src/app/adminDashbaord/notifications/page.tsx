'use client'

import NotificationsList from '@/components/notifications/NotificationsList'

export default function AdminNotifications() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-2">Notifications</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Platform alerts for vendor applications, event reviews, and sales.
      </p>
      <NotificationsList className="rounded-xl bg-[#121212] p-8" />
    </div>
  )
}
