"use client";

import { Badge } from "@/components/ui/badge";
import { useChatUnreadCount } from "@/features/chat/use-chat-unread-count";
import type { ChatInboxContext } from "@/features/chat/inbox-context";
import { useAuth } from "@/features/auth/auth-context";

export function ChatUnreadBadge({
  context = "buyer",
}: {
  context?: ChatInboxContext;
}) {
  const { user, isAuthenticated, isReady } = useAuth();
  const { data: unreadCount = 0 } = useChatUnreadCount(
    user?.id,
    context,
    isAuthenticated && isReady,
  );

  if (unreadCount <= 0) return null;

  return (
    <Badge variant="default" className="ml-auto shrink-0 px-1.5 py-0 text-[10px]">
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}
