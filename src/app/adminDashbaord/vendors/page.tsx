import { redirect } from "next/navigation";

export default function AdminVendorsRedirectPage() {
  redirect("/adminDashbaord/vendorRequests");
}
