import { Badge } from "@/components/ui/badge";
import type { CampaignType } from "@/lib/types";

const TYPE_CONFIG: Record<CampaignType, { label: string; variant: "default" | "secondary" | "outline" }> = {
  paid_content:     { label: "Paid Content",     variant: "default" },
  product_gifting:  { label: "Product Gifting",  variant: "secondary" },
  affiliate:        { label: "Affiliate",         variant: "outline" },
  brand_ambassador: { label: "Ambassador",        variant: "default" },
  talent_booking:   { label: "Talent Booking",   variant: "secondary" },
  ugc_only:         { label: "UGC Only",          variant: "outline" },
};

export function CampaignTypeBadge({ type }: { type?: CampaignType | string }) {
  const config = type ? TYPE_CONFIG[type as CampaignType] : undefined;
  if (!config) return null;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
