import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";
import type {
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
} from "./types";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

type SuccessEnvelope<T> = { success: boolean; data: T };

export async function listConversations(cursor?: string) {
  const params = new URLSearchParams({ limit: "30" });
  if (cursor) params.set("cursor", cursor);

  const res = await authFetch(`/api/conversations?${params}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading conversations.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  return (data as SuccessEnvelope<{
    items: ConversationSummary[];
    nextCursor?: string;
  }>).data;
}

export async function getConversation(id: string) {
  const res = await authFetch(`/api/conversations/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading conversation.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  return (data as SuccessEnvelope<ConversationDetail>).data;
}

export async function listMessages(conversationId: string, cursor?: string) {
  const params = new URLSearchParams({ limit: "50" });
  if (cursor) params.set("cursor", cursor);

  const res = await authFetch(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages?${params}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading messages.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  return (data as SuccessEnvelope<{
    items: ChatMessage[];
    nextCursor?: string;
  }>).data;
}

export async function sendMessage(conversationId: string, content: string) {
  const res = await authFetch(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
      networkErrorMessage: "Network error while sending message.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  return (data as SuccessEnvelope<ChatMessage>).data;
}

export async function markConversationRead(conversationId: string) {
  const res = await authFetch(
    `/api/conversations/${encodeURIComponent(conversationId)}/read`,
    {
      method: "PATCH",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while updating conversation.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
}

export async function getUnreadChatCount() {
  const res = await authFetch("/api/conversations/unread-count", {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading unread count.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  return (data as SuccessEnvelope<{ count: number }>).data.count;
}

export async function getConversationByBooking(bookingId: string) {
  const res = await authFetch(
    `/api/conversations/booking/${encodeURIComponent(bookingId)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while opening chat.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  return (data as SuccessEnvelope<ConversationDetail>).data;
}

export async function getConversationByOrderGroup(orderGroupId: string) {
  const res = await authFetch(
    `/api/conversations/ticket-order/${encodeURIComponent(orderGroupId)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while opening chat.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  return (data as SuccessEnvelope<ConversationDetail>).data;
}

export async function getOrCreateVendorSupportConversation() {
  const res = await authFetch("/api/conversations/vendor-support", {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while opening support chat.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  return (data as SuccessEnvelope<ConversationDetail>).data;
}
