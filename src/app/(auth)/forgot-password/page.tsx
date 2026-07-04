"use client";

import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import "@/styles/auth.css";
import { requestPasswordReset } from "@/features/auth/api";
import { getPublicApiBaseUrl } from "@/lib/env";
import { ApiError } from "@/lib/api/errors";
import { toastApiError } from "@/lib/toasts";

const ForgetPassword = () => {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const tErrors = useTranslations("errors");

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailSchema = useMemo(
    () =>
      z.object({
        email: z.string().trim().email(tValidation("invalidEmail")),
      }),
    [tValidation],
  );

  const resetMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data) => {
      setSubmitted(true);
      toast.success(data.message || t("forgotPasswordSuccess"));
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.statusCode === 400 && error.fieldErrors?.length) {
        const emailErr = error.fieldErrors.find((item) => item.field === "email");
        if (emailErr) {
          setFieldError(emailErr.message);
          return;
        }
      }
      toastApiError(error);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError("");

    if (!getPublicApiBaseUrl()) {
      toast.error(tErrors("apiNotConfigured"), {
        description: tErrors("apiNotConfiguredDescription"),
      });
      return;
    }

    const parsed = emailSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.email?.[0] ?? tValidation("invalidEmail"));
      return;
    }

    resetMutation.mutate({ email: parsed.data.email.trim().toLowerCase() });
  };

  const pending = resetMutation.isPending;

  return (
    <section className="forgot-password">
      <div className="flex flex-col items-center justify-center text-white px-4">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/logo2.png"
            alt={tCommon("logoAlt")}
            width={48}
            height={48}
            priority
          />

          <h2 className="text-xl font-semibold text-white mt-6">
            {t("forgotPasswordTitle")}
          </h2>

          <p className="text-gray-400 mt-3 text-center text-sm max-w-sm leading-relaxed">
            {submitted ? t("forgotPasswordCheckEmail") : t("forgotPasswordEmailHint")}
          </p>
        </div>

        <div className="w-full max-w-sm">
          {submitted ? (
            <div className="rounded-2xl border border-[#1F1F1F] bg-[#1B1B1B] px-4 py-5 text-center">
              <p className="text-sm text-gray-300">{t("forgotPasswordCheckEmail")}</p>
              <Button asChild variant="outline" className="mt-5 w-full border-[#303030]">
                <Link href="/login">{t("backToLogin")}</Link>
              </Button>
            </div>
          ) : (
            <form className="flex flex-col space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <Label htmlFor="email" className="text-gray-300 text-xs">
                  {tCommon("email")}
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setFieldError("");
                    }}
                    className="pl-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                    aria-invalid={!!fieldError}
                    autoComplete="email"
                    disabled={pending}
                  />
                </div>
                {fieldError ? (
                  <p className="text-xs text-red-400 mt-1">{fieldError}</p>
                ) : null}
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                disabled={pending}
                className="mt-2 cursor-pointer w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-60"
              >
                {pending ? t("sendingResetLink") : t("sendResetLink")}
              </Button>
            </form>
          )}
        </div>

        {!submitted ? (
          <p className="mt-6 text-center text-xs text-gray-400">
            <Link href="/login" className="text-pink-500 hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default ForgetPassword;
