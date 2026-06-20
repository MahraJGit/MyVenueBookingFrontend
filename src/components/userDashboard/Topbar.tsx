'use client'

import React from 'react'

import { Input } from '@/components/ui/input'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import NotificationBell from '@/components/notifications/NotificationBell'
import { CurrencySelect } from '@/components/currency/CurrencySelect'
import { useAuth } from '@/features/auth/auth-context'

const Topbar = () => {
  const { initials } = useAuth()

  return (
    <header className="flex items-center justify-between gap-4 p-4 bg-[#121212]  border-muted rounded-lg mb-6">
      
      <div className="w-full max-w-sm">
        <Input
          placeholder="Search..."
          className="bg-[#1a1a1a] border-muted text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell href="/userDashboard/notifications" variant="user" />

        <div className="hidden lg:block">
          <CurrencySelect triggerClassName="bg-[#1a1a1a]" />
        </div>

        <Avatar className="h-9 w-9">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

export default Topbar
