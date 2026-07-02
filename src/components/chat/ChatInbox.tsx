"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  listConversations,
  listMessages,
  sendMessage,
} from "@/features/chat/api";
import { chatKeys } from "@/features/chat/query-keys";
import { useChatConversationJoin } from "@/features/chat/use-chat-socket";
import type { ConversationSummary } from "@/features/chat/types";
import { toastApiError } from "@/lib/toasts";
import { getAuthUser } from "@/features/auth/session-storage";
import {
  getConversationTitle,
  getConversationTypeLabel,
} from "@/features/chat/chat-display";

type ChatInboxProps = {
  basePath: string;
};

export function ChatInbox({ basePath }: ChatInboxProps) {
  const t = useTranslations("chat");
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const selectedId = searchParams.get("c");
  const [draft, setDraft] = useState("");
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const currentUserId = getAuthUser()?.id;
  const viewerRole = getAuthUser()?.role;

  useChatConversationJoin(selectedId);

  const conversationsQuery = useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: () => listConversations(),
  });

  const conversations = conversationsQuery.data?.items ?? [];
  const selectedIsAccessible = useMemo(() => {
    if (!selectedId) return false;
    if (!conversationsQuery.isSuccess) return true;
    return conversations.some((conversation) => conversation.id === selectedId);
  }, [selectedId, conversations, conversationsQuery.isSuccess]);

  const messagesQuery = useQuery({
    queryKey: chatKeys.messages(selectedId ?? "none"),
    queryFn: () => listMessages(selectedId!),
    enabled: selectedIsAccessible,
    retry: (failureCount, error) => {
      if (error && typeof error === "object" && "statusCode" in error) {
        const statusCode = (error as { statusCode: number }).statusCode;
        if (statusCode === 403 || statusCode === 404) return false;
      }
      return failureCount < 2;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedId) return;
      return sendMessage(selectedId, content);
    },
    onSuccess: (message) => {
      if (!message || !selectedId) return;
      queryClient.setQueryData(
        chatKeys.messages(selectedId),
        (old: { items: (typeof message)[]; nextCursor?: string } | undefined) => {
          if (!old) return { items: [message] };
          if (old.items.some((m) => m.id === message.id)) return old;
          return { ...old, items: [...old.items, message] };
        },
      );
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      setDraft("");
    },
    onError: (err) => toastApiError(err),
  });

  useEffect(() => {
    if (!selectedId || conversationsQuery.isLoading) return;
    if (!conversationsQuery.isSuccess) return;
    if (conversations.length === 0) return;
    if (conversations.some((conversation) => conversation.id === selectedId)) {
      return;
    }
    router.replace(basePath);
  }, [
    basePath,
    conversations,
    conversationsQuery.isLoading,
    conversationsQuery.isSuccess,
    router,
    selectedId,
  ]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messagesQuery.data?.items.length, selectedId]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [conversations, selectedId],
  );
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

  return (
    <div className="grid h-[min(70vh,calc(100dvh-11rem))] min-h-[420px] gap-4 overflow-hidden lg:grid-cols-[320px_1fr]">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
        <div className="shrink-0 border-b p-4">
          <h2 className="font-semibold">{t("inbox")}</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("noConversations")}</p>
          ) : (
            conversations.map((conversation) => (
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
            <p>{t("selectConversation")}</p>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b p-4">
              <h3 className="font-semibold">
                {selected
                  ? getConversationTitle(selected, viewerRole, t)
                  : t("conversation")}
              </h3>
              {selectedTypeLabel ? (
                <p className="text-xs text-muted-foreground">{selectedTypeLabel}</p>
              ) : null}
            </div>

            <div
              ref={messagesScrollRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
            >
              {messagesQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                messagesQuery.data?.items.map((message) => {
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
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="mt-1 text-[10px] opacity-70">
                      {format(new Date(message.createdAt), "MMM d, h:mm a")}
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
                disabled={sendMutation.isPending}
              />
              <Button type="submit" disabled={!draft.trim() || sendMutation.isPending}>
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
        <span className="truncate text-sm font-medium">{displayTitle}</span>
        {conversation.unreadCount > 0 ? (
          <Badge variant="default" className="shrink-0">
            {conversation.unreadCount}
          </Badge>
        ) : null}
      </div>
      {preview ? (
        <span className="truncate text-xs text-muted-foreground">{preview}</span>
      ) : null}
    </button>
  );
}
