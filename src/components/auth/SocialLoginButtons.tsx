"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api/client";
import { OAUTH_PROVIDERS, type OAuthProviderId } from "@/features/auth/oauth/providers";
import { startOAuthLogin } from "@/features/auth/oauth/start-oauth";

type OAuthProvidersResponse = {
  providers: OAuthProviderId[];
};

type SocialLoginButtonsProps = {
  redirectPath?: string;
  disabled?: boolean;
};

export function SocialLoginButtons({
  redirectPath = "/",
  disabled = false,
}: SocialLoginButtonsProps) {
  const t = useTranslations("auth");
  const [configuredProviders, setConfiguredProviders] = useState<OAuthProviderId[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiGet<OAuthProvidersResponse>("/api/auth/providers")
      .then((data) => {
        if (!cancelled) {
          setConfiguredProviders(data.providers);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfiguredProviders([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProviders = OAUTH_PROVIDERS.filter((provider) => {
    if (!provider.enabled) return false;
    // While loading, or if the API returns empty (e.g. backend not restarted
    // after adding OAuth env vars), still show enabled providers.
    if (configuredProviders === null || configuredProviders.length === 0) {
      return true;
    }
    return configuredProviders.includes(provider.id);
  });

  if (visibleProviders.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-sm mx-auto mt-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#303030]" aria-hidden />
        <span className="shrink-0 text-xs text-gray-500">{t("orContinueWith")}</span>
        <div className="h-px flex-1 bg-[#303030]" aria-hidden />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {visibleProviders.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className="h-12 w-full gap-3 border-[#303030] bg-[#1F1F1F] hover:bg-[#333]"
            disabled={disabled}
            onClick={() => startOAuthLogin(provider.id, redirectPath)}
          >
            <Image
              src={provider.icon}
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 shrink-0"
              aria-hidden
            />
            <span className="text-sm text-gray-200">
              {t("continueWithProvider", { provider: t(provider.labelKey) })}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
