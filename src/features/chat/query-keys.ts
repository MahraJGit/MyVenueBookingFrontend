export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  conversation: (id: string) => [...chatKeys.all, "conversation", id] as const,
  messages: (id: string) => [...chatKeys.all, "messages", id] as const,
  unreadCount: () => [...chatKeys.all, "unread-count"] as const,
  byBooking: (bookingId: string) => [...chatKeys.all, "booking", bookingId] as const,
  byOrderGroup: (orderGroupId: string) =>
    [...chatKeys.all, "order", orderGroupId] as const,
};
