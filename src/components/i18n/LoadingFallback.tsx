"use client";

import { useTranslations } from "next-intl";

type LoadingFallbackProps = {
  className?: string;
  message?: "loading" | "loadingVerification";
};

export function LoadingFallback({
  className,
  message = "loading",
}: LoadingFallbackProps) {
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const text =
    message === "loadingVerification"
      ? tAuth("loadingVerification")
      : tCommon("loading");

  return <div className={className}>{text}</div>;
}
