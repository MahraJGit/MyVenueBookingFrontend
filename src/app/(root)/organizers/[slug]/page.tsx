"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { VendorProfileView } from "@/components/vendors/VendorProfileView";
import { getPublicOrganizerProfile } from "@/features/vendor/api";

export default function OrganizerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations("organizer");
  const profileQuery = useQuery({
    queryKey: ["public-organizer", slug],
    queryFn: () => getPublicOrganizerProfile(slug),
  });

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-zinc-400">{t("notFound")}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <VendorProfileView profile={profileQuery.data} />
      </div>
    </main>
  );
}
