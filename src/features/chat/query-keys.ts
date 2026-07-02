export const chatKeys = {
  all: ["chat"] as const,
  conversations: (userId?: string | null) =>
    [...chatKeys.all, userId ?? "anonymous", "conversations"] as const,
  conversation: (userId: string | null | undefined, id: string) =>
    [...chatKeys.all, userId ?? "anonymous", "conversation", id] as const,
  messages: (userId: string | null | undefined, id: string) =>
    [...chatKeys.all, userId ?? "anonymous", "messages", id] as const,
  unreadCount: (userId?: string | null) =>
    [...chatKeys.all, userId ?? "anonymous", "unread-count"] as const,
  byBooking: (userId: string | null | undefined, bookingId: string) =>
    [...chatKeys.all, userId ?? "anonymous", "booking", bookingId] as const,
  byOrderGroup: (userId: string | null | undefined, orderGroupId: string) =>
    [...chatKeys.all, userId ?? "anonymous", "order", orderGroupId] as const,
};
