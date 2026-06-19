'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  X,
  Plus,
  Building2,
  CalendarDays,
  Ticket,
  Calendar,
  Clapperboard,
  LayoutDashboard,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { getDashboardPaths } from '@/features/dashboard/paths'

const paths = getDashboardPaths('vendor')

export default function VendorSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <aside
      className={`
        fixed lg:static top-0 left-0 z-50
        h-full w-[280px]
        bg-[#1B1B1BCC] text-white
        flex flex-col p-4 m-4 rounded-2xl
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      <div className="flex justify-end lg:hidden mb-2">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6 px-2">
        <Image src="/svg/logo.svg" alt="logo" width={170} height={70} />
      </div>

      <div className="mb-6 grid gap-2">
        <Link href={paths.addEvent} onClick={onClose}>
          <Button className="bg-primary hover:bg-primary/80 text-white flex gap-2 w-full">
            <Plus size={18} />
            Create Event
          </Button>
        </Link>
        <Link href={paths.addVenue} onClick={onClose}>
          <Button variant="outline" className="border-[#303030] text-white hover:bg-primary/20 flex gap-2 w-full">
            <Plus size={18} />
            Add Venue
          </Button>
        </Link>
      </div>

      <Accordion type="multiple" defaultValue={['overview', 'events', 'venues', 'account']} className="space-y-2">
        <SidebarSection title="Overview" value="overview">
          <SidebarLink icon={LayoutDashboard} label="Dashboard" href={paths.root} onClose={onClose} />
          <SidebarLink icon={TrendingUp} label="Analytics" href={paths.analytics} onClose={onClose} />
        </SidebarSection>

        <SidebarSection title="Events" value="events">
          <SidebarLink icon={Clapperboard} label="My Events" href={paths.events} onClose={onClose} />
          <SidebarLink icon={Ticket} label="Ticket Sales" href={paths.tickets} onClose={onClose} />
        </SidebarSection>

        <SidebarSection title="Venues" value="venues">
          <SidebarLink icon={Building2} label="My Venues" href={paths.venues} onClose={onClose} />
          <SidebarLink icon={CalendarDays} label="Venue Bookings" href={paths.venueBookings} onClose={onClose} />
        </SidebarSection>

        <SidebarSection title="Account" value="account">
          <SidebarLink icon={Calendar} label="Customer Dashboard" href="/userDashboard/tickets" onClose={onClose} />
        </SidebarSection>
      </Accordion>
    </aside>
  )
}

function SidebarSection({
  title,
  value,
  children,
}: {
  title: string
  value: string
  children: React.ReactNode
}) {
  return (
    <AccordionItem value={value} className="border-b-0 border-t-2">
      <AccordionTrigger className="hover:text-pink-600 hover:no-underline">
        {title}
      </AccordionTrigger>
      <AccordionContent className="space-y-2">{children}</AccordionContent>
    </AccordionItem>
  )
}

function SidebarLink({
  icon: Icon,
  label,
  href,
  onClose,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>
  label: string
  href: string
  onClose: () => void
}) {
  const pathname = usePathname()
  const isActive =
    pathname === href ||
    (href !== paths.root && pathname.startsWith(`${href}/`))

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`
        flex items-center gap-3 px-2 py-2 rounded-md text-sm transition
        ${isActive ? 'bg-primary text-white' : 'text-gray-300 hover:bg-primary/20 hover:text-white'}
      `}
    >
      <Icon size={20} />
      {label}
    </Link>
  )
}
