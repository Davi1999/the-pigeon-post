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
      <main className="flex-1">{children}</main>
    </div>
  );
}
