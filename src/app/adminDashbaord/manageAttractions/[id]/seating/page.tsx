"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDashboardPaths } from "@/features/dashboard/paths";

/** Seating template is edited on the attraction form — redirect old URLs. */
export default function ManageAttractionSeatingRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const paths = useDashboardPaths();

  useEffect(() => {
    if (!params.id) return;
    router.replace(paths.editAttraction(params.id));
  }, [params.id, paths, router]);

  return null;
}
