'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('adminDashboard')
  const tCommon = useTranslations('common')

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
        <Image src="/svg/logo.svg" alt={tCommon('logoAlt')} width={170} height={70} />
      </div>

      <Link href="/adminDashbaord/addEvents" className="mb-6" onClick={onClose}>
        <Button className="bg-primary hover:bg-primary/80 text-white flex gap-2 w-full">
          <Plus size={18} />
          {t('addQuickEvent')}
        </Button>
      </Link>

      <Accordion type="multiple" defaultValue={['users', 'events', 'venues']} className="space-y-2">
        <SidebarSection title={t('users')} value="users">
          <SidebarLink icon="/svg/AddUserMale.svg" label={t('manageUsers')} href="/adminDashbaord/users" onClose={onClose} />
          <SidebarLink icon="/svg/Collaborating.svg" label={t('vendorRequests')} href="/adminDashbaord/vendorRequests" onClose={onClose} />
        </SidebarSection>

        <SidebarSection title={t('venues')} value="venues">
          <SidebarLink icon="/svg/EventAccepted.svg" label={t('venueReviews')} href="/adminDashbaord/venueReviews" onClose={onClose} />
          <SidebarLink icon="/svg/EventAccepted.svg" label={t('manageVenues')} href="/adminDashbaord/manageVenues" onClose={onClose} />
          <SidebarLink icon="/svg/NewTicket.svg" label={t('venueBookings')} href="/adminDashbaord/venueBookings" onClose={onClose} />
          <SidebarLink icon="/svg/OpenedFolder.svg" label={t('venueTaxonomy')} href="/adminDashbaord/venueTaxonomy" onClose={onClose} />
        </SidebarSection>

        <SidebarSection title={t('events')} value="events">
          <SidebarLink icon="/svg/EventAccepted.svg" label={t('eventReviews')} href="/adminDashbaord/eventReviews" onClose={onClose} />
          <SidebarLink icon="/svg/EventAccepted.svg" label={t('myEvents')} href="/adminDashbaord/manageEvents" onClose={onClose} />
          <SidebarLink icon="/svg/NewTicket.svg" label={t('bookingTickets')} href="/adminDashbaord/manageTickets" onClose={onClose} />
          <SidebarLink icon="/svg/OpenedFolder.svg" label={t('eventCategories')} href="/adminDashbaord/events" onClose={onClose} />
          <SidebarLink icon="/svg/Statistics.svg" label={t('analyticsReports')} href="/adminDashbaord/analytics" onClose={onClose} />
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
      <img src={icon} className="w-6 h-6" alt="" />
      {label}
    </Link>
  )
}
