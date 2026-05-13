"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import "@/styles/auth.css";
import { getPublicApiBaseUrl } from "@/lib/env";
import { ApiError } from "@/lib/api/errors";
import { toastApiError } from "@/lib/toasts";
import { resendOtp, verifyOtp } from "@/features/auth/api";
import { persistAuthSession } from "@/features/auth/session-storage";

const RESEND_COOLDOWN_SECONDS = 30;

export function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const redirect = searchParams.get("redirect") || "/";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpInlineError, setOtpInlineError] = useState("");
  const [cooldownSec, setCooldownSec] = useState(0);
  const [resendInlineError, setResendInlineError] = useState("");

  useEffect(() => {
    setOtpInlineError("");
  }, [otp]);

  useEffect(() => {
    if (!userIdParam) {
      setCooldownSec(0);
      return;
    }
    setCooldownSec(RESEND_COOLDOWN_SECONDS);
  }, [userIdParam]);

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const id = window.setTimeout(() => {
      setCooldownSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [cooldownSec]);

  const verifyMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      persistAuthSession({
        accessToken: data.accessToken,
        user: data.user,
      });
      toast.success(data.message || "You're verified!", {
        description: `Signed in as ${data.user.email}`,
      });
      router.replace(redirect);
    },
    onError: (err: unknown) => {
      toastApiError(err);
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendOtp,
    onMutate: () => {
      setResendInlineError("");
    },
    onSuccess: (data) => {
      toast.success(data.message || "A new verification code was sent.");
      setOtp(["", "", "", "", "", ""]);
      setOtpInlineError("");
      setCooldownSec(RESEND_COOLDOWN_SECONDS);
      requestAnimationFrame(() => {
        document.getElementById("otp-0")?.focus();
      });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.statusCode === 429) {
        setResendInlineError(err.message);
        return;
      }
      toastApiError(err);
    },
  });

  const otpString = otp.join("");
  const isOtpComplete = otpString.length === 6 && /^\d{6}$/.test(otpString);

  const setDigitAt = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const copy = [...prev];
      copy[index] = digit;
      return copy;
    });
    if (digit && index < 5) {
      requestAnimationFrame(() => {
        document.getElementById(`otp-${index + 1}`)?.focus();
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    setDigitAt(index, e.target.value);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      e.preventDefault();
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLFormElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const chars = digits.split("");
    setOtp((prev) =>
      [...Array(6)].map((_, i) => chars[i] ?? prev[i] ?? ""),
    );
    const focusIndex = Math.min(chars.length || 5, 5);
    requestAnimationFrame(() => {
      document.getElementById(`otp-${focusIndex}`)?.focus();
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userIdParam) return;

    if (!getPublicApiBaseUrl()) {
      toast.error("API not configured", {
        description:
          "Set NEXT_PUBLIC_API_BASE_URL in .env.local (see .env.example).",
      });
      return;
    }

    if (!isOtpComplete) {
      setOtpInlineError(
        "Enter all 6 digits from your SMS (you can paste the full code).",
      );
      return;
    }

    verifyMutation.mutate({ userId: userIdParam, otp: otpString });
  };

  const handleResend = () => {
    if (!userIdParam) return;

    if (!getPublicApiBaseUrl()) {
      toast.error("API not configured", {
        description:
          "Set NEXT_PUBLIC_API_BASE_URL in .env.local (see .env.example).",
      });
      return;
    }

    if (cooldownSec > 0 || resendMutation.isPending || verifyMutation.isPending) {
      return;
    }

    resendMutation.mutate({ userId: userIdParam });
  };

  const pending = verifyMutation.isPending;
  const resendPending = resendMutation.isPending;
  const resendDisabled =
    cooldownSec > 0 || resendPending || pending;

  if (!userIdParam) {
    return (
      <section className="verify-otp">
        <div className="flex flex-col items-center justify-center text-white px-4 py-24 max-w-xs mx-auto text-center">
          <p className="text-gray-300 text-sm">
            Verification needs a signup session (missing{" "}
            <code className="text-xs text-gray-500">userId</code>
            ). Complete registration first—we&apos;ll send an OTP next.
          </p>
          <Button asChild variant="outline" className="mt-6 border-[#303030]">
            <Link
              href={`/signup${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
            >
              Back to sign up
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="verify-otp">
      <div className="flex flex-col items-center justify-center text-white px-4">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/logo2.png"
            alt="Logo"
            width={48}
            height={48}
            priority
          />
          <h2 className="text-xl font-semibold text-white mt-6">
            Verify your account
          </h2>
          <p className="text-gray-400 mt-3 text-center text-sm max-w-xs leading-relaxed">
            Enter the 6-digit code we sent to your phone via SMS.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          onPaste={handlePaste}
          className="w-full max-w-xs"
        >
          <div className="flex gap-2 mt-6 justify-center">
            {otp.map((digit, index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                maxLength={1}
                disabled={pending}
                className="bg-[#242424] border border-[#242424] text-white text-center placeholder:text-gray-500 w-12 h-12 text-lg"
                aria-label={`Digit ${index + 1} of 6`}
              />
            ))}
          </div>
          {otpInlineError ? (
            <p
              className="text-xs text-red-400 text-center mt-3 max-w-xs mx-auto leading-snug"
              role="alert"
            >
              {otpInlineError}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col items-center gap-1">
            <Button
              type="button"
              variant="link"
              size="sm"
              disabled={resendDisabled}
              onClick={handleResend}
              aria-busy={resendPending}
              aria-disabled={resendDisabled}
              className="h-auto min-h-0 p-0 text-sm font-medium text-pink-500 hover:text-pink-400 disabled:opacity-50 disabled:no-underline"
            >
              {resendPending
                ? "Sending code…"
                : cooldownSec > 0
                  ? `Resend code in ${cooldownSec}s`
                  : "Resend code"}
            </Button>
            <span className="sr-only" aria-live="polite">
              {cooldownSec > 0
                ? `You can resend the code in ${cooldownSec} seconds.`
                : "You can resend the verification code now."}
            </span>
            <p className="text-center text-xs text-gray-500 max-w-xs leading-snug">
              Didn&apos;t get the SMS? You can request a new code after the timer.
              Standard message rates may apply.
            </p>
            {resendInlineError ? (
              <p
                className="text-xs text-amber-400/95 text-center max-w-xs leading-snug"
                role="status"
              >
                {resendInlineError}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            variant="default"
            size="lg"
            disabled={pending || !isOtpComplete}
            className="mt-6 cursor-pointer w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50"
          >
            {pending ? "Verifying..." : "Verify code"}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Wrong number?{" "}
          <Link
            href={`/signup${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
            className="text-pink-500 hover:underline"
          >
            Back to sign up
          </Link>
        </p>
      </div>
    </section>
  );
}
