"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMyBrandProfile } from "@/lib/api/brands";
import { getCampaignsByBrandId } from "@/lib/api/campaigns";
import { getApplicationsByCampaignId, updateApplicationStatus } from "@/lib/api/applications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBDT, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ExternalLink, Inbox, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Application, ApplicationStatus } from "@/lib/types";

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  shortlisted: { label: "Shortlisted", className: "border-blue-200 bg-blue-50 text-blue-700" },
  accepted: { label: "Accepted", className: "border-green-200 bg-green-50 text-green-700" },
  rejected: { label: "Rejected", className: "border-red-200 bg-red-50 text-red-700" },
  withdrawn: { label: "Withdrawn", className: "border-gray-200 bg-gray-50 text-gray-700" },
  completed: { label: "Completed", className: "border-muted bg-muted/50 text-muted-foreground" },
};

const ACTIONABLE_STATUSES: ApplicationStatus[] = [
  "pending",
  "shortlisted",
  "accepted",
  "rejected",
];

export default function BrandMessagesPage() {
  const { getToken, isLoaded } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<(Application & { campaignTitle: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const brand = await getMyBrandProfile(token);
      if (!brand) return;

      const campaigns = await getCampaignsByBrandId(brand.id);

      // Fetch applications for all campaigns in parallel
      const allApps = await Promise.all(
        campaigns.map(async c => {
          const apps = await getApplicationsByCampaignId(c.id, token);
          return apps.map(a => ({ ...a, campaignTitle: c.title }));
        })
      );

      // Flatten, sort: pending first, then by date
      const flat = allApps.flat().sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      });

      setApplications(flat);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded) loadApplications();
  }, [isLoaded, loadApplications]);

  const handleStatusChange = async (
    app: Application & { campaignTitle: string },
    newStatus: ApplicationStatus
  ) => {
    setUpdatingId(app.id);
    try {
      const token = await getToken();
      if (!token) return;
      await updateApplicationStatus(app.id, newStatus, app.campaign_id, token);
      setApplications(prev =>
        prev.map(a => (a.id === app.id ? { ...a, status: newStatus } : a))
      );
      toast({ title: "Status updated", description: `Application marked as ${newStatus}.` });
    } catch {
      toast({ title: "Update failed", description: "Could not update the status.", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = applications.filter(a => a.status === "pending").length;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inbox</h1>
          {pendingCount > 0 && (
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
              {pendingCount}
            </span>
          )}
        </div>
        <p className="mt-2 text-muted-foreground">
          Review incoming applications from creators and take action
        </p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <Inbox className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium text-foreground">No applications yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Applications from creators will appear here once your campaigns go live.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const config = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
            const isUpdating = updatingId === app.id;
            const isPending = app.status === "pending";

            return (
              <Card
                key={app.id}
                className={`overflow-hidden transition-all hover:border-primary/40 hover:shadow-sm ${
                  isPending ? "border-primary/20 bg-primary/[0.02]" : ""
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    {/* Unread dot + avatar */}
                    <div className="flex items-center gap-3">
                      <div className="flex w-4 shrink-0 justify-center">
                        {isPending && (
                          <span className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <Avatar className="h-11 w-11 shrink-0 border border-border">
                        <AvatarImage
                          src={app.creator?.profile_photo_url}
                          alt={app.creator?.display_name}
                        />
                        <AvatarFallback className="bg-muted text-xs font-semibold">
                          {(app.creator?.display_name ?? "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">
                            {app.creator?.display_name ?? "Unknown Creator"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Applied to{" "}
                            <span className="font-medium text-foreground">
                              {app.campaignTitle}
                            </span>{" "}
                            · {formatDate(app.applied_at)}
                          </p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-xs ${config.className}`}>
                          {config.label}
                        </Badge>
                      </div>
                      {app.proposed_rate && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Proposed:{" "}
                          <span className="font-medium text-foreground">
                            {formatBDT(app.proposed_rate)}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <Select
                        value={app.status}
                        disabled={isUpdating}
                        onValueChange={v => handleStatusChange(app, v as ApplicationStatus)}
                      >
                        <SelectTrigger className="h-8 w-36 text-xs">
                          {isUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIONABLE_STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {STATUS_CONFIG[s].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/dashboard/brand/creators/${app.creator?.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
