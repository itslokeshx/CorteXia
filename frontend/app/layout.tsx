import React from "react";
import { AppProvider } from "@/lib/context/app-context";
import { AuthProvider } from "@/lib/context/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { CelebrationProvider } from "@/components/celebration/celebration-provider";
import { AuthGuard } from "@/components/auth-guard";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>CorteXia</title>
        <meta
          name="description"
          content="Your Life, Understood. Powered by AI. A unified personal life operating system integrating tasks, time tracking, habit management, finance tracking, and AI-powered insights."
        />
        <link rel="icon" href="/Cortexia-icon.jpeg" />
        <link rel="apple-touch-icon" href="/Cortexia-icon.jpeg" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased" style={{ fontFamily: "'Geist', sans-serif" }} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <AuthGuard>
              <AppProvider>
                <CelebrationProvider>{children}</CelebrationProvider>
              </AppProvider>
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

