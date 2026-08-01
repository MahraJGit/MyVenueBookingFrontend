'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import NotificationsList from '@/components/notifications/NotificationsList'

export default function VendorNotificationsPage() {
  return (
    <RoleGuard allowedRoles={['VENDOR', 'ADMIN']}>
      <NotificationsList audience="VENDOR" />
    </RoleGuard>
  )
}
