// src/app/(auth)/sign-up/page.tsx

import { redirect } from "next/navigation";

export default function SignUpPage() {
  redirect("/sign-in?redirectReason=signup");
}
