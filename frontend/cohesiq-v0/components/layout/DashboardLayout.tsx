'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Show, UserButton, SignInButton } from '@clerk/nextjs'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './sidebar.css'

export interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface DashboardLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
}

/* ── Cohesiq node-graph mark (matches Navbar SVG exactly) ── */
function CohesiqMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden style={{ width: 22, height: 22 }}>
      <circle cx="8"  cy="8"  r="4"   fill="white" />
      <circle cx="24" cy="9"  r="3"   fill="white" opacity="0.75" />
      <circle cx="22" cy="24" r="4.5" fill="white" opacity="0.88" />
      <line x1="8"  y1="8"  x2="24" y2="9"  stroke="white" strokeWidth="1.6" opacity="0.5" />
      <line x1="8"  y1="8"  x2="22" y2="24" stroke="white" strokeWidth="1.6" opacity="0.5" />
      <line x1="24" y1="9"  x2="22" y2="24" stroke="white" strokeWidth="1.6" opacity="0.5" />
    </svg>
  )
}

export function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/creator/dashboard' || href === '/brand/dashboard' || href === '/admin') {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">

        {/* ── Logo ───────────────────────────────────────── */}
        <SidebarHeader className="border-b border-sidebar-border p-0">
          <Link href="/" className="sb-logo-link">
            <div className="sb-mark">
              <CohesiqMark />
            </div>
            <span className="sb-wordmark group-data-[collapsible=icon]:hidden">Cohesiq</span>
          </Link>
        </SidebarHeader>

        {/* ── Nav ────────────────────────────────────────── */}
        <SidebarContent className="px-2">
          <span className="sb-section-label">Navigation</span>
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        {/* ── User footer ────────────────────────────────── */}
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <Show when="signed-in">
            <div className="sb-user">
              <UserButton
                appearance={{ elements: { avatarBox: 'h-8 w-8' } }}
              />
              <div className="sb-user-info group-data-[collapsible=icon]:hidden">
                <span className="sb-user-name">My Account</span>
                <span className="sb-user-sub">Manage profile</span>
              </div>
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/onboarding">
              <Button variant="outline" size="sm" className="w-full gap-2 group-data-[collapsible=icon]:hidden">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </SignInButton>
          </Show>
        </SidebarFooter>

      </Sidebar>

      <SidebarInset>
        <header className="sb-topbar flex h-14 items-center gap-2 px-4">
          <SidebarTrigger className="sb-trigger" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
