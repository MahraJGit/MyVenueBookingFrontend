"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth/auth-context";
import { CurrencyProvider } from "@/features/currency/currency-context";
import { LocaleProvider } from "@/features/i18n/locale-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <CurrencyProvider>
          <AuthProvider>
            {children}
            <Toaster richColors theme="dark" position="top-center" closeButton />
          </AuthProvider>
        </CurrencyProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
