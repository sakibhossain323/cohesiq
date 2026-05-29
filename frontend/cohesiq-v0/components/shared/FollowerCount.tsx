import { formatFollowerCount } from "@/lib/utils";

interface FollowerCountProps {
  count: number;
  showLabel?: boolean;
}

export function FollowerCount({ count, showLabel = true }: FollowerCountProps) {
  return (
    <span className="text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{formatFollowerCount(count)}</span>
      {showLabel && " followers"}
    </span>
  );
}
