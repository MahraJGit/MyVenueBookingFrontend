import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { withTimezoneLabel } from "@/lib/timezones";

export type TicketPdfSeat = {
  id: string;
  qrToken: string;
  ticketName: string;
  fullName: string;
};

export type TicketPdfOrder = {
  orderCode: string;
  orderGroupId?: string;
  eventName: string;
  eventStartDateTime: string;
  eventEndDateTime?: string | null;
  timezone?: string | null;
  venueName: string | null;
  address: string | null;
  city: string;
  state: string | null;
  currency?: string;
  seats: TicketPdfSeat[];
};

const COLORS = {
  ink: [24, 24, 27] as const,
  muted: [82, 82, 91] as const,
  soft: [113, 113, 122] as const,
  line: [228, 228, 231] as const,
  paper: [255, 255, 255] as const,
  accent: [219, 39, 119] as const,
  accentDark: [157, 23, 77] as const,
  stub: [39, 39, 42] as const,
  stubText: [250, 250, 250] as const,
  badge: [253, 242, 248] as const,
};

function formatLocation(order: TicketPdfOrder) {
  const parts = [
    order.venueName,
    [order.address, order.city, order.state].filter(Boolean).join(", "),
  ].filter(Boolean);
  return parts.length ? parts.join("\n") : order.city;
}

function formatEventDate(iso: string, timeZone?: string | null) {
  try {
    const formatted = new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      dateStyle: "medium",
      timeStyle: "short",
      ...(timeZone ? { timeZone } : {}),
    });
    return withTimezoneLabel(formatted, timeZone);
  } catch {
    return iso;
  }
}

function formatTimeOnly(iso: string, timeZone?: string | null) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      ...(timeZone ? { timeZone } : {}),
    });
  } catch {
    return "";
  }
}

function safeFilePart(value: string) {
  return value.replace(/[^\w\-]+/g, "_").slice(0, 48);
}

function shortId(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function drawDashedLine(
  doc: jsPDF,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: readonly [number, number, number],
) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  const dash = 4;
  const gap = 3;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const steps = Math.floor(len / (dash + gap));
  const ux = dx / len;
  const uy = dy / len;
  for (let i = 0; i < steps; i += 1) {
    const sx = x1 + ux * i * (dash + gap);
    const sy = y1 + uy * i * (dash + gap);
    doc.line(sx, sy, sx + ux * dash, sy + uy * dash);
  }
}

function drawLabelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.soft);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.ink);
  const lines = doc.splitTextToSize(value, maxWidth);
  doc.text(lines, x, y + 14);
  return y + 14 + lines.length * 13;
}

async function drawTicketPage(
  doc: jsPDF,
  order: TicketPdfOrder,
  seat: TicketPdfSeat,
  index: number,
  total: number,
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setFillColor(244, 244, 245);
  doc.rect(0, 0, pageW, pageH, "F");

  const cardX = 36;
  const cardY = 72;
  const cardW = pageW - 72;
  const cardH = 420;
  const stubW = 118;
  const radius = 14;

  doc.setFillColor(228, 228, 231);
  doc.roundedRect(cardX + 3, cardY + 5, cardW, cardH, radius, radius, "F");

  doc.setFillColor(...COLORS.paper);
  doc.roundedRect(cardX, cardY, cardW, cardH, radius, radius, "F");

  doc.setFillColor(...COLORS.stub);
  doc.roundedRect(cardX, cardY, stubW + radius, cardH, radius, radius, "F");
  doc.setFillColor(...COLORS.stub);
  doc.rect(cardX + stubW, cardY, radius, cardH, "F");

  doc.setTextColor(...COLORS.stubText);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ADMIT ONE", cardX + stubW / 2, cardY + 42, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("SEAT", cardX + stubW / 2, cardY + 88, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(String(index), cardX + stubW / 2, cardY + 122, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`OF ${total}`, cardX + stubW / 2, cardY + 142, { align: "center" });

  doc.setFontSize(7.5);
  doc.text("TICKET TYPE", cardX + stubW / 2, cardY + 190, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const stubType = doc.splitTextToSize(seat.ticketName, stubW - 24);
  doc.text(stubType, cardX + stubW / 2, cardY + 208, {
    align: "center",
    maxWidth: stubW - 24,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("ORDER", cardX + stubW / 2, cardY + 280, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(order.orderCode, cardX + stubW / 2, cardY + 296, {
    align: "center",
    maxWidth: stubW - 20,
  });

  const perfX = cardX + stubW;
  drawDashedLine(doc, perfX, cardY + 18, perfX, cardY + cardH - 18, [161, 161, 170]);
  doc.setFillColor(244, 244, 245);
  doc.circle(perfX, cardY, 10, "F");
  doc.circle(perfX, cardY + cardH, 10, "F");

  const bodyX = perfX + 8;
  const bodyW = cardW - stubW - 8;
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(cardX + stubW, cardY, cardW - stubW, 18, radius, radius, "F");
  doc.setFillColor(...COLORS.paper);
  doc.rect(cardX + stubW, cardY + 10, cardW - stubW, 12, "F");

  const contentX = bodyX + 18;
  const contentRight = cardX + cardW - 28;
  let y = cardY + 38;

  doc.setFillColor(...COLORS.badge);
  doc.roundedRect(contentX, y - 12, 92, 20, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.accentDark);
  doc.text("EVENT TICKET", contentX + 10, y + 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Ticket ID  ${shortId(seat.id)}`, contentRight, y + 1, {
    align: "right",
  });

  y += 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.ink);
  const titleLines = doc.splitTextToSize(order.eventName, bodyW - 170);
  doc.text(titleLines, contentX, y);
  const titleBottom = y + titleLines.length * 22;

  const qrSize = 118;
  const qrBox = 136;
  const qrPanelX = contentRight - qrBox;
  const qrPanelY = cardY + 56;
  doc.setDrawColor(...COLORS.line);
  doc.setFillColor(250, 250, 250);
  doc.setLineWidth(1);
  doc.roundedRect(qrPanelX, qrPanelY, qrBox, qrBox + 28, 10, 10, "FD");

  const qrDataUrl = await QRCode.toDataURL(seat.qrToken, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: { dark: "#18181b", light: "#ffffff" },
  });
  doc.addImage(
    qrDataUrl,
    "PNG",
    qrPanelX + (qrBox - qrSize) / 2,
    qrPanelY + 10,
    qrSize,
    qrSize,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.soft);
  doc.text("Scan at entrance", qrPanelX + qrBox / 2, qrPanelY + qrBox + 16, {
    align: "center",
  });

  const detailsMaxW = qrPanelX - contentX - 18;
  y = Math.max(titleBottom + 18, qrPanelY + 8);

  y = drawLabelValue(doc, "Guest", seat.fullName || "Guest", contentX, y, detailsMaxW);
  y += 14;
  y = drawLabelValue(doc, "Ticket type", seat.ticketName, contentX, y, detailsMaxW);
  y += 14;
  y = drawLabelValue(
    doc,
    "Date & time",
    formatEventDate(order.eventStartDateTime, order.timezone),
    contentX,
    y,
    detailsMaxW,
  );

  if (order.eventEndDateTime) {
    const end = formatTimeOnly(order.eventEndDateTime, order.timezone);
    if (end) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.muted);
      doc.text(`Ends ${withTimezoneLabel(end, order.timezone)}`, contentX, y + 4);
      y += 16;
    }
  }

  y += 14;
  drawLabelValue(doc, "Venue", formatLocation(order), contentX, y, detailsMaxW);

  const metaY = cardY + cardH - 52;
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.7);
  doc.line(contentX, metaY, contentRight, metaY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.soft);
  doc.text("ORDER CODE", contentX, metaY + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.ink);
  doc.text(order.orderCode, contentX, metaY + 32);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.soft);
  doc.text("VALID FOR", contentX + detailsMaxW / 2, metaY + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.ink);
  doc.text("Single entry", contentX + detailsMaxW / 2, metaY + 32);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.soft);
  doc.text("ISSUED BY", contentRight, metaY + 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.ink);
  doc.text("MyVenueBooking", contentRight, metaY + 32, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.soft);
  doc.text(
    "Present this ticket at the entrance. Each QR code can be used once.",
    pageW / 2,
    cardY + cardH + 28,
    { align: "center" },
  );
  doc.text(`Ticket ${index} of ${total}`, pageW / 2, cardY + cardH + 44, {
    align: "center",
  });
}

async function buildSeatPdfBytes(
  order: TicketPdfOrder,
  seat: TicketPdfSeat,
  index: number,
  total: number,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  await drawTicketPage(doc, order, seat, index, total);
  return doc.output("arraybuffer") as ArrayBuffer;
}

/** CRC32 for ZIP local/central headers (STORE method). */
function crc32(buf: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number) {
  const b = new Uint8Array(2);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  return b;
}

function u32(n: number) {
  const b = new Uint8Array(4);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  b[2] = (n >>> 16) & 0xff;
  b[3] = (n >>> 24) & 0xff;
  return b;
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Minimal ZIP writer (STORE / no compression) — enough for PDF bundles. */
function createZip(files: Array<{ name: string; data: Uint8Array }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    const localHeader = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
    ]);

    localParts.push(localHeader, file.data);

    const centralHeader = concatBytes([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    centralParts.push(centralHeader);

    offset += localHeader.length + size;
  }

  const central = concatBytes(centralParts);
  const end = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ]);

  return concatBytes([...localParts, central, end]);
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Builds one PDF per seat and downloads them together:
 * - 1 seat → single PDF
 * - 2+ seats → ZIP of separate PDFs
 */
export async function downloadTicketPdfs(order: TicketPdfOrder) {
  if (order.seats.length === 0) {
    throw new Error("NO_TICKETS");
  }

  const total = order.seats.length;
  const orderPart = safeFilePart(order.orderCode);

  if (total === 1) {
    const bytes = await buildSeatPdfBytes(order, order.seats[0], 1, 1);
    triggerBlobDownload(
      new Blob([bytes], { type: "application/pdf" }),
      `${orderPart}_ticket-1.pdf`,
    );
    return;
  }

  const files: Array<{ name: string; data: Uint8Array }> = [];
  for (let i = 0; i < total; i += 1) {
    const bytes = await buildSeatPdfBytes(order, order.seats[i], i + 1, total);
    files.push({
      name: `${orderPart}_ticket-${i + 1}-of-${total}.pdf`,
      data: new Uint8Array(bytes),
    });
  }

  const zipBytes = createZip(files);
  triggerBlobDownload(
    new Blob([zipBytes], { type: "application/zip" }),
    `${orderPart}_tickets.zip`,
  );
}

export function flattenOrderSeats(
  items: Array<{
    ticketName: string;
    tickets?: Array<{
      id: string;
      qrToken: string;
      fullName: string;
      checkedIn: boolean;
      checkInTime: string | null;
    }>;
  }>,
): TicketPdfSeat[] {
  return items.flatMap((item) =>
    (item.tickets ?? []).map((ticket) => ({
      id: ticket.id,
      qrToken: ticket.qrToken,
      ticketName: item.ticketName,
      fullName: ticket.fullName,
    })),
  );
}
