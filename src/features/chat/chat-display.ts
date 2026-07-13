type ConversationLike = {
  type: string;
  title: string | null;
};

type ChatTitleKey =
  | "conversation"
  | "adminSupportTitle"
  | "unknownVendor"
  | "bookingTitle"
  | "ticketsTitle"
  | "supportTitle";

type ChatTypeKey =
  | "conversation"
  | "typeBooking"
  | "typeTicket"
  | "typeSupport"
  | "typeAdminSupport"
  | "typeVendorSupport"
  | "typeBuyerBooking"
  | "typeBuyerTicket";

export function getConversationTitle(
  conversation: ConversationLike,
  viewerRole: string | undefined,
  t: (key: ChatTitleKey, values?: Record<string, string>) => string,
): string {
  if (conversation.type === "VENDOR_SUPPORT") {
    if (viewerRole === "VENDOR") {
      return t("adminSupportTitle");
    }
    if (viewerRole === "ADMIN") {
      const raw = conversation.title ?? "";
      const vendorName = raw.replace(/^Support:\s*/i, "").trim();
      return vendorName || t("unknownVendor");
    }
  }

  const raw = conversation.title?.trim();
  if (!raw) return t("conversation");

  const bookingMatch = raw.match(/^Booking:\s*(.+)$/i);
  if (bookingMatch?.[1]) {
    return t("bookingTitle", { name: bookingMatch[1].trim() });
  }

  const ticketsMatch = raw.match(/^Tickets:\s*(.+)$/i);
  if (ticketsMatch?.[1]) {
    return t("ticketsTitle", { name: ticketsMatch[1].trim() });
  }

  const supportMatch = raw.match(/^Support:\s*(.+)$/i);
  if (supportMatch?.[1]) {
    return t("supportTitle", { name: supportMatch[1].trim() });
  }

  return raw;
}

export function getConversationTypeLabel(
  type: string,
  viewerRole: string | undefined,
  t: (key: ChatTypeKey) => string,
): string | null {
  if (type === "BOOKING") {
    return viewerRole === "ADMIN" ? t("typeBuyerBooking") : t("typeBooking");
  }
  if (type === "TICKET_ORDER") {
    return viewerRole === "ADMIN" ? t("typeBuyerTicket") : t("typeTicket");
  }
  if (type === "VENDOR_SUPPORT") {
    if (viewerRole === "VENDOR") return t("typeAdminSupport");
    if (viewerRole === "ADMIN") return t("typeVendorSupport");
    return t("typeSupport");
  }
  return t("conversation");
}
