'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  dashboardSidebarClass,
  DashboardLogoutButton,
} from '@/components/dashboard/dashboard-shared'
import { ChatUnreadBadge } from '@/components/chat/ChatUnreadBadge'
import { cn } from '@/lib/utils'

function isSidebarLinkActive(pathname: string, search: string, href: string) {
  const [hrefPath, hrefQuery = ''] = href.split('?')
  const pathMatches =
    pathname === hrefPath || pathname.startsWith(`${hrefPath}/`)
  if (!pathMatches) return false

  const hrefParams = new URLSearchParams(hrefQuery)
  const currentParams = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  )

  for (const [key, value] of hrefParams.entries()) {
    if (currentParams.get(key) !== value) return false
  }

  // Plain link (no tab) should not stay active when a tabbed sibling is open
  if (!hrefParams.has('tab') && currentParams.get('tab')) {
    return false
  }

  return true
}

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
      className={cn(
        dashboardSidebarClass,
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <div className="mb-2 flex justify-end lg:hidden">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={tCommon('close')}>
          <X />
        </Button>
      </div>

      <div className="mb-6 flex items-center justify-center gap-2 px-2">
        <Link href="/adminDashbaord/dashboard">
          <Image
            src="/svg/logo.svg"
            alt={tCommon('logoAlt')}
            width={170}
            height={70}
            className="h-auto w-[140px] sm:w-[170px]"
          />
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Accordion
          type="multiple"
          defaultValue={['sales', 'users', 'events', 'attractions', 'venues', 'marketplace', 'settings']}
          className="space-y-2"
        >
          <SidebarSection title={t('users')} value="users">
            <SidebarLink icon="/svg/AddUserMale.svg" label={t('manageUsers')} href="/adminDashbaord/users" onClose={onClose} />
            <SidebarLink icon="/svg/Collaborating.svg" label={t('vendorsDirectory')} href="/adminDashbaord/vendorRequests" onClose={onClose} />
            <SidebarLink icon="/svg/Collaborating.svg" label={t('vendorMessages')} href="/adminDashbaord/messages" onClose={onClose} showUnreadBadge unreadContext="admin" />
          </SidebarSection>

          <SidebarSection title={t('venues')} value="venues">
            <SidebarLink icon="/svg/EventAccepted.svg" label={t('venueReviews')} href="/adminDashbaord/venueReviews" onClose={onClose} />
            <SidebarLink icon="/svg/OpenedFolder.svg" label={t('venueTaxonomy')} href="/adminDashbaord/venueTaxonomy" onClose={onClose} />
          </SidebarSection>

          <SidebarSection title={t('events')} value="events">
            <SidebarLink icon="/svg/EventAccepted.svg" label={t('eventReviews')} href="/adminDashbaord/eventReviews" onClose={onClose} />
            <SidebarLink icon="/svg/OpenedFolder.svg" label={t('eventCategories')} href="/adminDashbaord/events" onClose={onClose} />
          </SidebarSection>

          <SidebarSection title={t('attractionsSection')} value="attractions">
            <SidebarLink icon="/svg/EventAccepted.svg" label={t('attractionReviews')} href="/adminDashbaord/attractionReviews" onClose={onClose} />
            <SidebarLink icon="/svg/OpenedFolder.svg" label={t('attractionCategories')} href="/adminDashbaord/attractionCategories" onClose={onClose} />
          </SidebarSection>

          <SidebarSection title={t('marketplaceSection')} value="marketplace">
            <SidebarLink icon="/svg/EventAccepted.svg" label={t('marketplaceReviews')} href="/adminDashbaord/marketplaceReviews" onClose={onClose} />
            <SidebarLink icon="/svg/OpenedFolder.svg" label={t('serviceCategories')} href="/adminDashbaord/serviceCategories" onClose={onClose} />
          </SidebarSection>

          <SidebarSection title={t('salesSection')} value="sales">
            <SidebarLink icon="/svg/tickets.svg" label={t('eventTicketSales')} href="/adminDashbaord/manageTickets" onClose={onClose} />
            <SidebarLink icon="/svg/NewTicket.svg" label={t('attractionTicketSales')} href="/adminDashbaord/manageAttractionTickets" onClose={onClose} />
            <SidebarLink icon="/svg/booking.svg" label={t('venueBookingsSales')} href="/adminDashbaord/venueBookings" onClose={onClose} />
            <SidebarLink icon="/svg/Calendar.svg" label={t('marketplaceBookingsSales')} href="/adminDashbaord/marketplaceBookings" onClose={onClose} />
          </SidebarSection>

          <SidebarSection title={t('settings')} value="settings">
            <SidebarLink icon="/svg/OpenedFolder.svg" label={t('locations')} href="/adminDashbaord/locations" onClose={onClose} />
          </SidebarSection>
        </Accordion>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <DashboardLogoutButton className="px-2" onAfterLogout={onClose} />
      </div>
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
    <AccordionItem value={value} className="border-b-0 border-t-2 border-white/10">
      <AccordionTrigger className="py-3 text-sm hover:text-primary hover:no-underline">
        {title}
      </AccordionTrigger>
      <AccordionContent className="space-y-1 pb-2">{children}</AccordionContent>
    </AccordionItem>
  )
}

function SidebarLink({
  icon,
  label,
  href,
  onClose,
  showUnreadBadge = false,
  unreadContext = "admin",
}: {
  icon: string
  label: string
  href: string
  onClose: () => void
  showUnreadBadge?: boolean
  unreadContext?: "buyer" | "vendor" | "admin"
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isActive = isSidebarLinkActive(
    pathname,
    searchParams.toString(),
    href,
  )

  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition',
        isActive
          ? 'bg-primary text-white'
          : 'text-gray-300 hover:bg-primary/20 hover:text-white',
      )}
    >
      <img src={icon} className="h-6 w-6 shrink-0" alt="" />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate">{label}</span>
        {showUnreadBadge ? <ChatUnreadBadge context={unreadContext} /> : null}
      </span>
    </Link>
  )
}
