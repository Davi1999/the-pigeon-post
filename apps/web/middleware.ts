import { NextRequest, NextResponse, type NextMiddleware } from 'next/server';
import NextAuth from 'next-auth';
import authConfig from '@/app/api/auth/auth.config';
import { AppRouteHandlerFn } from 'next/dist/server/route-modules/app-route/module';

const { auth } = NextAuth(authConfig);


const middleware: NextMiddleware = auth(async (req) => {
  const session = req.auth;

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  return NextResponse.next();
});

export default middleware;

