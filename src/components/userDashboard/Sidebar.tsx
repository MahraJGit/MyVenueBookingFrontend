'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Ticket,
  User,
  CreditCard,
  Bell,
  CalendarDays,
  CalendarCheck,
  Settings,
  Heart,
  X,
  MessageCircle,
  Briefcase,
  FileText,
  Zap,
  LayoutDashboard,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { dashboardSidebarClass, DashboardLogoutButton } from '@/components/dashboard/dashboard-shared'
import { ChatUnreadBadge } from '@/components/chat/ChatUnreadBadge'
import { useAuth } from '@/features/auth/auth-context'

type UserSidebarProps = {
  isOpen: boolean
  onClose: () => void
}

type NavLink = {
  labelKey:
    | 'personalInfo'
    | 'tickets'
    | 'venueBookings'
    | 'myServiceInquiries'
    | 'myServiceProposals'
    | 'navQuoteBookings'
    | 'navInstantBookings'
    | 'favourites'
    | 'payment'
    | 'notification'
    | 'messages'
    | 'settings'
  href: string
  icon: typeof User
}

const topLinks: NavLink[] = [
  { labelKey: 'personalInfo', href: '/userDashboard/profile', icon: User },
  { labelKey: 'tickets', href: '/userDashboard/tickets', icon: Ticket },
  { labelKey: 'venueBookings', href: '/userDashboard/bookings', icon: CalendarDays },
]

const quoteLinks: NavLink[] = [
  { labelKey: 'myServiceInquiries', href: '/userDashboard/service-inquiries', icon: Briefcase },
  { labelKey: 'myServiceProposals', href: '/userDashboard/service-proposals', icon: FileText },
  { labelKey: 'navQuoteBookings', href: '/userDashboard/service-bookings', icon: CalendarCheck },
]

const instantLinks: NavLink[] = [
  { labelKey: 'navInstantBookings', href: '/userDashboard/instant-bookings', icon: Zap },
]

const afterMarketplaceLinks: NavLink[] = [
  { labelKey: 'favourites', href: '/userDashboard/favourites', icon: Heart },
  { labelKey: 'payment', href: '/userDashboard/payment', icon: CreditCard },
]

const accountLinks: NavLink[] = [
  { labelKey: 'notification', href: '/userDashboard/notifications', icon: Bell },
  { labelKey: 'messages', href: '/userDashboard/messages', icon: MessageCircle },
  { labelKey: 'settings', href: '/userDashboard/settings', icon: Settings },
]

function isLinkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavItem({
  item,
  pathname,
  onClose,
}: {
  item: NavLink
  pathname: string
  onClose: () => void
}) {
  const t = useTranslations('userDashboard')
  const isActive = isLinkActive(pathname, item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'relative flex items-center gap-3 px-4 py-2 text-sm transition',
        isActive ? 'text-primary' : 'text-gray-300 hover:text-white',
      )}
    >
      {isActive ? (
        <span className="absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
      ) : null}

      <Icon size={18} className={isActive ? 'text-primary' : 'text-gray-400'} />

      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate">{t(item.labelKey)}</span>
        {item.labelKey === 'messages' ? <ChatUnreadBadge context="buyer" /> : null}
      </span>
    </Link>
  )
}

export default function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('userDashboard')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const { isAdmin, isVendor } = useAuth()
  const quoteActive = quoteLinks.some((item) => isLinkActive(pathname, item.href))
  const instantActive = instantLinks.some((item) => isLinkActive(pathname, item.href))
  const accountActive = accountLinks.some((item) => isLinkActive(pathname, item.href))

  return (
    <aside
      className={cn(
        dashboardSidebarClass,
        'transform transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <div className="mb-2 flex justify-end lg:hidden">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={tCommon('close')}>
          <X />
        </Button>
      </div>

      <div className="mb-8 flex items-center gap-2 px-2 lg:mb-10">
        <Link href="/">
        <Image
          src="/svg/logo.svg"
          alt={tCommon('appName')}
          width={170}
          height={70}
          className="h-auto w-[140px] sm:w-[170px]"
        />
          </Link>
      </div>

      <nav className="flex flex-col space-y-1 overflow-y-auto">
        {topLinks.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
        ))}

        <Accordion
          type="multiple"
          defaultValue={['quoteMarketplace', 'instantMarketplace', 'account']}
          className="pt-1"
        >
          <AccordionItem value="quoteMarketplace" className="border-b-0 border-t border-white/10">
            <AccordionTrigger
              className={cn(
                'px-4 py-2 text-left text-sm hover:no-underline',
                quoteActive ? 'text-primary' : 'text-gray-300 hover:text-white',
              )}
            >
              {t('quoteMarketplaceSection')}
            </AccordionTrigger>
            <AccordionContent className="space-y-1 pb-2">
              {quoteLinks.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="instantMarketplace" className="border-b-0 border-t border-white/10">
            <AccordionTrigger
              className={cn(
                'px-4 py-2 text-left text-sm hover:no-underline',
                instantActive ? 'text-primary' : 'text-gray-300 hover:text-white',
              )}
            >
              {t('instantMarketplaceSection')}
            </AccordionTrigger>
            <AccordionContent className="space-y-1 pb-2">
              {instantLinks.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="account" className="border-b-0 border-t border-white/10">
            <AccordionTrigger
              className={cn(
                'px-4 py-2 text-left text-sm hover:no-underline',
                accountActive ? 'text-primary' : 'text-gray-300 hover:text-white',
              )}
            >
              {t('account')}
            </AccordionTrigger>
            <AccordionContent className="space-y-1 pb-2">
              {accountLinks.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {afterMarketplaceLinks.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
        ))}
      </nav>

      <hr className="my-6 border-white/10" />

      <div className="mt-auto space-y-1">
        {isAdmin ? (
          <>
            <Link
              href="/adminDashbaord/dashboard"
              onClick={onClose}
              className="relative flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition hover:text-white"
            >
              <LayoutDashboard size={18} className="text-gray-400" />
              {tNav('adminDashboard')}
            </Link>
            <Link
              href="/vendorDashboard"
              onClick={onClose}
              className="relative flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition hover:text-white"
            >
              <Store size={18} className="text-gray-400" />
              {tNav('vendorDashboard')}
            </Link>
          </>
        ) : isVendor ? (
          <Link
            href="/vendorDashboard"
            onClick={onClose}
            className="relative flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition hover:text-white"
          >
            <Store size={18} className="text-gray-400" />
            {tNav('vendorDashboard')}
          </Link>
        ) : null}

        <DashboardLogoutButton onAfterLogout={onClose} />
      </div>
    </aside>
  )
}
