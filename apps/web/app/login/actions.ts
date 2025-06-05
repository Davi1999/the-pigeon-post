// app/login/actions.ts
"use server";

import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginState =
  | { success: true }
  | { error: { email?: string[]; password?: string[]; form?: string } };

export async function loginAction(
  _prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const values = Object.fromEntries(formData.entries());

  const result = LoginSchema.safeParse(values);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return { error: fieldErrors };
  }

  const { email, password } = result.data;

  // TODO: Auth logic here
  const isValidUser = email === "test@example.com" && password === "password";

  if (!isValidUser) {
    return { error: { form: "Invalid credentials" } };
  }

  // You could also use `redirect("/")` here instead
  return { success: true };
}
