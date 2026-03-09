import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
          <header className="newspaper-header px-4 py-6">
            <div className="mx-auto max-w-6xl">
              <div className="newspaper-header-row">
                <div className="newspaper-header-side">
                  <div className="newspaper-welcome-box">
                    {session ? (
                      <>
                        <div className="newspaper-welcome-text">Welcome,</div>
                        <div className="newspaper-welcome-text">{displayName}</div>
                      </>
                    ) : (
                      <>
                        <div className="newspaper-welcome-text">Welcome,</div>
                        <div className="newspaper-welcome-text">Friend</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="newspaper-header-center">
                  <Link
                    href="/dashboard"
                    className="newspaper-masthead text-4xl sm:text-5xl md:text-6xl hover:opacity-90 transition-opacity"
                  >
                    The Pigeon Post
                  </Link>
                </div>
                <div className="newspaper-header-side">
                  <div className="newspaper-welcome-box">
                    <div className="newspaper-welcome-text">Weather</div>
                    <div className="newspaper-welcome-text-small">
                      Clear skies, high likelyhood
                    </div>
                    <div className="newspaper-welcome-text-small">
                      of connecting with friends.
                    </div>
                  </div>
                </div>
              </div>
              <div className="newspaper-divider">
                <div className="newspaper-divider-line" />
                <div className="newspaper-divider-line" />
                <div className="grid grid-cols-3 items-center">
                  <div className="newspaper-divider-text text-left">
                    Fostering meaningful connections since 2026
                  </div>
                  <div className="newspaper-divider-text text-center">
                    {dateLine}
                  </div>
                  <div className="newspaper-divider-text text-right">
                    <span className="font-black">FREE</span>
                    <span className="normal-case"> - Everywhere, always.</span>
                  </div>
                </div>
                <div className="newspaper-divider-line" />
                <div className="newspaper-divider-line" />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl">{children}</main>
        </div>
      </body>
    </html>
  );
}
