'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Show, UserButton, SignInButton, useUser } from '@clerk/nextjs'
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
import { CohesiqMark } from '@/components/brand/CohesiqLogo'
import { ThemeToggle } from '@/components/theme-provider'
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

export function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user } = useUser()

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
        <SidebarHeader className="border-sidebar-border p-0">
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
              <div className="sb-user-info group-data-[collapsible=icon]:hidden overflow-hidden">
                <span className="sb-user-name truncate">
                  {user?.fullName || user?.firstName || 'My Account'}
                </span>
                <span className="sb-user-sub truncate">
                  {user?.primaryEmailAddress?.emailAddress || 'Manage profile'}
                </span>
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
        <header className="sb-topbar flex items-center gap-2 px-4">
          <SidebarTrigger className="sb-trigger" />
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
