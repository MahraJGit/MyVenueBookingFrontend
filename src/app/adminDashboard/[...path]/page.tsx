import { redirect } from "next/navigation";

/** Backend notifications use /adminDashboard/* — redirect to actual adminDashbaord routes */
export default async function AdminDashboardAlias({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const segment = path?.join("/") ?? "";

  const map: Record<string, string> = {
    venueReviews: "/adminDashbaord/venueReviews",
    manageVenues: "/adminDashbaord/manageVenues",
    bookings: "/adminDashbaord/venueBookings",
  };

  redirect(map[segment] ?? "/adminDashbaord/venueReviews");
}
