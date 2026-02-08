import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppProvider } from "@/lib/context/app-context";
import { AuthProvider } from "@/lib/context/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { CelebrationProvider } from "@/components/celebration/celebration-provider";
import { AuthGuard } from "@/components/auth-guard";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CorteXia",
  description:
    "Your Life, Understood. Powered by AI. A unified personal life operating system integrating tasks, time tracking, habit management, finance tracking, and AI-powered insights.",
  generator: "v0.app",
  icons: {
    icon: "/Cortexia-icon.jpeg",
    shortcut: "/Cortexia-icon.jpeg",
    apple: "/Cortexia-icon.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <AuthGuard>
              <AppProvider>
                <CelebrationProvider>{children}</CelebrationProvider>
              </AppProvider>
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
