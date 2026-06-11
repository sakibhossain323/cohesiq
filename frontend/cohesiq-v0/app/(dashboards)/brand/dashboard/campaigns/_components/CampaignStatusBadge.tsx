import type { CampaignStatus } from "@/lib/types";

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={`bd-status bd-status-${status}`}>
      {status.replace("_", " ")}
    </span>
  );
}
