'use client'

import { ReactNode, useState } from 'react'
import Sidebar from '@/components/userDashboard/Sidebar'
import Topbar from '@/components/userDashboard/Topbar'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-black bg-[radial-gradient(circle_at_left_center,rgba(80,0,40,0.6)_0%,rgba(40,0,20,0.4)_30%,rgba(10,0,10,0.2)_50%,#000_80%)]">
      {sidebarOpen ? (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-hidden
        />
      ) : null}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          {children}
        </main>
      </div>
    </div>
  )
}
