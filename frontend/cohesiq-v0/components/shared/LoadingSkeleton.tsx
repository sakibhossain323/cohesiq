import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "table-row" | "profile" | "text";
  count?: number;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <tr className="border-b border-border">
      <td className="px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
      </td>
    </tr>
  );
}

function SkeletonProfile() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <div className="h-24 w-24 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function SkeletonText() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
      <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function LoadingSkeleton({ variant = "card", count = 1 }: LoadingSkeletonProps) {
  const Skeleton = {
    card: SkeletonCard,
    "table-row": SkeletonTableRow,
    profile: SkeletonProfile,
    text: SkeletonText,
  }[variant];

  if (variant === "table-row") {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </>
    );
  }

  return (
    <div className={cn(variant === "card" && "grid gap-4 md:grid-cols-2 lg:grid-cols-3")}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}
