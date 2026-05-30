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
import {
  Users,
  Megaphone,
  BarChart3,
  LogIn,
  Share2,
  FileText,
  MessageSquare,
  Search,
  Briefcase,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  const isCreatorDashboard = pathname.startsWith('/dashboard/creator')
  const isBrandDashboard = pathname.startsWith('/dashboard/brand')

  const navItems = isCreatorDashboard
    ? [
        { href: '/dashboard/creator', label: 'Home', icon: <BarChart3 className="h-4 w-4" /> },
        { href: '/dashboard/creator/campaigns', label: 'Discover Campaigns', icon: <Megaphone className="h-4 w-4" /> },
        { href: '/dashboard/creator/collaborations', label: 'Collaborations', icon: <FileText className="h-4 w-4" /> },
        { href: '/dashboard/creator/messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
        { href: '/dashboard/creator/profile', label: 'My Platforms', icon: <Share2 className="h-4 w-4" /> },
      ]
    : isBrandDashboard
    ? [
        { href: '/dashboard/brand', label: 'Home', icon: <BarChart3 className="h-4 w-4" /> },
        { href: '/dashboard/brand/campaigns', label: 'Campaigns', icon: <Megaphone className="h-4 w-4" /> },
        { href: '/dashboard/brand/creators', label: 'Find Creators', icon: <Search className="h-4 w-4" /> },
        { href: '/dashboard/brand/collaborations', label: 'Collaborations', icon: <Briefcase className="h-4 w-4" /> },
        { href: '/dashboard/brand/messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
        { href: '/dashboard/brand/profile', label: 'Brand Profile', icon: <Building2 className="h-4 w-4" /> },
      ]
    : []

  // A nav item is active if the path exactly matches OR the path starts with the href
  // (for section roots), but the Dashboard root must be an exact match to avoid
  // always being active when inside /campaigns, /messages, etc.
  function isActive(href: string): boolean {
    if (href === '/dashboard/creator' || href === '/dashboard/brand') {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b">
          <Link href="/" className="flex items-center gap-2 px-2 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">C</span>
            </div>
            <span className="text-lg font-bold text-foreground">Cohesiq</span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
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

        {/* ── User section at the very bottom of the sidebar ── */}
        <SidebarFooter className="border-t p-3">
          <Show when="signed-in">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
                  },
                }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">My Account</span>
                <span className="text-xs text-muted-foreground truncate">Manage profile</span>
              </div>
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </SignInButton>
          </Show>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
