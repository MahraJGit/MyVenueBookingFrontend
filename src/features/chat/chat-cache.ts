import type { QueryClient } from "@tanstack/react-query";
import { getAuthUser } from "@/features/auth/session-storage";
import { chatKeys } from "./query-keys";
import type { ChatMessage, ConversationSummary } from "./types";

type ConversationsPage = {
  items: ConversationSummary[];
  nextCursor?: string;
};

function scopedUserId() {
  return getAuthUser()?.id;
}

export function applyConversationReadLocally(
  queryClient: QueryClient,
  conversationId: string,
) {
  const userId = scopedUserId();
  let clearedUnread = 0;

  queryClient.setQueryData<ConversationsPage>(
    chatKeys.conversations(userId),
    (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          clearedUnread = conversation.unreadCount;
          return { ...conversation, unreadCount: 0 };
        }),
      };
    },
  );

  if (clearedUnread > 0) {
    queryClient.setQueryData<number>(chatKeys.unreadCount(userId), (old) =>
      Math.max(0, (old ?? 0) - clearedUnread),
    );
  }
}

export function applyIncomingMessageToCache(
  queryClient: QueryClient,
  message: ChatMessage,
  options: { currentUserId?: string; activeConversationId?: string | null },
) {
  const userId = scopedUserId();
  const { currentUserId, activeConversationId } = options;
  const isActiveConversation = activeConversationId === message.conversationId;
  const isFromOther = Boolean(currentUserId && message.senderId !== currentUserId);

  queryClient.setQueryData<{ items: ChatMessage[]; nextCursor?: string }>(
    chatKeys.messages(userId, message.conversationId),
    (old) => {
      if (!old) return { items: [message] };
      if (old.items.some((item) => item.id === message.id)) return old;
      return { ...old, items: [...old.items, message] };
    },
  );

  queryClient.setQueryData<ConversationsPage>(
    chatKeys.conversations(userId),
    (old) => {
      if (!old) return old;

      const items = old.items.map((conversation) => {
        if (conversation.id !== message.conversationId) return conversation;

        const unreadCount =
          isActiveConversation || !isFromOther
            ? 0
            : conversation.unreadCount + 1;

        return {
          ...conversation,
          lastMessage: message,
          lastMessageAt: message.createdAt,
          unreadCount,
        };
      });

      items.sort((a, b) => {
        const aTime = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
        const bTime = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
        return bTime - aTime;
      });

      return { ...old, items };
    },
  );

  if (isFromOther && !isActiveConversation) {
    queryClient.setQueryData<number>(chatKeys.unreadCount(userId), (old) =>
      (old ?? 0) + 1,
    );
  }
}
