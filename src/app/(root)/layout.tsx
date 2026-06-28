"use client";

import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = pathname === "/affiliate/join";

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1">{children}</main>
      {!hideFooter ? <Footer /> : null}
    </div>
  );
}
