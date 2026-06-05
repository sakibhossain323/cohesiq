export const CAMPAIGN_TYPE_FEES: Record<string, { pct: number; label: string; description: string }> = {
  paid_content:      { pct: 15, label: "15%", description: "Standard content creation fee" },
  product_gifting:   { pct: 10, label: "10%", description: "Reduced rate for gifted-product deals" },
  affiliate:         { pct: 8,  label: "8%",  description: "Performance-based, lower platform cut" },
  brand_ambassador:  { pct: 12, label: "12%", description: "Long-term ambassador program fee" },
  talent_booking:    { pct: 18, label: "18%", description: "Full-service talent booking fee" },
  ugc_only:          { pct: 10, label: "10%", description: "User-generated content only" },
};

export function getCampaignFee(campaignType: string | undefined) {
  return CAMPAIGN_TYPE_FEES[campaignType ?? ""] ?? { pct: 15, label: "15%", description: "Standard platform fee" };
}

export function computeFeeAmounts(budgetBDT: number, campaignType: string | undefined) {
  const fee = getCampaignFee(campaignType);
  const feeAmount = Math.round(budgetBDT * (fee.pct / 100));
  const netPayout = budgetBDT - feeAmount;
  return { pct: fee.pct, label: fee.label, description: fee.description, feeAmount, netPayout };
}
