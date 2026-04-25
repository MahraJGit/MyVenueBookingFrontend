"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function CalendarPicker({
  selectedDate,
  onDateChange,
}: {
  selectedDate: Date | undefined
  onDateChange: (date: Date | undefined) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="md:w-[220px] w-full justify-between font-normal bg-transparent border border-[#303030] text-gray-400"
        >
          {selectedDate ? selectedDate.toLocaleDateString() : "Select date"}
          <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0 bg-[#1B1B1B] border-[#303030]" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          captionLayout="dropdown"
          onSelect={(date) => {
            onDateChange(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
