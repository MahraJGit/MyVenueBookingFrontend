'use client'

import React, { useState } from 'react'
import Image from 'next/image'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

import {
  ChevronDown,
  CheckCircle,
  XCircle,
  Bell,
  Tag,
  MessageSquare,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/* -------------------- DATA -------------------- */
const notificationData = [
  {
    id: 1,
    title: 'Welcome to My Venue Booking!',
    description:
      'We’re glad to have you here! 🎉 Explore and book tickets for the best concerts, theaters, and events.',
    time: 'Yesterday at 4:42 PM',
    type: 'info',
    isRead: false,
  },
  {
    id: 2,
    title: 'Your purchase is confirmed',
    description:
      'You can easily access your ticket anytime by heading over to the "Tickets" section in your account.',
    time: 'Yesterday at 4:42 PM',
    type: 'success',
    isRead: true,
  },
  {
    id: 3,
    title: 'Get 30% off on Summer Music Festival tickets!',
    description:
      'Don’t miss this special offer! Use discount code MUSIC30 (Valid until midnight).',
    time: 'Yesterday at 4:42 PM',
    type: 'promo',
    isRead: false,
  },
  {
    id: 4,
    title: 'Your payment was unsuccessful',
    description:
      'Your payment for Startup Summit 2025 was not completed. Please try again or contact support.',
    time: 'Yesterday at 4:42 PM',
    type: 'error',
    isRead: false,
  },
  {
    id: 5,
    title: 'Response from Support',
    description:
      'Our support team has responded to your request regarding "Canceling your Shakespeare Theater Ticket". Please check Support Messages.',
    time: 'Yesterday at 4:42 PM',
    type: 'message',
    isRead: true,
  },
]

/* -------------------- COMPONENT -------------------- */
export default function Notifications() {
  const [activeTab, setActiveTab] = useState<'all' | 'read' | 'unread'>('all')
  const [openId, setOpenId] = useState<number | null>(null)

  const filteredNotifications =
    activeTab === 'all'
      ? notificationData
      : notificationData.filter(n =>
          activeTab === 'read' ? n.isRead : !n.isRead
        )

  const toggleAccordion = (id: number) => {
    setOpenId(prev => (prev === id ? null : id))
  }

  const getIcon = (type: string) => {
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

  return (
    <div className="mt-5 rounded-xl bg-[#121212] p-8">
      {/* ---------- TABS ---------- */}
      <div className="border-b border-[#242424] mb-6 flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList className="bg-transparent p-0 gap-6">
            {[
              ['all', `All (${notificationData.length})`],
              [
                'unread',
                `Unread (${notificationData.filter(n => !n.isRead).length})`,
              ],
              [
                'read',
                `Read (${notificationData.filter(n => n.isRead).length})`,
              ],
            ].map(([value, label]) => (
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
        <Button variant='ghost'>Mark All as Read  <CheckCheck /></Button>
      </div>

      {/* ---------- EMPTY STATE ---------- */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Image
            src="/svg/notificationbell.svg"
            alt="no notifications"
            width={200}
            height={200}
          />
          <h3 className="text-lg font-semibold">No notifications here!</h3>
          <p className="text-muted-foreground max-w-sm">
            You’re all caught up. New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => {
            const isOpen = openId === notification.id

            return (
              <div
                key={notification.id}
                className="rounded-xl bg-[#151515] hover:bg-[#1a1a1a] transition"
              >
                {/* ---------- HEADER ---------- */}
                <button
                  onClick={() => toggleAccordion(notification.id)}
                  className="w-full flex items-start gap-4 px-5 py-4 text-left"
                >
                  {/* Icon */}
                  <div className="mt-1">{getIcon(notification.type)}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm font-medium">
                        {notification.title}
                      </h4>

                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-pink-500" />
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
                      {notification.time}
                    </span>
                  </div>

                  {/* Arrow */}
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* ---------- EXPANDED CONTENT ---------- */}
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground">
                    {notification.description}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
