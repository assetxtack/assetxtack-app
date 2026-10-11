import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = [
    '/', 
    '/sign-in', 
    '/register', 
    '/verify-email', 
    '/suspended',
    '/appeal', 
    '/contact', 
    '/faq', 
    '/how-it-works', 
    '/privacy', 
    '/terms',
    '/api'
  ];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};