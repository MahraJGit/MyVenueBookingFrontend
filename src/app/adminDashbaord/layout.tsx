'use client'

import { ReactNode, Suspense, useState } from 'react'
import Sidebar from '@/components/dashboard/sidebar'
import { VendorAdminRedirect } from '@/components/dashboard/VendorAdminRedirect'
import {
  dashboardContentClass,
  dashboardMainClass,
  dashboardOverlayClass,
  dashboardShellClass,
  DashboardMobileHeader,
} from '@/components/dashboard/dashboard-shared'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Suspense fallback={null}>
      <VendorAdminRedirect>
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
            <DashboardMobileHeader onMenuClick={() => setSidebarOpen(true)} />
            <main className={dashboardContentClass}>{children}</main>
          </div>
        </div>
      </VendorAdminRedirect>
    </Suspense>
  )
}
