'use client'

import { ReactNode, useState } from 'react'
import Sidebar from '@/components/userDashboard/Sidebar'
import Topbar from '@/components/userDashboard/Topbar'
import {
  dashboardContentClass,
  dashboardMainClass,
  dashboardOverlayClass,
  dashboardShellClass,
} from '@/components/dashboard/dashboard-shared'
import { ChatSocketProvider } from '@/components/chat/ChatSocketProvider'
import { DashboardRoleGuard } from '@/components/auth/DashboardRoleGuard'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <DashboardRoleGuard allowedRoles={["BUYER", "VENDOR", "ADMIN"]}>
    <ChatSocketProvider>
    <div className={dashboardShellClass}>
      {sidebarOpen ? (
        <div
          onClick={() => setSidebarOpen(false)}
          className={dashboardOverlayClass}
          aria-hidden
        />
      ) : null}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={dashboardMainClass}>
        <main className={dashboardContentClass}>
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          {children}
        </main>
      </div>
    </div>
    </ChatSocketProvider>
    </DashboardRoleGuard>
  )
}
