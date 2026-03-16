import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { HeaderShell } from "./HeaderShell";
import { ToastProvider } from "./ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Pigeon Post",
  description: "The Pigeon Post",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const fullName = session?.user.name;
  const nameParts = fullName ? fullName.split(" ") : [];
  const displayName =
    nameParts.length >= 2
      ? `${nameParts[0]} ${nameParts[1]}`
      : fullName ?? session?.user.email ?? "";

  const today = new Date();
  const dateLine = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=close"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen newspaper-page flex flex-col">
          <HeaderShell
            session={session}
            displayName={displayName}
            dateLine={dateLine}
          />
          <main className="mx-auto max-w-6xl flex-1 w-full">{children}</main>
          <footer className="mx-auto max-w-6xl w-full px-4 pb-8 pt-6 text-xs text-muted-foreground flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-t border-black">
            <div>© {new Date().getFullYear()} The Pigeon Post.</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <a href="/terms" className="underline-offset-2 hover:underline">
                Terms of Service
              </a>
              <a href="/privacy" className="underline-offset-2 hover:underline">
                Privacy Policy
              </a>
            </div>
          </footer>
        </div>
        <ToastProvider />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
