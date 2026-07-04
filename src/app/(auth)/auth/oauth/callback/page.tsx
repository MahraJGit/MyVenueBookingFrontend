"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { restoreAuthSession } from "@/features/auth/restore-session";
import { sanitizeInternalRedirect } from "@/lib/proxy/route-config";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function completeOAuth() {
      const restored = await restoreAuthSession();
      if (cancelled) return;

      if (!restored) {
        setFailed(true);
        toast.error(t("oauthCallbackFailed"));
        router.replace("/login");
        return;
      }

      const redirect =
        sanitizeInternalRedirect(searchParams.get("redirect")) ?? "/";
      router.replace(redirect);
    }

    void completeOAuth();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams, t]);

  return (
    <section className="verify-otp min-h-[50vh] flex items-center justify-center">
      <p className="text-sm text-gray-400">
        {failed ? t("oauthCallbackFailed") : t("oauthCompletingSignIn")}
      </p>
    </section>
  );
}
