import type { ChatInboxContext } from "./inbox-context";

export const chatKeys = {
  all: ["chat"] as const,
  conversations: (userId?: string | null, context?: ChatInboxContext) =>
    [...chatKeys.all, userId ?? "anonymous", context ?? "buyer", "conversations"] as const,
  conversation: (
    userId: string | null | undefined,
    id: string,
    context?: ChatInboxContext,
  ) =>
    [...chatKeys.all, userId ?? "anonymous", context ?? "buyer", "conversation", id] as const,
  messages: (
    userId: string | null | undefined,
    id: string,
    context?: ChatInboxContext,
  ) =>
    [...chatKeys.all, userId ?? "anonymous", context ?? "buyer", "messages", id] as const,
  unreadCount: (userId?: string | null, context?: ChatInboxContext) =>
    [...chatKeys.all, userId ?? "anonymous", context ?? "buyer", "unread-count"] as const,
  byBooking: (
    userId: string | null | undefined,
    bookingId: string,
    context?: ChatInboxContext,
  ) =>
    [...chatKeys.all, userId ?? "anonymous", context ?? "buyer", "booking", bookingId] as const,
  byOrderGroup: (
    userId: string | null | undefined,
    orderGroupId: string,
    context?: ChatInboxContext,
  ) =>
    [...chatKeys.all, userId ?? "anonymous", context ?? "buyer", "order", orderGroupId] as const,
};
