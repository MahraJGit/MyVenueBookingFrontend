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
  Settings,
  LogOut,
  CalendarDays,
} from 'lucide-react'

export default function UserSidebar() {
  const pathname = usePathname()
  const t = useTranslations('userDashboard')
  const tCommon = useTranslations('common')

  const links = [
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
      labelKey: 'personalInfo' as const,
      href: '/userDashboard/profile',
      icon: User,
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
  ]

  return (
    <aside className="w-[260px] min-h-screen bg-[#1B1B1B] rounded-2xl  text-white px-4 py-6 flex flex-col border-r border-white/10">

      <div className="flex items-center gap-2 mb-10 px-2">
        <Image src="/svg/logo.svg" alt={tCommon('appName')} width={170} height={70} />
      </div>

      <nav className="flex flex-col space-y-1">
        {links.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 px-4 py-2 text-sm transition
                ${isActive
                  ? 'text-primary'
                  : 'text-gray-300 hover:text-white'}
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-primary rounded-full" />
              )}

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
          className={`
            relative flex items-center gap-3 px-4 py-2 text-sm transition
            ${pathname.startsWith('/userDashboard/settings')
              ? 'text-primary'
              : 'text-gray-300 hover:text-white'}
          `}
        >
          {pathname.startsWith('/userDashboard/settings') && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-primary rounded-full" />
          )}

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

        <button
          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-red-400 transition w-full"
        >
          <LogOut size={18} />
          {t('logOut')}
        </button>
      </div>
    </aside>
  )
}
