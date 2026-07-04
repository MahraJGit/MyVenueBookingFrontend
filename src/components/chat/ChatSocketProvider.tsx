"use client";

import { type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatSocketConnection } from "@/features/chat/use-chat-socket";

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  useChatSocketConnection(queryClient);
  return children;
}
