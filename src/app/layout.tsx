import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: { default: "Bokklubben", template: "%s · Bokklubben" },
  description: "Your group's reading life — books read, books next, and how you rated them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, lora.variable, "font-sans antialiased min-h-screen bg-background text-foreground")}>
        {children}
      </body>
    </html>
  );
}
