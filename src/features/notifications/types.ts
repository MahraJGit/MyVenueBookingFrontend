export type NotificationType =
  | 'info'
  | 'success'
  | 'error'
  | 'promo'
  | 'message';

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  link: string | null;
  metadata: unknown;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPreferences = {
  userId?: string;
  eventReminders: boolean;
  exclusiveOffers: boolean;
  ticketAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
};
