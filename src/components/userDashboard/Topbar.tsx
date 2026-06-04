'use client'

import React from 'react'
import Image from 'next/image'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import NotificationBell from '@/components/notifications/NotificationBell'
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
          <Select defaultValue="Eng">
            <SelectTrigger className="w-[110px] text-sm bg-[#1a1a1a] border-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Eng">
                <div className="flex items-center gap-2">
                  <Image src="/svg/usa.svg" alt="USA" width={18} height={14} />
                  <span>Eng</span>
                </div>
              </SelectItem>

              <SelectItem value="Rus">
                <div className="flex items-center gap-2">
                  <Image src="/svg/rus.svg" alt="Russia" width={18} height={14} />
                  <span>Rus</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Avatar className="h-9 w-9">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

export default Topbar
