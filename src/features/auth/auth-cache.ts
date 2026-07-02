import type { QueryClient } from "@tanstack/react-query";

function scopedKey(base: string, userId?: string | null) {
  return [base, userId ?? "anonymous"] as const;
}

export function userProfileQueryKey(userId?: string | null) {
  return scopedKey("user-profile", userId);
}

export function myTicketOrdersQueryKey(userId?: string | null) {
  return scopedKey("my-ticket-orders", userId);
}

export function myTicketOrderQueryKey(
  userId: string | null | undefined,
  orderGroupId: string,
) {
  return ["my-ticket-order", userId ?? "anonymous", orderGroupId] as const;
}

export function notificationPreferencesQueryKey(userId?: string | null) {
  return scopedKey("notification-preferences", userId);
}

export function notificationsQueryKey(
  userId: string | null | undefined,
  suffix: string,
) {
  return ["notifications", userId ?? "anonymous", suffix] as const;
}

/** Drop cached user data when auth identity changes (logout / login). */
export function resetAuthQueryCache(queryClient: QueryClient) {
  queryClient.clear();
}
