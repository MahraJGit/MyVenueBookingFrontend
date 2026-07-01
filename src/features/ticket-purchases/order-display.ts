import type {
  MyTicketOrder,
  TicketAttendancePhase,
  TicketPaymentStatus,
} from "./api";

type TicketStatusTranslator = (
  key:
    | "ticketStatusPaymentPending"
    | "ticketStatusCanceled"
    | "ticketStatusGoing"
    | "ticketStatusAttended",
) => string;

export function ticketStatusBadgeClass(
  attendancePhase: TicketAttendancePhase,
  paymentStatus: TicketPaymentStatus,
): string {
  if (paymentStatus === "pending") {
    return "border-yellow-500 text-yellow-500";
  }
  if (attendancePhase === "canceled" || paymentStatus === "canceled") {
    return "border-red-500 text-red-500";
  }
  if (attendancePhase === "upcoming") {
    return "border-green-500 text-green-500";
  }
  return "border-zinc-500 text-zinc-400";
}

export function getTicketStatusLabel(
  order: Pick<MyTicketOrder, "attendancePhase" | "paymentStatus">,
  t: TicketStatusTranslator,
): string {
  if (order.paymentStatus === "pending") {
    return t("ticketStatusPaymentPending");
  }
  if (order.attendancePhase === "canceled" || order.paymentStatus === "canceled") {
    return t("ticketStatusCanceled");
  }
  if (order.attendancePhase === "upcoming") {
    return t("ticketStatusGoing");
  }
  return t("ticketStatusAttended");
}

export function filterOrdersByTab(
  orders: MyTicketOrder[],
  tab: "all" | TicketAttendancePhase,
): MyTicketOrder[] {
  if (tab === "all") return orders;
  return orders.filter((order) => order.attendancePhase === tab);
}

export function countOrdersByTab(orders: MyTicketOrder[]) {
  return {
    all: orders.length,
    upcoming: orders.filter((o) => o.attendancePhase === "upcoming").length,
    attended: orders.filter((o) => o.attendancePhase === "attended").length,
    canceled: orders.filter((o) => o.attendancePhase === "canceled").length,
  };
}
