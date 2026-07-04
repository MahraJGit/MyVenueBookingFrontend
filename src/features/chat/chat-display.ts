type ConversationLike = {
  type: string;
  title: string | null;
};

export function getConversationTitle(
  conversation: ConversationLike,
  viewerRole: string | undefined,
  t: (key: "conversation" | "adminSupportTitle" | "unknownVendor") => string,
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

  return conversation.title ?? t("conversation");
}

export function getConversationTypeLabel(
  type: string,
  viewerRole: string | undefined,
  t: (key: "conversation" | "typeBooking" | "typeTicket" | "typeSupport" | "typeAdminSupport") => string,
): string | null {
  if (type === "BOOKING") return t("typeBooking");
  if (type === "TICKET_ORDER") return t("typeTicket");
  if (type === "VENDOR_SUPPORT") {
    if (viewerRole === "VENDOR") return t("typeAdminSupport");
    if (viewerRole === "ADMIN") return null;
    return t("typeSupport");
  }
  return t("conversation");
}
