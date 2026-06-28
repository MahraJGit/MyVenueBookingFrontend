'use client'

import { ReactNode, useState } from 'react'
import VendorSidebar from '@/components/dashboard/vendor-sidebar'
import {
  dashboardContentClass,
  dashboardMainClass,
  dashboardOverlayClass,
  dashboardShellClass,
  DashboardMobileHeader,
} from '@/components/dashboard/dashboard-shared'

export default function VendorDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
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
        <DashboardMobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className={dashboardContentClass}>{children}</main>
      </div>
    </div>
  )
}
