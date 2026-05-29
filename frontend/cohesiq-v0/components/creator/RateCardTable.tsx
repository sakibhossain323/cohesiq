import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlatformBadge, getPlatformLabel } from "@/components/shared/PlatformBadge";
import { formatBDT } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { CreatorRateCard, DeliverableType } from "@/lib/types";

interface RateCardTableProps {
  rateCards: CreatorRateCard[];
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

export function RateCardTable({ rateCards }: RateCardTableProps) {
  if (rateCards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center">
        <p className="text-sm text-muted-foreground">No rate cards available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Platform</TableHead>
            <TableHead>Deliverable</TableHead>
            <TableHead className="text-right">Price (BDT)</TableHead>
            <TableHead className="text-center">Negotiable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rateCards.map(card => (
            <TableRow key={card.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <PlatformBadge platform={card.platform} />
                  <span className="text-sm">{getPlatformLabel(card.platform)}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{deliverableLabels[card.deliverable_type]}</span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold">{formatBDT(card.price_bdt)}</span>
              </TableCell>
              <TableCell className="text-center">
                {card.is_negotiable ? (
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                    <Check className="mr-1 h-3 w-3" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-muted text-muted-foreground">
                    <X className="mr-1 h-3 w-3" />
                    No
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
