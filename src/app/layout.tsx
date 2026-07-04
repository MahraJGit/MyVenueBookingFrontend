import type { Metadata } from "next";
import { Poppins, Inter, Noto_Nastaliq_Urdu, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { isRtlLocale } from "@/i18n/locales";

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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("defaultTitle"),
    description: t("defaultDescription"),
  };
}

const notoUrdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-urdu",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const fontClass =
    locale === "ur"
      ? "font-urdu"
      : locale === "ar"
        ? "font-arabic"
        : "font-inter";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${poppins.variable} ${notoUrdu.variable} ${notoArabic.variable} dark`}
    >
      <body className={fontClass}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
