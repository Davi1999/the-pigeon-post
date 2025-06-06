import NextAuth, { type NextAuthResult } from 'next-auth';
import GitHub from "next-auth/providers/github"

const result = NextAuth({
  providers: [GitHub],
});

export const handlers: NextAuthResult['handlers'] = result.handlers;
export const auth: NextAuthResult['auth'] = result.auth;
export const signIn: NextAuthResult['signIn'] = result.signIn;
export const signOut: NextAuthResult['signOut'] = result.signOut;