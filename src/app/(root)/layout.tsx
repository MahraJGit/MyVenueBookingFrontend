"use client";

import { Suspense } from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { usePathname, useSearchParams } from "next/navigation";

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "1";
  const hideFooter = pathname === "/affiliate/join";

  if (isEmbed) {
    return <main className="min-h-screen flex-1">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1">{children}</main>
      {!hideFooter ? <Footer /> : null}
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col overflow-x-hidden">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      }
    >
      <RootLayoutContent>{children}</RootLayoutContent>
    </Suspense>
  );
}
