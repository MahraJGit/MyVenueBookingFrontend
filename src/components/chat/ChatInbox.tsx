"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { getDateFnsLocale } from "@/lib/date-locale";
import {
  getConversation,
  listConversations,
  listMessages,
  sendMessage,
} from "@/features/chat/api";
import type { ChatInboxContext } from "@/features/chat/inbox-context";
import { chatKeys } from "@/features/chat/query-keys";
import { useChatConversationJoin } from "@/features/chat/use-chat-socket";
import type {
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
} from "@/features/chat/types";
import { toastApiError } from "@/lib/toasts";
import { getAuthUser } from "@/features/auth/session-storage";
import { participantRoleForContext } from "@/features/chat/inbox-context";
import { useAuth } from "@/features/auth/auth-context";
import {
  getConversationTitle,
  getConversationTypeLabel,
} from "@/features/chat/chat-display";

type ChatInboxProps = {
  basePath: string;
  context: ChatInboxContext;
};

type MessagesPage = {
  items: ChatMessage[];
  nextCursor?: string;
};

function detailToSummary(detail: ConversationDetail): ConversationSummary {
  return {
    id: detail.id,
    type: detail.type,
    title: detail.title,
    status: detail.status,
    lastMessageAt: detail.lastMessageAt,
    unreadCount: 0,
    lastMessage: null,
    participants: detail.participants,
    bookingId: detail.bookingId,
    orderGroupId: detail.orderGroupId,
    vendorId: detail.vendorId,
  };
}

export function ChatInbox({ basePath, context }: ChatInboxProps) {
  const t = useTranslations("chat");
  const { locale } = useLocaleContext();
  const dateFnsLocale = getDateFnsLocale(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isReady } = useAuth();
  const selectedId = searchParams.get("c");
  const [draft, setDraft] = useState("");
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const loadingOlderRef = useRef(false);
  const currentUserId = getAuthUser()?.id;
  const viewerRole = participantRoleForContext(context);

  useChatConversationJoin(selectedId, context);

  const conversationsQuery = useQuery({
    queryKey: chatKeys.conversations(user?.id, context),
    queryFn: () => listConversations(context),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const conversations = conversationsQuery.data?.items ?? [];
  const inList = Boolean(
    selectedId && conversations.some((conversation) => conversation.id === selectedId),
  );

  const selectedConversationQuery = useQuery({
    queryKey: chatKeys.conversation(user?.id, selectedId ?? "", context),
    queryFn: () => getConversation(selectedId!, context),
    enabled:
      !!selectedId && !inList && isAuthenticated && isReady && !!user?.id,
    retry: (failureCount, error) => {
      if (error && typeof error === "object" && "statusCode" in error) {
        const statusCode = (error as { statusCode: number }).statusCode;
        if (statusCode === 403 || statusCode === 404) return false;
      }
      return failureCount < 1;
    },
  });

  const selectedIsAccessible =
    !selectedId || inList || selectedConversationQuery.isSuccess;

  const messagesQuery = useInfiniteQuery({
    queryKey: chatKeys.messages(user?.id, selectedId ?? "none", context),
    queryFn: ({ pageParam }) => listMessages(selectedId!, context, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled:
      selectedIsAccessible && isAuthenticated && isReady && !!user?.id && !!selectedId,
    retry: (failureCount, error) => {
      if (error && typeof error === "object" && "statusCode" in error) {
        const statusCode = (error as { statusCode: number }).statusCode;
        if (statusCode === 403 || statusCode === 404) return false;
      }
      return failureCount < 2;
    },
  });

  const messages = useMemo(() => {
    const pages = messagesQuery.data?.pages;
    if (!pages) return [];
    return [...pages].reverse().flatMap((page) => page.items);
  }, [messagesQuery.data?.pages]);

  const hasOlderMessages = Boolean(messagesQuery.hasNextPage);

  const displayConversations = useMemo(() => {
    const list =
      selectedId && !inList && selectedConversationQuery.data
        ? [detailToSummary(selectedConversationQuery.data), ...conversations]
        : conversations;

    return [...list].sort((a, b) => {
      const unreadDelta = Number(b.unreadCount > 0) - Number(a.unreadCount > 0);
      if (unreadDelta !== 0) return unreadDelta;
      const aTime = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
      const bTime = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
      return bTime - aTime;
    });
  }, [conversations, inList, selectedConversationQuery.data, selectedId]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedId) return;
      return sendMessage(selectedId, content, context);
    },
    onSuccess: (message) => {
      if (!message || !selectedId) return;
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        chatKeys.messages(user?.id, selectedId, context),
        (old) => {
          if (!old?.pages.length) {
            return { pages: [{ items: [message] }], pageParams: [undefined] };
          }
          const pages = [...old.pages];
          const firstPage = pages[0];
          if (firstPage.items.some((m) => m.id === message.id)) return old;
          pages[0] = { ...firstPage, items: [...firstPage.items, message] };
          return { ...old, pages };
        },
      );
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(user?.id, context),
      });
      setDraft("");
    },
    onError: (err) => toastApiError(err),
  });

  useEffect(() => {
    if (!selectedId) return;
    if (inList) return;
    if (selectedConversationQuery.isLoading) return;
    if (selectedConversationQuery.isSuccess) return;
    if (selectedConversationQuery.isError) {
      router.replace(basePath);
    }
  }, [
    basePath,
    inList,
    router,
    selectedConversationQuery.isError,
    selectedConversationQuery.isLoading,
    selectedConversationQuery.isSuccess,
    selectedId,
  ]);

  useEffect(() => {
    prevMessageCountRef.current = 0;
    loadingOlderRef.current = false;
  }, [selectedId]);

  useEffect(() => {
    const count = messages.length;
    const el = messagesScrollRef.current;
    if (!el) return;

    if (loadingOlderRef.current) {
      loadingOlderRef.current = false;
      prevMessageCountRef.current = count;
      return;
    }

    if (count > prevMessageCountRef.current) {
      el.scrollTop = el.scrollHeight;
    }
    prevMessageCountRef.current = count;
  }, [messages.length, selectedId]);

  const selected = useMemo(() => {
    const fromList = displayConversations.find((c) => c.id === selectedId);
    if (fromList) return fromList;
    if (selectedConversationQuery.data) {
      return detailToSummary(selectedConversationQuery.data);
    }
    return undefined;
  }, [displayConversations, selectedConversationQuery.data, selectedId]);

  const selectedTypeLabel = selected
    ? getConversationTypeLabel(selected.type, viewerRole, t)
    : null;

  const handleSelect = (id: string) => {
    router.push(`${basePath}?c=${id}`);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !selectedId || sendMutation.isPending) return;
    sendMutation.mutate(content);
  };

  const handleLoadOlder = async () => {
    if (!messagesScrollRef.current || !messagesQuery.hasNextPage) return;
    const el = messagesScrollRef.current;
    const previousHeight = el.scrollHeight;
    loadingOlderRef.current = true;
    await messagesQuery.fetchNextPage();
    requestAnimationFrame(() => {
      if (!messagesScrollRef.current) return;
      messagesScrollRef.current.scrollTop =
        messagesScrollRef.current.scrollHeight - previousHeight;
    });
  };

  return (
    <div className="grid h-[min(70vh,calc(100dvh-11rem))] min-h-[420px] gap-4 overflow-hidden lg:grid-cols-[320px_1fr]">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
        <div className="shrink-0 border-b p-4">
          <h2 className="font-semibold" dir="auto">
            {t("inbox")}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversationsQuery.isError ? (
            <p className="p-6 text-sm text-destructive">{t("inboxError")}</p>
          ) : displayConversations.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("noConversations")}</p>
          ) : (
            displayConversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === selectedId}
                onSelect={() => handleSelect(conversation.id)}
                viewerRole={viewerRole}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
        {!selectedId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
            <MessageCircle className="h-10 w-10 opacity-40" />
            <p dir="auto">{t("selectConversation")}</p>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b p-4">
              <h3 className="font-semibold" dir="auto">
                {selected
                  ? getConversationTitle(selected, viewerRole, t)
                  : t("conversation")}
              </h3>
              {selectedTypeLabel ? (
                <p className="text-xs text-muted-foreground" dir="auto">
                  {selectedTypeLabel}
                </p>
              ) : null}
            </div>

            <div
              ref={messagesScrollRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
            >
              {hasOlderMessages ? (
                <div className="flex justify-center pb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleLoadOlder()}
                    disabled={messagesQuery.isFetchingNextPage}
                  >
                    {messagesQuery.isFetchingNextPage ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t("loadOlder")}
                  </Button>
                </div>
              ) : null}

              {messagesQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messagesQuery.isError ? (
                <p className="py-8 text-center text-sm text-destructive">
                  {t("messagesError")}
                </p>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground" dir="auto">
                  {t("noMessages")}
                </p>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        <p className="mb-1 text-xs font-medium opacity-80">
                          {message.sender.firstName} {message.sender.lastName}
                        </p>
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p className="mt-1 text-[10px] opacity-70">
                          {format(new Date(message.createdAt), "MMM d, h:mm a", {
                            locale: dateFnsLocale,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSend} className="flex shrink-0 gap-2 border-t p-4">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("messagePlaceholder")}
                maxLength={2000}
                disabled={sendMutation.isPending || messagesQuery.isError}
                dir="auto"
              />
              <Button
                type="submit"
                disabled={!draft.trim() || sendMutation.isPending || messagesQuery.isError}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  onSelect,
  viewerRole,
}: {
  conversation: ConversationSummary;
  active: boolean;
  onSelect: () => void;
  viewerRole?: string;
}) {
  const t = useTranslations("chat");
  const preview = conversation.lastMessage?.content ?? "";
  const displayTitle = getConversationTitle(conversation, viewerRole, t);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition hover:bg-muted/50",
        active && "bg-muted",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium" dir="auto">
          {displayTitle}
        </span>
        {conversation.unreadCount > 0 ? (
          <Badge variant="default" className="shrink-0">
            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
          </Badge>
        ) : null}
      </div>
      {preview ? (
        <span className="truncate text-xs text-muted-foreground" dir="auto">
          {preview}
        </span>
      ) : null}
    </button>
  );
}
