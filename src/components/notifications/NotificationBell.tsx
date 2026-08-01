'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/features/auth/auth-context'
import { notificationsQueryKey } from '@/features/auth/auth-cache'
import {
  getUnreadNotificationCount,
  type NotificationAudience,
} from '@/features/notifications/api'

type NotificationBellProps = {
  href: string
  variant?: 'user' | 'admin'
  /** When set, the unread badge only counts notifications for this audience. */
  audience?: NotificationAudience
}

export default function NotificationBell({
  href,
  variant = 'user',
  audience,
}: NotificationBellProps) {
  const t = useTranslations('notifications')
  const { isAuthenticated, isReady, user } = useAuth()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: notificationsQueryKey(
      user?.id,
      `unread-count:${audience ?? 'any'}`,
    ),
    queryFn: () => getUnreadNotificationCount(audience),
    enabled: isReady && isAuthenticated && !!user?.id,
    refetchInterval: 60_000,
  })

  if (variant === 'admin') {
    return (
      <Link
        href={href}
        className="relative h-10 w-10 flex items-center justify-center rounded-full bg-[#EAE9E9] cursor-pointer hover:scale-105 transition"
        aria-label={t('title')}
      >
        <Image src="/svg/bell.svg" alt={t('title')} width={22} height={22} />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#D7498E] text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="relative rounded-full p-2 bg-[#1a1a1a] hover:bg-[#222] transition"
      aria-label={t('title')}
    >
      <Bell className="h-5 w-5 text-white" />
      {unreadCount > 0 ? (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-pink-500 text-[10px] font-semibold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Link>
  )
}
