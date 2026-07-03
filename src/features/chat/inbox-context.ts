export type ChatInboxContext = "buyer" | "vendor" | "admin";

export const CHAT_INBOX_CONTEXTS: ChatInboxContext[] = [
  "buyer",
  "vendor",
  "admin",
];

export function participantRoleForContext(context: ChatInboxContext): string {
  switch (context) {
    case "buyer":
      return "BUYER";
    case "vendor":
      return "VENDOR";
    case "admin":
      return "ADMIN";
  }
}

export function inboxContextFromBasePath(basePath: string): ChatInboxContext {
  if (basePath.startsWith("/vendorDashboard")) return "vendor";
  if (basePath.startsWith("/adminDashbaord")) return "admin";
  return "buyer";
}
