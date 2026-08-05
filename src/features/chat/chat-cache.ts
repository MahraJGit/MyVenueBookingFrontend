import type { QueryClient } from "@tanstack/react-query";
import { getAuthUser } from "@/features/auth/session-storage";
import { CHAT_INBOX_CONTEXTS, type ChatInboxContext } from "./inbox-context";
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
  context: ChatInboxContext,
) {
  const userId = scopedUserId();
  let clearedUnread = 0;

  queryClient.setQueryData<ConversationsPage>(
    chatKeys.conversations(userId, context),
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
    queryClient.setQueryData<number>(chatKeys.unreadCount(userId, context), (old) =>
      Math.max(0, (old ?? 0) - clearedUnread),
    );
  } else if (userId) {
    void queryClient.invalidateQueries({
      queryKey: chatKeys.unreadCount(userId, context),
    });
  }
}

function messageAlreadyInCache(
  items: ChatMessage[] | undefined,
  messageId: string,
) {
  return items?.some((item) => item.id === messageId) ?? false;
}

function findContextForConversation(
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
): ChatInboxContext | null {
  if (!userId) return null;

  for (const context of CHAT_INBOX_CONTEXTS) {
    const page = queryClient.getQueryData<ConversationsPage>(
      chatKeys.conversations(userId, context),
    );
    if (page?.items.some((conversation) => conversation.id === conversationId)) {
      return context;
    }
  }

  return null;
}

export function applyIncomingMessageToCache(
  queryClient: QueryClient,
  message: ChatMessage,
  options: {
    currentUserId?: string;
    activeConversationId?: string | null;
    activeContext?: ChatInboxContext | null;
  },
) {
  const userId = scopedUserId();
  const { currentUserId, activeConversationId, activeContext } = options;
  const isActiveConversation = activeConversationId === message.conversationId;
  const isFromOther = Boolean(currentUserId && message.senderId !== currentUserId);

  const resolvedContext =
    (isActiveConversation && activeContext) ||
    findContextForConversation(queryClient, userId, message.conversationId);

  if (!resolvedContext) {
    void queryClient.invalidateQueries({ queryKey: chatKeys.all });
    return;
  }

  const messagesKey = chatKeys.messages(userId, message.conversationId, resolvedContext);
  const existingMessages = queryClient.getQueryData<{
    pages: Array<{ items: ChatMessage[]; nextCursor?: string }>;
    pageParams: unknown[];
  }>(messagesKey);
  const flatItems = existingMessages?.pages.flatMap((page) => page.items);
  const isNewMessage = !messageAlreadyInCache(flatItems, message.id);

  if (isNewMessage) {
    queryClient.setQueryData<{
      pages: Array<{ items: ChatMessage[]; nextCursor?: string }>;
      pageParams: unknown[];
    }>(messagesKey, (old) => {
      if (!old?.pages.length) {
        return { pages: [{ items: [message] }], pageParams: [undefined] };
      }
      const pages = [...old.pages];
      const firstPage = pages[0];
      if (messageAlreadyInCache(firstPage.items, message.id)) return old;
      pages[0] = { ...firstPage, items: [...firstPage.items, message] };
      return { ...old, pages };
    });
  }

  queryClient.setQueryData<ConversationsPage>(
    chatKeys.conversations(userId, resolvedContext),
    (old) => {
      if (!old) return old;

      const items = old.items.map((conversation) => {
        if (conversation.id !== message.conversationId) return conversation;

        const unreadCount =
          isNewMessage && !isActiveConversation && isFromOther
            ? conversation.unreadCount + 1
            : conversation.unreadCount;

        return {
          ...conversation,
          lastMessage: message,
          lastMessageAt: message.createdAt,
          unreadCount,
        };
      });

      items.sort((a, b) => {
        const unreadDelta = Number(b.unreadCount > 0) - Number(a.unreadCount > 0);
        if (unreadDelta !== 0) return unreadDelta;
        const aTime = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
        const bTime = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
        return bTime - aTime;
      });

      return { ...old, items };
    },
  );

  if (isNewMessage && isFromOther && !isActiveConversation) {
    queryClient.setQueryData<number>(
      chatKeys.unreadCount(userId, resolvedContext),
      (old) => (old ?? 0) + 1,
    );
  }
}
