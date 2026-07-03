"use client";

import { type QueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import {
  AUTH_CHANGED_EVENT,
  getAccessToken,
  getAuthUser,
} from "@/features/auth/session-storage";
import { assertApiConfigured } from "@/lib/env";
import { toastApiError } from "@/lib/toasts";
import { markConversationRead } from "./api";
import {
  applyConversationReadLocally,
  applyIncomingMessageToCache,
} from "./chat-cache";
import type { ChatInboxContext } from "./inbox-context";
import { chatKeys } from "./query-keys";
import type { ChatMessage } from "./types";

let sharedSocket: Socket | null = null;
let socketToken: string | null = null;
let queryClientRef: QueryClient | null = null;
let activeConversationIdRef: string | null = null;
let activeChatContextRef: ChatInboxContext | null = null;
let listenersBound = false;

function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.removeAllListeners();
    sharedSocket.io.removeAllListeners();
    sharedSocket.disconnect();
  }
  sharedSocket = null;
  socketToken = null;
  listenersBound = false;
}

function normalizeMessage(raw: ChatMessage): ChatMessage {
  return {
    ...raw,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date(raw.createdAt as unknown as string).toISOString(),
  };
}

function applyIncomingMessage(queryClient: QueryClient, message: ChatMessage) {
  const normalized = normalizeMessage(message);

  applyIncomingMessageToCache(queryClient, normalized, {
    currentUserId: getAuthUser()?.id,
    activeConversationId: activeConversationIdRef,
    activeContext: activeChatContextRef,
  });
}

function markConversationReadEverywhere(
  conversationId: string,
  context: ChatInboxContext,
) {
  if (!queryClientRef) return;

  applyConversationReadLocally(queryClientRef, conversationId, context);

  const userId = getAuthUser()?.id;
  void markConversationRead(conversationId, context)
    .then(() => {
      if (userId) {
        void queryClientRef?.invalidateQueries({
          queryKey: chatKeys.unreadCount(userId, context),
        });
      }
    })
    .catch(() => {
      // Socket read may still succeed; inbox will resync on next fetch.
    });
}

function joinConversation(
  socket: Socket,
  conversationId: string,
  context: ChatInboxContext,
) {
  socket.emit("conversation:join", { conversationId, context });
  socket.emit("conversation:read", { conversationId, context });
  markConversationReadEverywhere(conversationId, context);
}

function rejoinActiveConversation(socket: Socket) {
  if (activeConversationIdRef && activeChatContextRef) {
    joinConversation(socket, activeConversationIdRef, activeChatContextRef);
  }
}

function bindSocketListeners(socket: Socket) {
  if (listenersBound) return;
  listenersBound = true;

  socket.on("connect", () => {
    rejoinActiveConversation(socket);
  });

  socket.io.on("reconnect", () => {
    rejoinActiveConversation(socket);
  });

  socket.on("message:new", (raw: ChatMessage) => {
    if (!queryClientRef) return;
    applyIncomingMessage(queryClientRef, raw);
  });

  socket.on(
    "message:error",
    (payload: { conversationId?: string; message?: string }) => {
      if (!payload?.message) return;
      toastApiError(new Error(payload.message));
    },
  );
}

function getSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) {
    disconnectSocket();
    return null;
  }

  if (sharedSocket && socketToken !== token) {
    disconnectSocket();
  }

  if (!sharedSocket) {
    const baseUrl = assertApiConfigured();
    sharedSocket = io(baseUrl, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      autoConnect: true,
    });
    socketToken = token;
    bindSocketListeners(sharedSocket);
  }

  if (!sharedSocket.connected) {
    sharedSocket.connect();
  }

  return sharedSocket;
}

/** Mount once per dashboard layout — keeps the socket alive and listeners registered. */
export function useChatSocketConnection(queryClient: QueryClient) {
  useEffect(() => {
    queryClientRef = queryClient;
    getSocket();

    const onAuthChanged = () => {
      disconnectSocket();
      getSocket();
      const socket = sharedSocket;
      if (socket) {
        rejoinActiveConversation(socket);
      }
    };

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, [queryClient]);
}

/** Call from ChatInbox when the active conversation changes. */
export function useChatConversationJoin(
  activeConversationId?: string | null,
  context?: ChatInboxContext | null,
) {
  const joinedRef = useRef<string | null>(null);

  useEffect(() => {
    activeConversationIdRef = activeConversationId ?? null;
    activeChatContextRef = context ?? null;

    const socket = getSocket();
    if (!socket || !activeConversationId || !context) return;

    const doJoin = () => {
      joinConversation(socket, activeConversationId, context);
      joinedRef.current = activeConversationId;
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.once("connect", doJoin);
    }

    return () => {
      socket.off("connect", doJoin);
    };
  }, [activeConversationId, context]);
}

export function disconnectChatSocket() {
  disconnectSocket();
}
