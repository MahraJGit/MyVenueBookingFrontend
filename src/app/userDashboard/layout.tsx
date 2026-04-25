'use client'

import { ReactNode } from 'react'
import Sidebar from '@/components/userDashboard/Sidebar'
import Topbar from '@/components/userDashboard/Topbar'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <div className="flex min-h-screen bg-black bg-[radial-gradient(circle_at_left_center,rgba(80,0,40,0.6)_0%,rgba(40,0,20,0.4)_30%,rgba(10,0,10,0.2)_50%,#000_80%)]">

        {/* Sidebar */}
        <div className="p-4">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Topbar />
          {children}
        </main>
      </div>
    </>
  )
}
