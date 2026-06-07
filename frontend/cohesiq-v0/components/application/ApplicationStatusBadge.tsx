import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/types";

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
}

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  invited: { label: "Invited", className: "border-blue-200 bg-blue-50 text-blue-700" },
  declined: { label: "Declined", className: "border-gray-200 bg-gray-50 text-gray-700" },
  pending: { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-700" },
  shortlisted: { label: "Shortlisted", className: "border-blue-200 bg-blue-50 text-blue-700" },
  accepted: { label: "Accepted", className: "border-green-200 bg-green-50 text-green-700" },
  rejected: { label: "Rejected", className: "border-red-200 bg-red-50 text-red-700" },
  withdrawn: { label: "Withdrawn", className: "border-gray-200 bg-gray-50 text-gray-700" },
  completed: { label: "Completed", className: "border-purple-200 bg-purple-50 text-purple-700" },
};

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const { label, className } = statusConfig[status];

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
