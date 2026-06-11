import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Megaphone, FileText, Share2, BarChart3, FileSignature } from 'lucide-react'
import '../../brand/dashboard/brand.css'

const creatorNavItems = [
  { href: '/creator/dashboard', label: 'Media Kit', icon: <BarChart3 className="h-4 w-4" /> },
  { href: '/creator/dashboard/campaigns', label: 'Discover Campaigns', icon: <Megaphone className="h-4 w-4" /> },
  { href: '/creator/dashboard/collaborations', label: 'Collaborations', icon: <FileText className="h-4 w-4" /> },
  { href: '/creator/dashboard/contracts', label: 'My Contracts', icon: <FileSignature className="h-4 w-4" /> },
  { href: '/creator/dashboard/profile', label: 'My Platforms', icon: <Share2 className="h-4 w-4" /> },
]

export default function CreatorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout navItems={creatorNavItems}>{children}</DashboardLayout>
}
