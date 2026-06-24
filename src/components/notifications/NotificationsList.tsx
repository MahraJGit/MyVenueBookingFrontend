'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'

import {
  DashboardFilterBar,
  DashboardScrollableTabs,
} from '@/components/userDashboard/DashboardScrollableTabs'
import {
  ChevronDown,
  CheckCircle,
  XCircle,
  Bell,
  Tag,
  MessageSquare,
  CheckCheck,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/api'
import type { NotificationItem, NotificationType } from '@/features/notifications/types'

function getIcon(type: NotificationType) {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'promo':
      return <Tag className="h-5 w-5 text-pink-500" />
    case 'message':
      return <MessageSquare className="h-5 w-5 text-blue-500" />
    default:
      return <Bell className="h-5 w-5 text-primary" />
  }
}

function formatNotificationTime(createdAt: string) {
  try {
    return format(new Date(createdAt), "MMM d, yyyy 'at' h:mm a")
  } catch {
    return createdAt
  }
}

type NotificationsListProps = {
  className?: string
}

export default function NotificationsList({ className }: NotificationsListProps) {
  const t = useTranslations('notifications')
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'all' | 'read' | 'unread'>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const { data: allNotifications = [], isLoading, isError } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => listNotifications('all'),
  })

  const filteredNotifications =
    activeTab === 'all'
      ? allNotifications
      : allNotifications.filter((n) =>
          activeTab === 'read' ? n.isRead : !n.isRead,
        )

  const unreadCount = allNotifications.filter((n) => !n.isRead).length
  const readCount = allNotifications.filter((n) => n.isRead).length

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markOneMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const toggleAccordion = (notification: NotificationItem) => {
    const nextOpen = openId === notification.id ? null : notification.id
    setOpenId(nextOpen)
    if (!notification.isRead && nextOpen === notification.id) {
      markOneMutation.mutate(notification.id)
    }
  }

  const tabLabels = {
    all: t('tabAll', { count: allNotifications.length }),
    unread: t('tabUnread', { count: unreadCount }),
    read: t('tabRead', { count: readCount }),
  } as const

  return (
    <div className={className ?? 'mt-2 rounded-xl bg-[#121212] p-4 sm:mt-5 sm:p-8'}>
      <DashboardFilterBar
        className="border-[#242424]"
        action={
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            disabled={unreadCount === 0 || markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            {t('markAllRead')} <CheckCheck className="ml-1 h-4 w-4" />
          </Button>
        }
      >
        <DashboardScrollableTabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={(['all', 'unread', 'read'] as const).map((value) => ({
            value,
            label: tabLabels[value],
          }))}
        />
      </DashboardFilterBar>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-muted-foreground">
          {t('loadError')}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Image
            src="/svg/notificationbell.svg"
            alt={t('noNotificationsImageAlt')}
            width={200}
            height={200}
          />
          <h3 className="text-lg font-semibold">{t('emptyTitle')}</h3>
          <p className="text-muted-foreground max-w-sm">
            {t('emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const isOpen = openId === notification.id
            const content = (
              <div
                key={notification.id}
                className="rounded-xl bg-[#151515] hover:bg-[#1a1a1a] transition"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(notification)}
                  className="w-full flex items-start gap-4 px-5 py-4 text-left"
                >
                  <div className="mt-1">{getIcon(notification.type)}</div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-pink-500 shrink-0" />
                      )}
                    </div>

                    <p
                      className={`text-sm text-muted-foreground mt-1 ${
                        !isOpen ? 'line-clamp-1' : ''
                      }`}
                    >
                      {notification.description}
                    </p>

                    <span className="text-xs text-muted-foreground mt-2 block">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </div>

                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground space-y-3">
                    <p>{notification.description}</p>
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        className="text-primary hover:underline text-sm inline-block"
                      >
                        {t('viewDetails')}
                      </Link>
                    ) : null}
                  </div>
                )}
              </div>
            )

            return content
          })}
        </div>
      )}
    </div>
  )
}
