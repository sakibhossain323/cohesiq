import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlatformBadge, getPlatformLabel } from "@/components/shared/PlatformBadge";
import type { CampaignDeliverable, DeliverableType } from "@/lib/types";

interface DeliverableTableProps {
  deliverables: CampaignDeliverable[];
}

const deliverableLabels: Record<DeliverableType, string> = {
  dedicated_video: "Dedicated Video",
  integrated_mention: "Integrated Mention",
  short_video: "Short Video",
  photo_post: "Photo Post",
  story: "Story",
  live_stream: "Live Stream",
  blog_post: "Blog Post",
  other: "Other",
};

export function DeliverableTable({ deliverables }: DeliverableTableProps) {
  if (deliverables.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center">
        <p className="text-sm text-muted-foreground">No deliverables specified</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Platform</TableHead>
            <TableHead>Deliverable Type</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliverables.map((deliverable, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <PlatformBadge platform={deliverable.platform} />
                  <span className="text-sm">{getPlatformLabel(deliverable.platform)}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{deliverableLabels[deliverable.deliverable_type]}</span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold">{deliverable.quantity}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
