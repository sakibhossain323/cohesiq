import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/(brand|creator)/dashboard(.*)'])
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isBrandDashboardRoute = createRouteMatcher(['/brand/dashboard(.*)'])
const isCreatorDashboardRoute = createRouteMatcher(['/creator/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Allow the image proxy to be called without Clerk auth
  if (req.nextUrl?.pathname?.startsWith('/api/image-proxy')) {
    return NextResponse.next()
  }
  // Public routes: skip auth entirely — no Clerk API call, instant response
  if (!isProtectedRoute(req) && !isOnboardingRoute(req) && !isAdminRoute(req)) {
    return NextResponse.next()
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth()

  // Unauthenticated user hitting a gated route → redirect to sign-in
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  // Admin routes: only Clerk publicMetadata.role === 'admin'. Handled BEFORE the
  // onboarding/role logic so the admin is never bounced to /onboarding.
  if (isAdminRoute(req)) {
    if (sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Authenticated but onboarding incomplete → redirect to /onboarding
  if (isProtectedRoute(req) && !sessionClaims?.metadata?.onboardingComplete) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  if (isProtectedRoute(req) && sessionClaims?.metadata?.onboardingComplete) {
    const role = sessionClaims?.metadata?.role
    if (role === 'creator' && isBrandDashboardRoute(req)) {
      return NextResponse.redirect(new URL('/creator/dashboard', req.url))
    }
    if (role === 'brand' && isCreatorDashboardRoute(req)) {
      return NextResponse.redirect(new URL('/brand/dashboard', req.url))
    }
  }

  // Onboarding complete but trying to access /onboarding → send to dashboard
  if (isOnboardingRoute(req) && sessionClaims?.metadata?.onboardingComplete) {
    const role = sessionClaims?.metadata?.role
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', req.url))
    return NextResponse.redirect(new URL(`/${role === 'brand' ? 'brand' : 'creator'}/dashboard`, req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/(.*)',
  ],
}
