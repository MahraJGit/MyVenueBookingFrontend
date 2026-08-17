'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  X,
  Bell,
  Building2,
  CalendarDays,
  Ticket,
  Calendar,
  Clapperboard,
  LayoutDashboard,
  TrendingUp,
  MessageCircle,
  ShieldCheck,
  Store,
  Inbox,
  FileText,
  CalendarCheck,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { getDashboardPaths } from '@/features/dashboard/paths'
import {
  dashboardSidebarClass,
  DashboardLogoutButton,
} from '@/components/dashboard/dashboard-shared'
import { ChatUnreadBadge } from '@/components/chat/ChatUnreadBadge'
import { cn } from '@/lib/utils'

const paths = getDashboardPaths('vendor')

export default function VendorSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const t = useTranslations('vendorDashboard')
  const tNav = useTranslations('nav')
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
        <Link href="/">
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
        <Accordion type="multiple" defaultValue={['overview', 'events', 'attractions', 'venues', 'marketplace', 'account']} className="space-y-2">
          <SidebarSection title={t('overview')} value="overview">
            <SidebarLink icon={LayoutDashboard} label={t('dashboard')} href={paths.root} onClose={onClose} />
            <SidebarLink icon={TrendingUp} label={t('analytics')} href={paths.analytics} onClose={onClose} />
          </SidebarSection>

          <SidebarSection title={t('eventsSection')} value="events">
            <SidebarLink icon={Clapperboard} label={t('myEvents')} href={paths.events} onClose={onClose} />
            <SidebarLink icon={Ticket} label={t('ticketSales')} href={paths.tickets} onClose={onClose} />
          </SidebarSection>

          <SidebarSection title={t('attractionsSection')} value="attractions">
            <SidebarLink icon={Clapperboard} label={t('myAttractions')} href={paths.attractions} onClose={onClose} />
            <SidebarLink icon={Ticket} label={t('attractionTickets')} href={paths.attractionTickets} onClose={onClose} />
          </SidebarSection>

          <SidebarSection title={t('venuesSection')} value="venues">
            <SidebarLink icon={Building2} label={t('myVenues')} href={paths.venues} onClose={onClose} />
            <SidebarLink icon={CalendarDays} label={t('venueBookings')} href={paths.venueBookings} onClose={onClose} />
          </SidebarSection>

          <SidebarSection title={t('marketplaceSection')} value="marketplace">
            <SidebarLink
              icon={Store}
              label={t('myServices')}
              href={paths.marketplace}
              onClose={onClose}
              exact
            />
            <SidebarLink icon={Inbox} label={t('serviceInquiries')} href={paths.marketplaceInquiries} onClose={onClose} />
            <SidebarLink icon={FileText} label={t('serviceProposals')} href={paths.marketplaceProposals} onClose={onClose} />
            <SidebarLink icon={CalendarCheck} label={t('serviceBookings')} href={paths.marketplaceBookings} onClose={onClose} />
          </SidebarSection>

          <SidebarSection title={t('account')} value="account">
            <SidebarLink icon={User} label={t('profile')} href={`${paths.root}/profile`} onClose={onClose} />
            <SidebarLink icon={ShieldCheck} label={t('verifiers')} href={paths.verifiers} onClose={onClose} />
            <SidebarLink icon={MessageCircle} label={t('messages')} href={`${paths.root}/messages`} onClose={onClose} showUnreadBadge unreadContext="vendor" />
            <SidebarLink icon={Bell} label={t('notifications')} href={`${paths.root}/notifications`} onClose={onClose} />
            <SidebarLink icon={Calendar} label={tNav('customerDashboard')} href="/userDashboard/tickets" onClose={onClose} />
          </SidebarSection>
        </Accordion>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <DashboardLogoutButton
          className="px-2"
          onAfterLogout={onClose}
        />
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
  icon: Icon,
  label,
  href,
  onClose,
  showUnreadBadge = false,
  unreadContext = "vendor",
  exact = false,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>
  label: string
  href: string
  onClose: () => void
  showUnreadBadge?: boolean
  unreadContext?: "buyer" | "vendor" | "admin"
  exact?: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [hrefPath, hrefQuery = ''] = href.split('?')
  const hrefParams = new URLSearchParams(hrefQuery)
  const pathMatches = exact
    ? pathname === hrefPath
    : pathname === hrefPath ||
      (hrefPath !== paths.root && pathname.startsWith(`${hrefPath}/`))

  let isActive = pathMatches
  if (isActive && hrefParams.size > 0) {
    for (const [key, value] of hrefParams.entries()) {
      if (searchParams.get(key) !== value) {
        isActive = false
        break
      }
    }
  }

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
      <Icon size={20} className="shrink-0" />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate">{label}</span>
        {showUnreadBadge ? <ChatUnreadBadge context={unreadContext} /> : null}
      </span>
    </Link>
  )
}
