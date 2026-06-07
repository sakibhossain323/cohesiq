import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Megaphone, Search, MessageSquare, Building2, BarChart3 } from 'lucide-react'
import './brand.css'

const brandNavItems = [
  { href: '/brand/dashboard', label: 'Home', icon: <BarChart3 className="h-4 w-4" /> },
  { href: '/brand/dashboard/campaigns', label: 'Campaigns', icon: <Megaphone className="h-4 w-4" /> },
  { href: '/brand/dashboard/creators', label: 'Find Creators', icon: <Search className="h-4 w-4" /> },
  { href: '/brand/dashboard/messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
  { href: '/brand/dashboard/profile', label: 'Brand Profile', icon: <Building2 className="h-4 w-4" /> },
]

export default function BrandDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout navItems={brandNavItems}>{children}</DashboardLayout>
}
