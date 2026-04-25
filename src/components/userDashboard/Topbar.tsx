'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  AvatarImage,
} from '@/components/ui/avatar'

import { Bell } from 'lucide-react'

const Topbar = () => {
  return (
    <header className="flex items-center justify-between gap-4 p-4 bg-[#121212]  border-muted rounded-lg mb-6">
      
      {/* Left: Search */}
      <div className="w-full max-w-sm">
        <Input
          placeholder="Search..."
          className="bg-[#1a1a1a] border-muted text-sm"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        
        {/* Notification */}
        <button className="relative rounded-full p-2 bg-[#1a1a1a] hover:bg-[#222] transition">
          <Bell className="h-5 w-5 text-white" />
          {/* Badge (optional) */}
          {/* <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" /> */}
        </button>

        {/* Language Select (Desktop only) */}
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

        {/* Login Button (Desktop only) */}
        {/* <div className="hidden lg:block">
          <Button asChild size="sm">
            <Link href="/login">Login</Link>
          </Button>
        </div> */}

        {/* User Avatar */}
        <Avatar className="h-9 w-9">
          <AvatarImage src="https://github.com/shadcn.png" alt="User" />
          <AvatarFallback>MA</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

export default Topbar
