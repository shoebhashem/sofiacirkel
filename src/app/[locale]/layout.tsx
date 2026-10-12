import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-reading",
  weight: ["300", "400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "Sofiacirkel", template: "%s · Sofiacirkel" },
  description: "Spara det du vill läsa. Minns det du läst. Inspireras av andras öppna cirklar.",
  metadataBase: new URL("https://sofiacirkel.com"),
  openGraph: {
    siteName: "Sofiacirkel",
    type: "website",
    locale: "sv_SE",
    alternateLocale: ["en_US"],
  },
  twitter: { card: "summary" },
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
    apple: [{ url: "/icon", sizes: "180x180", type: "image/png" }],
  },
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'sv' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          playfair.variable,
          sourceSerif.variable,
          "font-reading antialiased min-h-screen bg-background text-foreground"
        )}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
