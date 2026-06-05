"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NicheBadge } from "@/components/shared/NicheBadge";
import { ApplicationStatusBadge } from "@/components/application/ApplicationStatusBadge";
import { BarChart3, Users } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { Application } from "@/lib/types";

function formatFollowers(n: number | undefined) {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

interface CreatorPerformanceComparisonProps {
  applications: Application[];
}

export function CreatorPerformanceComparison({ applications }: CreatorPerformanceComparisonProps) {
  if (applications.length < 2) return null;

  const sorted = [...applications].sort(
    (a, b) => (b.agreed_rate ?? b.proposed_rate ?? 0) - (a.agreed_rate ?? a.proposed_rate ?? 0)
  );

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Creator Comparison
          <Badge variant="secondary" className="ml-auto text-xs">{applications.length} creators</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Creator</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Niche</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center justify-end gap-1"><Users className="h-3 w-3" /> Followers</span>
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proposed</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agreed</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deliverables</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((app, idx) => {
              const creator = app.creator;
              const initials = creator.display_name.slice(0, 2).toUpperCase();
              const savings = app.proposed_rate && app.agreed_rate
                ? app.proposed_rate - app.agreed_rate
                : null;

              return (
                <tr
                  key={app.id}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx === 0 ? "bg-primary/5" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {idx === 0 && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5 shrink-0">TOP</span>
                      )}
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={creator.profile_photo_url ?? ""} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate max-w-[120px]">{creator.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <NicheBadge niche={creator.primary_niche} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatFollowers(creator.follower_count)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {app.proposed_rate ? formatBDT(app.proposed_rate) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {app.agreed_rate ? (
                      <div>
                        <span className="font-semibold text-foreground">{formatBDT(app.agreed_rate)}</span>
                        {savings && savings > 0 && (
                          <span className="block text-[10px] text-green-600 font-medium">
                            −{formatBDT(savings)} saved
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {app.agreed_deliverables ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ApplicationStatusBadge status={app.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
