"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Image from "next/image";

import "@/styles/auth.css";
import Link from "next/link";
import { SignupPhoneField } from "@/components/signup-phone-field";
import type { Value } from "react-phone-number-input";
import { getPublicApiBaseUrl } from "@/lib/env";
import { signupFormSchema, signupValuesToRegisterBody } from "@/features/auth/schemas";
import { registerAccount } from "@/features/auth/api";
import { mapRegisterApiFieldErrors } from "@/features/auth/map-register-errors";
import { ApiError } from "@/lib/api/errors";
import { toastApiError } from "@/lib/toasts";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneE164: undefined as Value | undefined,
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof typeof formData, string>>
  >({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: registerAccount,
    onSuccess: (data) => {
      toast.success(data.message || "Registered successfully.");
      if (data.requireOtp && data.userId) {
        router.push(
          `/verify-otp?userId=${encodeURIComponent(data.userId)}&redirect=${encodeURIComponent(redirect)}`,
        );
        return;
      }
      toast.info("OTP not required — continuing to login might be needed.");
      router.push(
        `/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`,
      );
    },
    onError: (err: unknown) => {
      if (
        err instanceof ApiError &&
        err.statusCode === 400 &&
        err.fieldErrors?.length
      ) {
        const mapped = mapRegisterApiFieldErrors(err.fieldErrors);
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
          return;
        }
      }
      toastApiError(err);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    if (!getPublicApiBaseUrl()) {
      toast.error("API not configured", {
        description:
          "Set NEXT_PUBLIC_API_BASE_URL in .env.local (see .env.example).",
      });
      return;
    }

    const parsed = signupFormSchema.safeParse({
      ...formData,
      phoneE164: formData.phoneE164 ?? "",
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      const nested = flattened.fieldErrors;
      const next: Partial<Record<keyof typeof formData, string>> = {};
      if (nested.firstName?.[0]) next.firstName = nested.firstName[0];
      if (nested.lastName?.[0]) next.lastName = nested.lastName[0];
      if (nested.email?.[0]) next.email = nested.email[0];
      if (nested.password?.[0]) next.password = nested.password[0];
      if (nested.confirmPassword?.[0]) {
        next.confirmPassword = nested.confirmPassword[0];
      }
      if (nested.phoneE164?.[0]) next.phoneE164 = nested.phoneE164[0];
      setFieldErrors(next);
      return;
    }

    try {
      const body = signupValuesToRegisterBody(parsed.data);
      registerMutation.mutate(body);
    } catch {
      setFieldErrors((prev) => ({
        ...prev,
        phoneE164: "Could not read this phone number. Try again.",
      }));
    }
  };

  const pending = registerMutation.isPending;

  return (
    <section className="signup">
      <div className="flex flex-col items-center justify-center text-white px-4">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/logo2.png"
            alt="Logo"
            width={48}
            height={48}
            priority
          />
          <p className="text-gray-400 mt-3 text-center text-sm">
            Create your account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col space-y-4 w-full max-w-sm"
          noValidate
        >
          <div className="flex gap-2">
            <div className="w-1/2">
              <Label htmlFor="signup-firstName" className="text-gray-300 text-xs">
                First name
              </Label>
              <Input
                id="signup-firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value });
                  setFieldErrors((f) => ({ ...f, firstName: undefined }));
                }}
                className="bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500 mt-1"
                aria-invalid={!!fieldErrors.firstName}
                disabled={pending}
              />
              {fieldErrors.firstName ? (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.firstName}</p>
              ) : null}
            </div>
            <div className="w-1/2">
              <Label htmlFor="signup-lastName" className="text-gray-300 text-xs">
                Last name
              </Label>
              <Input
                id="signup-lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value });
                  setFieldErrors((f) => ({ ...f, lastName: undefined }));
                }}
                className="bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500 mt-1"
                aria-invalid={!!fieldErrors.lastName}
                disabled={pending}
              />
              {fieldErrors.lastName ? (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.lastName}</p>
              ) : null}
            </div>
          </div>

          <div>
            <Label htmlFor="signup-phone" className="text-gray-300 text-xs">
              Phone
            </Label>
            <SignupPhoneField
              id="signup-phone"
              className="mt-1"
              value={formData.phoneE164}
              onChange={(next) => {
                setFormData((prev) => ({ ...prev, phoneE164: next }));
                setFieldErrors((f) => ({ ...f, phoneE164: undefined }));
              }}
              disabled={pending}
              aria-invalid={!!fieldErrors.phoneE164}
            />
            <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
              Use your real number—we&apos;ll send a verification code (OTP) by SMS.
            </p>
            {fieldErrors.phoneE164 ? (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.phoneE164}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="signup-email" className="text-gray-300 text-xs">
              Email
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                id="signup-email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setFieldErrors((f) => ({ ...f, email: undefined }));
                }}
                className="pl-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                aria-invalid={!!fieldErrors.email}
                autoComplete="email"
                disabled={pending}
              />
            </div>
            {fieldErrors.email ? (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="signup-password" className="text-gray-300 text-xs">
              Password
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setFieldErrors((f) => ({
                    ...f,
                    password: undefined,
                    confirmPassword: undefined,
                  }));
                }}
                className="pl-10 pr-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                aria-invalid={!!fieldErrors.password}
                autoComplete="new-password"
                disabled={pending}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-pink-500 focus-visible:outline focus-visible:ring-2 focus-visible:ring-pink-600/40"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={pending}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="signup-confirmPassword" className="text-gray-300 text-xs">
              Confirm password
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <Input
                id="signup-confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  });
                  setFieldErrors((f) => ({
                    ...f,
                    confirmPassword: undefined,
                  }));
                }}
                className="pl-10 pr-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                aria-invalid={!!fieldErrors.confirmPassword}
                autoComplete="new-password"
                disabled={pending}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-pink-500 focus-visible:outline focus-visible:ring-2 focus-visible:ring-pink-600/40"
                onClick={() => setShowConfirmPassword((s) => !s)}
                aria-label={
                  showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                }
                disabled={pending}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword ? (
              <p className="text-xs text-red-400 mt-1">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            variant="default"
            size="lg"
            disabled={pending}
            className="mt-6 w-full bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-60"
          >
            {pending ? "Creating account..." : "Sign up"}
          </Button>

          <div className="text-center mt-4 social-login-divider">
            <span className="text-sm text-gray-500">Or continue with</span>
          </div>

          <div className="flex justify-center gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              className="bg-[#1F1F1F] border-[#303030] hover:bg-[#333] px-10 h-14"
              disabled={pending}
            >
              <Image
                src="/images/apple.png"
                alt="Apple"
                width={20}
                height={20}
                className="h-6"
              />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-[#1F1F1F] border-[#303030] hover:bg-[#333] px-10 h-14"
              disabled={pending}
            >
              <Image
                src="/images/google.png"
                alt="Google"
                width={20}
                height={20}
                className="h-6"
              />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-[#1F1F1F] border-[#303030] hover:bg-[#333] px-10 h-14"
              disabled={pending}
            >
              <Image
                src="/images/facebook.png"
                alt="Facebook"
                width={20}
                height={20}
                className="h-6"
              />
            </Button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Have an account?{" "}
            <Link
              href={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="text-pink-500 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
