export type ChatParticipant = {
  userId: string;
  role: string;
  lastReadAt: string | null;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
  };
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
  };
};

export type ConversationSummary = {
  id: string;
  type: "BOOKING" | "TICKET_ORDER" | "VENDOR_SUPPORT";
  title: string | null;
  status: string;
  lastMessageAt: string | null;
  unreadCount: number;
  lastMessage: ChatMessage | null;
  participants: ChatParticipant[];
  bookingId: string | null;
  orderGroupId: string | null;
  vendorId: string | null;
};

export type ConversationDetail = {
  id: string;
  type: ConversationSummary["type"];
  title: string | null;
  status: string;
  lastMessageAt: string | null;
  participants: ChatParticipant[];
  bookingId: string | null;
  orderGroupId: string | null;
  vendorId: string | null;
  myLastReadAt: string | null;
};
