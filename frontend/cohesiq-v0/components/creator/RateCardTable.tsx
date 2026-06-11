import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeliverableLabel } from "@/lib/deliverables";
import { PlatformBadge, getPlatformLabel } from "@/components/shared/PlatformBadge";
import { formatBDT } from "@/lib/utils";
import { Check, X, Edit2, Trash2 } from "lucide-react";
import type { CreatorRateCard } from "@/lib/types";

interface RateCardTableProps {
  rateCards: CreatorRateCard[];
  onEdit?: (card: CreatorRateCard) => void;
  onDelete?: (card: CreatorRateCard) => void;
}

export function RateCardTable({ rateCards, onEdit, onDelete }: RateCardTableProps) {
  if (rateCards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center">
        <p className="text-sm text-muted-foreground">No rate cards available</p>
      </div>
    );
  }

  const showActions = Boolean(onEdit || onDelete);
  const showSuggested = rateCards.some(card => card.suggested_price_bdt);

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Platform</TableHead>
            <TableHead>Deliverable</TableHead>
            {showSuggested && <TableHead className="text-right">Suggested</TableHead>}
            <TableHead className="text-right">Price (BDT)</TableHead>
            <TableHead className="text-center">Negotiable</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rateCards.map((card, index) => (
            <TableRow key={card.id ?? `${card.platform}-${card.deliverable_code ?? card.deliverable_type}-${index}`}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <PlatformBadge platform={card.platform} />
                  <span className="text-sm">{getPlatformLabel(card.platform)}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{getDeliverableLabel(card.platform, card.deliverable_code, card.deliverable_type)}</span>
              </TableCell>
              {showSuggested && (
                <TableCell className="text-right">
                  <span className="text-sm text-muted-foreground">
                    {card.suggested_price_bdt ? formatBDT(card.suggested_price_bdt) : "-"}
                  </span>
                </TableCell>
              )}
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
              {showActions && (
                <TableCell className="text-right space-x-2">
                  {onEdit && (
                    <Button size="icon-sm" variant="outline" onClick={() => onEdit(card)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button size="icon-sm" variant="outline" onClick={() => onDelete(card)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
