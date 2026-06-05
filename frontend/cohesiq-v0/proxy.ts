import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/(brand|creator)/dashboard(.*)',
])
const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Public routes: skip auth entirely — no Clerk API call, instant response
  if (!isProtectedRoute(req) && !isOnboardingRoute(req)) {
    return NextResponse.next()
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth()

  // Unauthenticated user hitting a gated route → redirect to sign-in
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  // Authenticated but onboarding incomplete → redirect to /onboarding
  if (isProtectedRoute(req) && !sessionClaims?.metadata?.onboardingComplete) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  // Onboarding complete but trying to access /onboarding → send to dashboard
  if (isOnboardingRoute(req) && sessionClaims?.metadata?.onboardingComplete) {
    const role = sessionClaims?.metadata?.role || 'creator'
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/(.*)',
    '/(api|trpc)(.*)',
  ],
}
