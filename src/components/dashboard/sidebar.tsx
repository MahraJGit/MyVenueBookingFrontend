'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function Sidebar({
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
      {/* Mobile Close Button */}
      <div className="flex justify-end lg:hidden mb-2">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X />
        </Button>
      </div>

      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-6 px-2">
        <Image src="/svg/logo.svg" alt="logo" width={170} height={70} />
      </div>

      {/* Add Event */}
      <Link href="/adminDashbaord/addEvents" className="mb-6" onClick={onClose}>
        <Button className="bg-primary hover:bg-primary/80 text-white flex gap-2 w-full">
          <Plus size={18} />
          Add Quick Event
        </Button>
      </Link>

      {/*
      <Accordion type="multiple" defaultValue={['main']} className="space-y-2">
        <SidebarSection title="Main Navigation" value="main">
          <SidebarLink icon="/svg/dashboard.svg" label="Dashboard" href="/adminDashbaord/dashboard" onClose={onClose} />
          <SidebarLink icon="/svg/EventAccepted.svg" label="Manage Events" href="/adminDashbaord/manageEvents" onClose={onClose} />
          <SidebarLink icon="/svg/NewTicket.svg" label="Booking & Tickets" href="/adminDashbaord/manageTickets" onClose={onClose} />
          <SidebarLink icon="/svg/Collaborating.svg" label="Attendee Insights" href="/adminDashbaord/attendeeInsights" onClose={onClose} />
          <SidebarLink icon="/svg/Statistics.svg" label="Analytics & Reports" href="/adminDashbaord/analytics" onClose={onClose} />
        </SidebarSection>

        <SidebarSection title="Support And Settings" value="support">
          <SidebarLink icon="/svg/CustomerSupport.svg" label="Contact Support" href="/adminDashbaord/support" onClose={onClose} />
          <SidebarLink icon="/svg/notification.svg" label="Notifications" href="/adminDashbaord/notifications" onClose={onClose} />
          <SidebarLink icon="/svg/Settings.svg" label="Settings" href="/adminDashbaord/settings" onClose={onClose} />
        </SidebarSection>

        <SidebarSection title="Additional Items" value="additional">
          <SidebarLink icon="/svg/Speaker.svg" label="Marketing" href="/adminDashbaord/marketing" onClose={onClose} />
          <SidebarLink icon="/svg/OpenedFolder.svg" label="Event Categories" href="/adminDashbaord/events" onClose={onClose} />
        </SidebarSection>

        <SidebarSection title="Account Management" value="account">
          <SidebarLink icon="/svg/AddUserMale.svg" label="Manage Users" href="/adminDashbaord/users" onClose={onClose} />
          <SidebarLink icon="/svg/logout.svg" label="Logout" href="#" onClose={onClose} />
        </SidebarSection>
      </Accordion>
      */}

      <Accordion type="multiple" defaultValue={['users', 'events']} className="space-y-2">
        <SidebarSection title="Users" value="users">
          <SidebarLink icon="/svg/AddUserMale.svg" label="Manage Users" href="/adminDashbaord/users" onClose={onClose} />
          <SidebarLink icon="/svg/Collaborating.svg" label="Vendor Requests" href="/adminDashbaord/vendorRequests" onClose={onClose} />
        </SidebarSection>

        <SidebarSection title="Events" value="events">
          <SidebarLink icon="/svg/EventAccepted.svg" label="Manage Events" href="/adminDashbaord/manageEvents" onClose={onClose} />
          <SidebarLink icon="/svg/NewTicket.svg" label="Booking & Tickets" href="/adminDashbaord/manageTickets" onClose={onClose} />
          <SidebarLink icon="/svg/OpenedFolder.svg" label="Event Categories" href="/adminDashbaord/events" onClose={onClose} />
          <SidebarLink icon="/svg/Statistics.svg" label="Analytics & Reports" href="/adminDashbaord/analytics" onClose={onClose} />
        </SidebarSection>
      </Accordion>
    </aside>
  )
}

/* ------------------ Helpers ------------------ */

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
      <AccordionContent className="space-y-2">
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}

function SidebarLink({
  icon,
  label,
  href,
  onClose,
}: {
  icon: string
  label: string
  href: string
  onClose: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`
        flex items-center gap-3 px-2 py-2 rounded-md text-sm
        transition
        ${isActive
          ? 'bg-primary text-white'
          : 'text-gray-300 hover:bg-primary/20 hover:text-white'}
      `}
    >
      <img src={icon} className="w-6 h-6" />
      {label}
    </Link>
  )
}
