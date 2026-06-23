import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Venue Booking | Book Event Tickets & Venues Online",
  description:
    "Discover concerts, sports, festivals and live shows. Book event tickets and rent banquet halls, conference rooms and unique venues — secure checkout, flexible refunds, 24/7 booking.",
  keywords: [
    "event tickets",
    "venue booking",
    "concert tickets",
    "book a venue",
    "sports events",
    "wedding venue",
    "corporate event space",
    "Evenjo",
  ],
  openGraph: {
    title: "Evenjo | Book Event Tickets & Venues Online",
    description:
      "Your one-stop platform for live events and venue booking. Find tickets, compare spaces, and book in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} dark`}>
      <body className="font-inter">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
