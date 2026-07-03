"use client";

import { useQuery } from "@tanstack/react-query";
import { getUnreadChatCount } from "./api";
import type { ChatInboxContext } from "./inbox-context";
import { chatKeys } from "./query-keys";

export function useChatUnreadCount(
  userId?: string | null,
  context: ChatInboxContext = "buyer",
  enabled = true,
) {
  return useQuery({
    queryKey: chatKeys.unreadCount(userId, context),
    queryFn: () => getUnreadChatCount(context),
    enabled: enabled && !!userId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
