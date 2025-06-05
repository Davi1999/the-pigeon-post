import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // You can leave this empty or add logic later
  return NextResponse.next()
}
