import { formatFollowerCount } from "@/lib/utils";

interface FollowerCountProps {
  count: number;
  showLabel?: boolean;
  className?: string;
}

export function FollowerCount({ count, showLabel = true, className }: FollowerCountProps) {
  return (
    <span className={className ?? "text-sm text-muted-foreground"}>
      <span className="font-semibold text-foreground">{formatFollowerCount(count)}</span>
      {showLabel && " followers"}
    </span>
  );
}
