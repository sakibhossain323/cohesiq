import { Badge } from "@/components/ui/badge";
import { CampaignStatus } from "@/lib/types";

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const getBadgeVariant = () => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/30";
      case "completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/30";
      case "in_progress":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100/80 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/30";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/30";
      case "archived":
        return "bg-zinc-100 text-zinc-800 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/50";
      case "draft":
      default:
        return "bg-slate-100 text-slate-800 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700/50";
    }
  };

  return (
    <Badge variant="outline" className={`capitalize ${getBadgeVariant()}`}>
      {status.replace("_", " ")}
    </Badge>
  );
}
