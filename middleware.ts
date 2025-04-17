import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })
    
    await supabase.auth.getSession()

    // Add CORS headers for iframe support
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.headers.set('X-Frame-Options', 'ALLOW-FROM https://qrmenu.eaglesnestcy.com')
    res.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://qrmenu.eaglesnestcy.com")

    // Protect dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    return res
  } catch (error) {
    // If there's an error, just continue to the requested page
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/api/:path*']
} 