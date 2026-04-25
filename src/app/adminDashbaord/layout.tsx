'use client'

import { ReactNode, useState } from 'react'
import Sidebar from '@/components/dashboard/sidebar'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-black bg-[radial-gradient(circle_at_left_center,rgba(80,0,40,0.6)_0%,rgba(40,0,20,0.4)_30%,rgba(10,0,10,0.2)_50%,#000_80%)]">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Mobile Header */}
        <div className="lg:hidden p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="text-white" />
          </Button>
        </div>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
