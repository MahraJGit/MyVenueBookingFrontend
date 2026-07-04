'use client'

import { ReactNode, useState } from 'react'
import { DashboardRoleGuard } from "@/components/auth/DashboardRoleGuard"
import VendorSidebar from '@/components/dashboard/vendor-sidebar'
import {
  dashboardContentClass,
  dashboardMainClass,
  dashboardOverlayClass,
  dashboardShellClass,
} from '@/components/dashboard/dashboard-shared'
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar'
import { ChatSocketProvider } from '@/components/chat/ChatSocketProvider'

export default function VendorDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <DashboardRoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
    <ChatSocketProvider>
    <div className={dashboardShellClass}>
      {sidebarOpen ? (
        <div
          onClick={() => setSidebarOpen(false)}
          className={dashboardOverlayClass}
          aria-hidden
        />
      ) : null}

      <VendorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={dashboardMainClass}>
        <main className={dashboardContentClass}>
          <DashboardTopbar onMenuClick={() => setSidebarOpen(true)} />
          {children}
        </main>
      </div>
    </div>
    </ChatSocketProvider>
    </DashboardRoleGuard>
  )
}
