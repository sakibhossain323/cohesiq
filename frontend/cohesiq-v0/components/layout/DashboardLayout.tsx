'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarInset,
  SidebarTrigger 
} from '@/components/ui/sidebar'
import { 
  Users, 
  Megaphone, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  
  const isCreatorDashboard = pathname.startsWith('/dashboard/creator')
  const isBrandDashboard = pathname.startsWith('/dashboard/brand')
  
  const navItems = isCreatorDashboard 
    ? [
        { href: '/', label: 'Home', icon: <LogOut className="h-4 w-4" /> },
        { href: '/creators', label: 'Browse Campaigns', icon: <Megaphone className="h-4 w-4" /> },
        { href: '/dashboard/creator', label: 'My Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
      ]
    : isBrandDashboard
    ? [
        { href: '/', label: 'Home', icon: <LogOut className="h-4 w-4" /> },
        { href: '/creators', label: 'Find Creators', icon: <Users className="h-4 w-4" /> },
        { href: '/campaigns', label: 'My Campaigns', icon: <Megaphone className="h-4 w-4" /> },
        { href: '/dashboard/brand', label: 'My Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
      ]
    : [
        { href: '/', label: 'Home', icon: <LogOut className="h-4 w-4" /> },
        { href: '/creators', label: 'Browse Creators', icon: <Users className="h-4 w-4" /> },
        { href: '/campaigns', label: 'Browse Campaigns', icon: <Megaphone className="h-4 w-4" /> },
      ]

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
                  isActive={pathname === item.href}
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
