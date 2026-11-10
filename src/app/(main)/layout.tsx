// src/app/(main)/layout.tsx

import { BackToTop } from "@/components/BackToTop";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
      <BackToTop />
    </div>
  );
}
