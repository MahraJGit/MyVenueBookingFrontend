"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Link2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { linkOAuthAccount } from "@/features/auth/api";
import { useAuth } from "@/features/auth/auth-context";
import { sanitizeInternalRedirect } from "@/lib/proxy/route-config";
import { toastApiError } from "@/lib/toasts";
import "@/styles/auth.css";

export default function LinkAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { establishSession } = useAuth();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");

  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";
  const redirect = sanitizeInternalRedirect(searchParams.get("redirect")) ?? "/";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const canSubmit = useMemo(() => Boolean(token && password), [token, password]);

  const linkMutation = useMutation({
    mutationFn: linkOAuthAccount,
    onSuccess: (data) => {
      if ("requireOtp" in data && data.requireOtp && data.userId) {
        router.replace(
          `/verify-otp?userId=${encodeURIComponent(data.userId)}&redirect=${encodeURIComponent(data.redirect ?? redirect)}&channel=email`,
        );
        return;
      }

      if ("accessToken" in data && data.accessToken && data.user) {
        establishSession({
          accessToken: data.accessToken,
          user: data.user,
        });
        toast.success(t("oauthLinkSuccess"));
        router.replace(data.redirect ?? redirect);
        return;
      }

      toast.error(t("oauthLinkFailed"));
    },
    onError: (error) => {
      toastApiError(error);
    },
  });

  const pending = linkMutation.isPending;

  if (!token) {
    return (
      <section className="login">
        <div className="flex flex-col items-center justify-center text-white px-4">
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/images/logo2.png"
              alt={tCommon("logoAlt")}
              width={48}
              height={48}
              priority
            />
            <h2 className="text-xl font-semibold text-white mt-6 text-center">
              {t("oauthLinkExpiredTitle")}
            </h2>
            <p className="text-gray-400 mt-3 text-center text-sm max-w-sm leading-relaxed">
              {t("oauthLinkExpired")}
            </p>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-[#1F1F1F] bg-[#1B1B1B] px-4 py-5 text-center">
            <Button asChild className="w-full bg-pink-600 hover:bg-pink-700 text-white">
              <Link href="/login">{t("backToLogin")}</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="login">
      <div className="flex flex-col items-center justify-center text-white px-4">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/logo2.png"
            alt={tCommon("logoAlt")}
            width={48}
            height={48}
            priority
          />
          <h2 className="text-xl font-semibold text-white mt-6 text-center">
            {t("oauthLinkTitle")}
          </h2>
          <p className="text-gray-400 mt-3 text-center text-sm max-w-sm leading-relaxed">
            {t("oauthLinkSubtitle")}
          </p>
        </div>

        <div className="w-full max-w-sm mb-6 rounded-2xl border border-[#1F1F1F] bg-[#1B1B1B] p-4">
          <div className="flex items-center justify-center gap-3 text-sm text-gray-300">
            <div className="flex items-center gap-2 rounded-full border border-[#303030] bg-[#242424] px-3 py-1.5">
              <Image src="/images/google.png" alt="" width={18} height={18} aria-hidden />
              <span>{t("socialGoogle")}</span>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-pink-500" aria-hidden />
            <div className="flex items-center gap-2 rounded-full border border-[#303030] bg-[#242424] px-3 py-1.5">
              <Link2 className="h-4 w-4 text-pink-500" aria-hidden />
              <span>{t("account")}</span>
            </div>
          </div>

          <div className="mt-5">
            <Label htmlFor="link-email-readonly" className="text-gray-300 text-xs">
              {t("oauthLinkExistingAccount")}
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                id="link-email-readonly"
                type="email"
                value={email}
                readOnly
                tabIndex={-1}
                className="pl-10 bg-[#242424] border border-[#303030] text-gray-200 cursor-default"
              />
            </div>
          </div>
        </div>

        <form
          className="w-full max-w-sm space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setFieldError("");

            if (!password) {
              setFieldError(tValidation("passwordRequired"));
              return;
            }

            linkMutation.mutate({ token, password });
          }}
        >
          <div>
            <Label htmlFor="link-password" className="text-gray-300 text-xs">
              {t("password")}
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none z-10" />
              <Input
                id="link-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldError("");
                }}
                className="pl-10 pr-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                autoComplete="current-password"
                disabled={pending}
                aria-invalid={!!fieldError}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-pink-500 focus-visible:outline focus-visible:ring-2 focus-visible:ring-pink-600/40"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                disabled={pending}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
            {fieldError ? <p className="text-xs text-red-400 mt-1">{fieldError}</p> : null}
            <p className="text-[11px] text-gray-500 mt-2 leading-snug">{t("oauthLinkPasswordHint")}</p>
          </div>

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="mt-2 w-full bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-60"
            disabled={!canSubmit || pending}
          >
            {pending ? t("oauthLinking") : t("oauthLinkConfirm")}
          </Button>

          <p className="text-center text-xs text-gray-400 pt-1">
            <Link href="/login" className="text-pink-500 hover:underline">
              {t("oauthLinkCancel")}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
