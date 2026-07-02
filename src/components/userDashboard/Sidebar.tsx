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
  Settings,
  Heart,
  X,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { dashboardSidebarClass, DashboardLogoutButton } from '@/components/dashboard/dashboard-shared'

type UserSidebarProps = {
  isOpen: boolean
  onClose: () => void
}

export default function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('userDashboard')
  const tCommon = useTranslations('common')

  const links = [
    {
      labelKey: 'personalInfo' as const,
      href: '/userDashboard/profile',
      icon: User,
    },
    {
      labelKey: 'tickets' as const,
      href: '/userDashboard/tickets',
      icon: Ticket,
    },
    {
      labelKey: 'venueBookings' as const,
      href: '/userDashboard/bookings',
      icon: CalendarDays,
    },
    {
      labelKey: 'favourites' as const,
      href: '/userDashboard/favourites',
      icon: Heart,
    },
    {
      labelKey: 'payment' as const,
      href: '/userDashboard/payment',
      icon: CreditCard,
    },
    {
      labelKey: 'notification' as const,
      href: '/userDashboard/notifications',
      icon: Bell,
    },
    {
      labelKey: 'messages' as const,
      href: '/userDashboard/messages',
      icon: MessageCircle,
    },
  ]

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
        {links.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
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

              <Icon
                size={18}
                className={isActive ? 'text-primary' : 'text-gray-400'}
              />

              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>

      <hr className="my-6 border-white/10" />

      <div className="mt-auto space-y-1">
        <Link
          href="/userDashboard/settings"
          onClick={onClose}
          className={cn(
            'relative flex items-center gap-3 px-4 py-2 text-sm transition',
            pathname.startsWith('/userDashboard/settings')
              ? 'text-primary'
              : 'text-gray-300 hover:text-white',
          )}
        >
          {pathname.startsWith('/userDashboard/settings') ? (
            <span className="absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
          ) : null}

          <Settings
            size={18}
            className={
              pathname.startsWith('/userDashboard/settings')
                ? 'text-primary'
                : 'text-gray-400'
            }
          />
          {t('settings')}
        </Link>

        <DashboardLogoutButton onAfterLogout={onClose} />
      </div>
    </aside>
  )
}
