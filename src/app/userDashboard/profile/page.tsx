"use client"
import * as React from "react"
import { Button } from '@/components/ui/button'
import { PencilLine } from 'lucide-react'
import Image from 'next/image'
import { CalendarIcon, Globe, Mail, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const profile = () => {
  const [date, setDate] = React.useState<Date>()
  return (
    <>
      <div className="flex items-center justify-between mb-8 bg-[#121212] p-6 rounded-lg">
        <div className="flex gap-3 items-center">
          <Image
            src="/images/card-img.png"
            alt="User Avatar"
            width={50}
            height={50}
            className="rounded-full w-20 h-20"
          />
          <div>
            <h4>Hey Negar!</h4>
            <p className="text-[#B3B3B3]">Negarkhosravii@yahoo.com</p>
          </div>
        </div>
        <Button><PencilLine size={24} /> Edit </Button>
      </div>

      <div className="rounded-xl bg-[#121212] p-8">
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label>First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" defaultValue="Negar" />
            </div>
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label>Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" defaultValue="Khosravi" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="email@example.com" />
            </div>
          </div>

          {/* State */}
          <div className="space-y-2">
            <Label>State</Label>
            <Select>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-1">
                  <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select state" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ca">California</SelectItem>
                <SelectItem value="ny">New York</SelectItem>
                <SelectItem value="tx">Texas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label>City</Label>
            <Input placeholder="City" />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? date.toDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label>Phone</Label>
            <div className="flex gap-2">
              <Select defaultValue="+1">
                <SelectTrigger className="w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+1">
                    <div className="flex items-center gap-2">
                      <Image src="/svg/usa.svg" alt="USA" width={20} height={14} />
                      <span>Eng</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="+44">🇬🇧 +44</SelectItem>
                  <SelectItem value="+98">🇮🇷 +98</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="5588 554 88" />
            </div>
          </div>

          {/* Zip Code */}
          <div className="space-y-2">
            <Label>Zip code</Label>
            <Input placeholder="#" />
          </div>

          {/* Actions */}
          <div className="col-span-full flex justify-end gap-4 pt-4">
            <Button variant="outline">Discard</Button>
            <Button className="bg-pink-500 hover:bg-pink-600">
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

export default profile