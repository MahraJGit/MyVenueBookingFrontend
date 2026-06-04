'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  return (
    <div className={className ?? 'mt-5 rounded-xl bg-[#121212] p-8'}>
      <div className="border-b border-[#242424] mb-6 flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="bg-transparent p-0 gap-6">
            {(
              [
                ['all', `All (${allNotifications.length})`],
                ['unread', `Unread (${unreadCount})`],
                ['read', `Read (${readCount})`],
              ] as const
            ).map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="pb-3 rounded-none text-sm
                  data-[state=active]:border-b-2
                  data-[state=active]:border-primary
                  data-[state=active]:text-white
                  text-muted-foreground"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          disabled={unreadCount === 0 || markAllMutation.isPending}
          onClick={() => markAllMutation.mutate()}
        >
          Mark All as Read <CheckCheck className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-muted-foreground">
          Could not load notifications. Please try again later.
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Image
            src="/svg/notificationbell.svg"
            alt="no notifications"
            width={200}
            height={200}
          />
          <h3 className="text-lg font-semibold">No notifications here!</h3>
          <p className="text-muted-foreground max-w-sm">
            You&apos;re all caught up. New notifications will appear here.
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
                        View details
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
