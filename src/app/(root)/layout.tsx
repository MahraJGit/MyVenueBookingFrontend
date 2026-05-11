"use client";

import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = pathname === "/affiliate/join";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      {!hideFooter ? <Footer /> : null}
    </div>
  );
}
