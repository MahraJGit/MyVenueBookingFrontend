'use client'

import { ReactNode, Suspense, useState } from 'react'
import { DashboardRoleGuard } from "@/components/auth/DashboardRoleGuard"
import Sidebar from '@/components/dashboard/sidebar'
import { VendorAdminRedirect } from '@/components/dashboard/VendorAdminRedirect'
import {
  dashboardContentClass,
  dashboardMainClass,
  dashboardOverlayClass,
  dashboardShellClass,
} from '@/components/dashboard/dashboard-shared'
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar'
import { ChatSocketProvider } from '@/components/chat/ChatSocketProvider'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Suspense fallback={null}>
      <VendorAdminRedirect>
        <DashboardRoleGuard allowedRoles={["ADMIN"]}>
        <ChatSocketProvider>
        <div className={dashboardShellClass}>
          {sidebarOpen ? (
            <div
              onClick={() => setSidebarOpen(false)}
              className={dashboardOverlayClass}
              aria-hidden
            />
          ) : null}

          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className={dashboardMainClass}>
            <main className={dashboardContentClass}>
              <DashboardTopbar
                onMenuClick={() => setSidebarOpen(true)}
                notificationsHref="/adminDashbaord/notifications"
                notificationsVariant="admin"
                notificationsAudience="ADMIN"
              />
              {children}
            </main>
          </div>
        </div>
        </ChatSocketProvider>
        </DashboardRoleGuard>
      </VendorAdminRedirect>
    </Suspense>
  )
}
