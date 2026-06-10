"use client";

import { useState, useTransition } from "react";
import {
  Sheet, SheetContent, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ApplicationStatusBadge } from "@/components/application/ApplicationStatusBadge";
import { getAvatarInitials } from "@/lib/avatar";
import { formatBDT, formatDate } from "@/lib/utils";
import {
  Send, XCircle, Star, Users, ExternalLink, Loader2,
  ChevronRight, BookmarkX, BookmarkPlus, Lock,
  TrendingUp, Calendar,
} from "lucide-react";
import type { Application, ApplicationStatus } from "@/lib/types";
import { updateApplicationStatusAction } from "../_actions/campaign-actions";
import Link from "next/link";

interface ApplicationDrawerProps {
  application: Application | null;
  campaignId: string;
  campaignActive: boolean;
  onClose: () => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onSendOffer: (app: Application) => void;
  onReShortlist?: (app: Application) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube", instagram: "Instagram", facebook: "Facebook",
  tiktok: "TikTok", twitter_x: "Twitter/X", linkedin: "LinkedIn",
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "text-red-500",
  instagram: "text-pink-500",
  tiktok: "text-foreground",
  facebook: "text-blue-500",
  twitter_x: "text-sky-500",
  linkedin: "text-blue-600",
};

export function ApplicationDrawer({
  application,
  campaignId,
  campaignActive,
  onClose,
  onStatusChange,
  onSendOffer,
  onReShortlist,
}: ApplicationDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!application) return null;

  const creator = application.creator;
  const creatorName = creator?.display_name || "Unknown Creator";
  const initials = getAvatarInitials(creatorName);
  const status = application.status;
  const isApplicant = status === "pending";
  const isShortlisted = status === "shortlisted";
  const canOffer = isApplicant || isShortlisted;
  const isDeclined = ["rejected", "declined", "withdrawn"].includes(status);
  const niche = creator?.primary_niche?.replace(/_/g, " ") || "Creator";

  const handleAction = (newStatus: ApplicationStatus, reason?: string) => {
    startTransition(async () => {
      const result = await updateApplicationStatusAction(application.id, newStatus, campaignId, reason);
      if (result.success) {
        onStatusChange(application.id, newStatus);
        setShowRejectForm(false);
        setRejectionReason("");
        onClose();
      }
    });
  };

  const socialProfiles = (creator as any)?.social_profiles ?? [];

  return (
    <Sheet open={!!application} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden gap-0">
        <SheetTitle className="sr-only">{creatorName}</SheetTitle>

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 border-2 border-background ring-1 ring-border shrink-0">
              <AvatarImage
                src={creator?.profile_photo_url || `https://api.dicebear.com/9.x/initials/svg?seed=${creatorName}`}
                alt={creatorName}
              />
              <AvatarFallback className="text-base font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="font-bold text-lg text-foreground leading-tight truncate">{creatorName}</h2>
              <p className="text-sm text-muted-foreground capitalize mt-0.5">{niche}</p>
              <div className="flex items-center gap-2 mt-2">
                <ApplicationStatusBadge status={status} />
                <span className="text-xs text-muted-foreground">
                  {isApplicant ? "Applied" : "Added"} {formatDate(application.applied_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Proposed rate highlight */}
          {application.proposed_rate != null && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-background border border-border px-4 py-2.5">
              <span className="text-xs text-muted-foreground font-medium">Proposed rate</span>
              <span className="font-bold text-foreground text-xl tabular-nums">
                {formatBDT(application.proposed_rate)}
              </span>
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* Platform stats */}
          {socialProfiles.length > 0 && (
            <div className="px-5 pt-5 pb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Platforms</p>
              <div className="space-y-2">
                {socialProfiles.map((sp: any) => (
                  <div key={sp.platform} className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <span className={`text-sm font-semibold w-20 shrink-0 ${PLATFORM_COLORS[sp.platform] ?? "text-foreground"}`}>
                      {PLATFORM_LABELS[sp.platform] || sp.platform}
                    </span>
                    <div className="flex items-center gap-1 flex-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-bold text-sm tabular-nums">
                        {sp.follower_count != null ? sp.follower_count.toLocaleString() : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">followers</span>
                    </div>
                    {sp.engagement_rate != null && (
                      <div className="flex items-center gap-1 shrink-0">
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs font-semibold text-green-600">
                          {sp.engagement_rate.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick stats */}
          {((creator as any)?.average_rating != null || (creator as any)?.total_collaborations != null) && (
            <div className="px-5 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {(creator as any)?.average_rating != null && (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <Star className="h-4 w-4 text-yellow-500 shrink-0" />
                    <div>
                      <p className="font-bold text-sm leading-tight">
                        {Number((creator as any).average_rating).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg rating</p>
                    </div>
                  </div>
                )}
                {(creator as any)?.total_collaborations != null && (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="font-bold text-sm leading-tight">{(creator as any).total_collaborations}</p>
                      <p className="text-xs text-muted-foreground">Collabs</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proposal text */}
          {application.proposal_text && (
            <div className="px-5 pb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Proposal</p>
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap italic">
                  &ldquo;{application.proposal_text}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Decline reason (declined state) */}
          {isDeclined && application.rejection_reason && (
            <div className="px-5 pb-4">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                <p className="text-xs font-semibold text-destructive mb-1">Decline reason</p>
                <p className="text-sm text-foreground">{application.rejection_reason}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Actions footer ── */}
        <div className="shrink-0 border-t border-border bg-background px-5 py-4 space-y-2">

          {canOffer && !showRejectForm && (
            <>
              <Button
                className="w-full"
                disabled={isPending || !campaignActive}
                onClick={() => onSendOffer(application)}
              >
                {campaignActive
                  ? <Send className="mr-2 h-4 w-4" />
                  : <Lock className="mr-2 h-4 w-4" />}
                Send Offer
              </Button>
              {!campaignActive && (
                <p className="text-xs text-muted-foreground text-center pb-1">
                  Launch the campaign to start sending offers.
                </p>
              )}
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                disabled={isPending}
                onClick={() => (isApplicant ? setShowRejectForm(true) : handleAction("withdrawn"))}
              >
                {isApplicant
                  ? <XCircle className="mr-2 h-4 w-4" />
                  : <BookmarkX className="mr-2 h-4 w-4" />}
                {isApplicant ? "Decline applicant" : "Remove from shortlist"}
              </Button>
            </>
          )}

          {showRejectForm && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm font-semibold text-destructive">Decline applicant</p>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Reason (shown to creator, optional)</Label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Budget not aligned, niche mismatch…"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowRejectForm(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isPending}
                  onClick={() => handleAction("rejected", rejectionReason || undefined)}
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirm decline
                </Button>
              </div>
            </div>
          )}

          {isDeclined && (
            <Button
              variant="outline"
              className="w-full"
              disabled={isPending}
              onClick={() => onReShortlist?.(application)}
            >
              {isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <BookmarkPlus className="mr-2 h-4 w-4" />}
              Re-add to Shortlist
            </Button>
          )}

          <Button variant="ghost" size="sm" asChild className="w-full text-muted-foreground">
            <Link href={`/brand/dashboard/creators/${creator?.id}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full Profile
              <ChevronRight className="ml-auto h-4 w-4" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
