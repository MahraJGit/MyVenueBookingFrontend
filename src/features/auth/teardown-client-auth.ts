import type { QueryClient } from "@tanstack/react-query";
import { disconnectChatSocket } from "@/features/chat/use-chat-socket";
import { resetAuthQueryCache } from "@/features/auth/auth-cache";
import { clearAuthSession } from "@/features/auth/session-storage";

export function teardownClientAuth(queryClient?: QueryClient) {
  clearAuthSession();
  disconnectChatSocket();
  if (queryClient) {
    resetAuthQueryCache(queryClient);
  }
}
