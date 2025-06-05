// app/login/components/LoginForm.tsx
"use client";

import { useFormState } from "react-dom";
import { loginAction } from "../actions";

const initialState = null;

export default function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input name="email" id="email" type="email" />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input name="password" id="password" type="password" />
      </div>

      <button type="submit">Login</button>

    </form>
  );
}
