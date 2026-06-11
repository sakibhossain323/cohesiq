import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDeliverableLabel } from "@/lib/deliverables";
import { PlatformBadge, getPlatformLabel } from "@/components/shared/PlatformBadge";
import type { CampaignDeliverable } from "@/lib/types";

interface DeliverableTableProps {
  deliverables: CampaignDeliverable[];
}

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
            <TableRow key={deliverable.id ?? `${deliverable.platform}-${deliverable.deliverable_code ?? deliverable.deliverable_type}-${index}`}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <PlatformBadge platform={deliverable.platform} />
                  <span className="text-sm">{getPlatformLabel(deliverable.platform)}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{getDeliverableLabel(deliverable.platform, deliverable.deliverable_code, deliverable.deliverable_type)}</span>
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
