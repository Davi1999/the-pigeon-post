// src/app/(main)/layout.tsx

import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          The Pigeon Post
        </Link>
        <SignOutButton />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
