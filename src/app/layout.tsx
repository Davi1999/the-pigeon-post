import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { HeaderShell } from "./HeaderShell";

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen newspaper-page">
          <HeaderShell
            session={session}
            displayName={displayName}
            dateLine={dateLine}
          />
          <main className="mx-auto max-w-6xl">{children}</main>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
