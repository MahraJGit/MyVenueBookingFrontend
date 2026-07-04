"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import "@/styles/auth.css";
import { resetPassword } from "@/features/auth/api";
import { createResetPasswordFormSchema } from "@/features/auth/reset-password-schema";
import { getPublicApiBaseUrl } from "@/lib/env";
import { ApiError } from "@/lib/api/errors";
import { toastApiError } from "@/lib/toasts";

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const tErrors = useTranslations("errors");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const resetPasswordSchema = useMemo(
    () => createResetPasswordFormSchema(tValidation),
    [tValidation],
  );

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      toast.success(data.message || t("passwordResetSuccess"));
      router.replace("/login");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.fieldErrors?.length) {
        const next: typeof fieldErrors = {};
        for (const item of error.fieldErrors) {
          if (item.field === "password") next.password = item.message;
          if (item.field === "confirmPassword") next.confirmPassword = item.message;
        }
        if (Object.keys(next).length > 0) {
          setFieldErrors(next);
          return;
        }
      }
      toastApiError(error);
    },
  });

  const pending = resetMutation.isPending;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    if (!token) {
      toast.error(t("resetPasswordMissingToken"));
      return;
    }

    if (!getPublicApiBaseUrl()) {
      toast.error(tErrors("apiNotConfigured"), {
        description: tErrors("apiNotConfiguredDescription"),
      });
      return;
    }

    const parsed = resetPasswordSchema.safeParse({
      password: newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        password: flattened.password?.[0],
        confirmPassword: flattened.confirmPassword?.[0],
      });
      return;
    }

    resetMutation.mutate({
      token,
      password: parsed.data.password,
    });
  };

  if (!token) {
    return (
      <section className="set-password">
        <div className="flex flex-col items-center justify-center text-white px-4 py-24 text-center">
          <p className="text-sm text-gray-400 max-w-sm">{t("resetPasswordMissingToken")}</p>
          <Button asChild variant="outline" className="mt-6 border-[#303030]">
            <Link href="/forgot-password">{t("sendResetLink")}</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="set-password">
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
            {t("resetPassword")}
          </h2>
          <p className="text-gray-400 mt-3 text-center text-sm max-w-xs leading-relaxed">
            {t("resetPasswordHint")}
          </p>
        </div>

        <form
          className="flex flex-col space-y-4 max-w-sm mx-auto w-full text-gray-400"
          onSubmit={handleSubmit}
          noValidate
        >
          <div>
            <Label htmlFor="newPassword" className="text-gray-300 text-xs">
              {t("newPassword")}
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                }}
                className="pl-10 pr-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                aria-invalid={!!fieldErrors.password}
                autoComplete="new-password"
                disabled={pending}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-pink-500"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-gray-300 text-xs">
              {t("reenterNewPassword")}
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                }}
                className="pl-10 pr-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                aria-invalid={!!fieldErrors.confirmPassword}
                autoComplete="new-password"
                disabled={pending}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-pink-500"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={
                  showConfirmPassword ? t("hideConfirmPassword") : t("showConfirmPassword")
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword ? (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmPassword}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            variant="default"
            size="lg"
            disabled={pending}
            className="mt-2 cursor-pointer w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-60"
          >
            {pending ? t("resettingPassword") : t("resetPassword")}
          </Button>

          <p className="text-center text-xs text-gray-400 mt-4">
            {t("rememberPassword")}{" "}
            <Link href="/login" className="text-pink-500 hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default ResetPassword;
