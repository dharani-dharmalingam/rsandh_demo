import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Root redirect moved to root landing page for better dev experience
    // if (pathname === '/') {
    //     const activeClientSlug = process.env.NEXT_PUBLIC_ACTIVE_CLIENT_SLUG || 'rs-h';
    //     return NextResponse.redirect(new URL(`/${activeClientSlug}`, request.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - studio (Sanity Studio)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|studio).*)',
    ],
};
