"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Image from "next/image";

import "@/styles/auth.css";
import Link from "next/link";
import type { Value } from "react-phone-number-input";
import { SignupPhoneField } from "@/components/signup-phone-field";
import { getPublicApiBaseUrl } from "@/lib/env";
import {
    emailLoginFormSchema,
    phoneLoginFormSchema,
    phoneLoginToRequestBody,
} from "@/features/auth/login-schemas";
import { loginAccount } from "@/features/auth/api";
import type { LoginApiResponse, LoginTokensResponse } from "@/features/auth/types";
import { mapLoginApiFieldErrors } from "@/features/auth/map-login-errors";
import { ApiError } from "@/lib/api/errors";
import { toastApiError } from "@/lib/toasts";
import { persistAuthSession } from "@/features/auth/session-storage";

type LoginFieldErrors = Partial<
    Record<"email" | "password" | "phoneE164", string>
>;

function isLoginWithTokens(data: LoginApiResponse): data is LoginTokensResponse {
    return data.success === true && "accessToken" in data;
}

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";
    const [tab, setTab] = useState<"email" | "phone">("email");

    const [email, setEmail] = useState("");
    const [phoneE164, setPhoneE164] = useState<Value | undefined>(undefined);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

    const loginMutation = useMutation({
        mutationFn: loginAccount,
        onSuccess: (data) => {
            if (isLoginWithTokens(data)) {
                persistAuthSession({
                    accessToken: data.accessToken,
                    user: data.user,
                });
                const greet =
                    data.user.firstName?.trim() ||
                    data.user.email?.trim() ||
                    "there";
                toast.success(data.message || "Signed in successfully.", {
                    description: `Welcome back, ${greet}`,
                });
                router.replace(redirect);
                return;
            }
            if (
                "requireOtp" in data &&
                data.requireOtp &&
                "userId" in data &&
                data.userId
            ) {
                router.push(
                    `/verify-otp?userId=${encodeURIComponent(data.userId)}&redirect=${encodeURIComponent(redirect)}`,
                );
                return;
            }
            toast.error("Unexpected login response.");
        },
        onError: (err: unknown) => {
            if (
                err instanceof ApiError &&
                err.statusCode === 400 &&
                err.fieldErrors?.length
            ) {
                const mapped = mapLoginApiFieldErrors(err.fieldErrors);
                if (Object.keys(mapped).length > 0) {
                    setFieldErrors(mapped);
                    return;
                }
            }
            toastApiError(err);
        },
    });

    const pending = loginMutation.isPending;

    const submitEmailLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        if (!getPublicApiBaseUrl()) {
            toast.error("API not configured", {
                description:
                    "Set NEXT_PUBLIC_API_BASE_URL in .env.local (see .env.example).",
            });
            return;
        }

        const parsed = emailLoginFormSchema.safeParse({ email, password });
        if (!parsed.success) {
            const f = parsed.error.flatten().fieldErrors;
            setFieldErrors({
                email: f.email?.[0],
                password: f.password?.[0],
            });
            return;
        }

        loginMutation.mutate({
            email: parsed.data.email.trim(),
            password: parsed.data.password,
        });
    };

    const submitPhoneLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        if (!getPublicApiBaseUrl()) {
            toast.error("API not configured", {
                description:
                    "Set NEXT_PUBLIC_API_BASE_URL in .env.local (see .env.example).",
            });
            return;
        }

        const parsed = phoneLoginFormSchema.safeParse({
            phoneE164: phoneE164 ?? "",
            password,
        });
        if (!parsed.success) {
            const f = parsed.error.flatten().fieldErrors;
            setFieldErrors({
                phoneE164: f.phoneE164?.[0],
                password: f.password?.[0],
            });
            return;
        }

        try {
            loginMutation.mutate(phoneLoginToRequestBody(parsed.data));
        } catch {
            setFieldErrors((prev) => ({
                ...prev,
                phoneE164: "Could not read this phone number. Try again.",
            }));
        }
    };

    return (
        <section className="login">
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
                        Sign in with email or phone
                    </p>
                </div>

                <Tabs
                    value={tab}
                    onValueChange={(v) => {
                        setTab(v as "email" | "phone");
                        setFieldErrors({});
                    }}
                    className="w-full max-w-sm"
                >
                    <TabsList className="grid grid-cols-2 bg-[#242424] border border-[#242424] rounded-lg mb-6 w-full">
                        <TabsTrigger
                            value="email"
                            className="data-[state=active]:bg-pink-600 data-[state=active]:text-white bg-[#242424] text-gray-300"
                        >
                            Email
                        </TabsTrigger>
                        <TabsTrigger
                            value="phone"
                            className="data-[state=active]:bg-pink-600 data-[state=active]:text-white bg-[#242424] text-gray-300"
                        >
                            Phone number
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="email">
                        <form
                            onSubmit={submitEmailLogin}
                            className="flex flex-col space-y-4"
                            noValidate
                        >
                            <div>
                                <Label htmlFor="login-email" className="text-gray-300 text-xs">
                                    Email
                                </Label>
                                <div className="relative mt-1">
                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="example@email.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
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
                                <Label htmlFor="login-email-password" className="text-gray-300 text-xs">
                                    Password
                                </Label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                                    <Input
                                        id="login-email-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setFieldErrors((f) => ({ ...f, password: undefined }));
                                        }}
                                        className="pl-10 pr-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                                        aria-invalid={!!fieldErrors.password}
                                        autoComplete="current-password"
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

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="remember-email" className="border-gray-500" />
                                    <Label
                                        htmlFor="remember-email"
                                        className="text-gray-400 text-xs cursor-pointer"
                                    >
                                        Remember me
                                    </Label>
                                </div>
                                <a
                                    href="#"
                                    className="text-xs text-gray-400 hover:text-pink-500 transition"
                                >
                                    Forgot Password?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                variant="default"
                                size="lg"
                                disabled={pending}
                                className="mt-6 w-full bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-60"
                            >
                                {pending ? "Signing in..." : "Log in"}
                            </Button>

                            <div className="text-center mt-4 social-login-divider">
                                <span className="text-xs text-gray-500">Or continue with</span>
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
                                New to account?{" "}
                                <Link
                                    href={`/signup${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                                    className="text-pink-500 hover:underline block"
                                >
                                    Create account
                                </Link>
                            </p>
                        </form>
                    </TabsContent>

                    <TabsContent value="phone">
                        <form
                            onSubmit={submitPhoneLogin}
                            className="flex flex-col space-y-4 max-w-sm mx-auto"
                            noValidate
                        >
                            <div>
                                <Label htmlFor="login-phone" className="text-gray-300 text-xs">
                                    Phone
                                </Label>
                                <SignupPhoneField
                                    id="login-phone"
                                    className="mt-1"
                                    value={phoneE164}
                                    onChange={(next) => {
                                        setPhoneE164(next);
                                        setFieldErrors((f) => ({ ...f, phoneE164: undefined }));
                                    }}
                                    disabled={pending}
                                    aria-invalid={!!fieldErrors.phoneE164}
                                />
                                {fieldErrors.phoneE164 ? (
                                    <p className="text-xs text-red-400 mt-1">{fieldErrors.phoneE164}</p>
                                ) : null}
                            </div>

                            <div>
                                <Label htmlFor="login-phone-password" className="text-gray-300 text-xs">
                                    Password
                                </Label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                                    <Input
                                        id="login-phone-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setFieldErrors((f) => ({ ...f, password: undefined }));
                                        }}
                                        className="pl-10 pr-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                                        aria-invalid={!!fieldErrors.password}
                                        autoComplete="current-password"
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

                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="remember-phone" className="border-gray-500" />
                                    <Label
                                        htmlFor="remember-phone"
                                        className="text-gray-400 text-xs cursor-pointer"
                                    >
                                        Remember me
                                    </Label>
                                </div>
                                <a
                                    href="#"
                                    className="text-gray-400 hover:text-pink-500 transition"
                                >
                                    Forgot Password?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                variant="default"
                                size="lg"
                                disabled={pending}
                                className="mt-6 w-full bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-60"
                            >
                                {pending ? "Signing in..." : "Log in"}
                            </Button>

                            <p className="text-center text-xs text-gray-400 mt-4">
                                New to account?{" "}
                                <Link
                                    href={`/signup${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                                    className="text-pink-500 hover:underline"
                                >
                                    Create account
                                </Link>
                            </p>
                        </form>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}
