import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LayoutDashboard, Users, Megaphone } from 'lucide-react'

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" /> },
  { href: '/admin/campaigns', label: 'Campaigns', icon: <Megaphone className="h-4 w-4" /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout navItems={adminNavItems}>{children}</DashboardLayout>
}
