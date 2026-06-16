'use client'

import { ReactNode, useState } from 'react'
import VendorSidebar from '@/components/dashboard/vendor-sidebar'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VendorDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-black bg-[radial-gradient(circle_at_left_center,rgba(80,0,40,0.6)_0%,rgba(40,0,20,0.4)_30%,rgba(10,0,10,0.2)_50%,#000_80%)]">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      <VendorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <div className="lg:hidden p-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="text-white" />
          </Button>
        </div>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
