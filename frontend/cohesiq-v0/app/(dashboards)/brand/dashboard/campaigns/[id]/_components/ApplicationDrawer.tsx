"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ApplicationStatusBadge } from "@/components/application/ApplicationStatusBadge";
import { formatBDT, formatDate } from "@/lib/utils";
import { CheckCircle2, XCircle, Star, Users, ExternalLink, Loader2, ChevronRight } from "lucide-react";
import type { Application, ApplicationStatus } from "@/lib/types";
import { updateApplicationStatusAction } from "../_actions/campaign-actions";
import Link from "next/link";

interface ApplicationDrawerProps {
  application: Application | null;
  campaignId: string;
  onClose: () => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onAcceptAndContract?: (app: Application) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
};

export function ApplicationDrawer({
  application,
  campaignId,
  onClose,
  onStatusChange,
  onAcceptAndContract,
}: ApplicationDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!application) return null;

  const creator = application.creator;
  const creatorName = creator?.display_name || "Unknown Creator";
  const initials = creatorName.slice(0, 2).toUpperCase();
  const status = application.status;

  const canShortlist = status === "pending" || status === "invited";
  const canAccept = status === "pending" || status === "invited" || status === "shortlisted";
  const canReject = status === "pending" || status === "invited" || status === "shortlisted";
  const isTerminal = status === "accepted" || status === "rejected" || status === "withdrawn" || status === "completed";

  const handleAction = (newStatus: ApplicationStatus, reason?: string) => {
    startTransition(async () => {
      const result = await updateApplicationStatusAction(
        application.id,
        newStatus,
        campaignId,
        reason
      );
      if (result.success) {
        onStatusChange(application.id, newStatus);
        setShowRejectForm(false);
        setRejectionReason("");
        if (newStatus === "accepted" && onAcceptAndContract) {
          onAcceptAndContract(application);
        }
      }
    });
  };

  return (
    <Sheet open={!!application} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage
                src={creator?.profile_photo_url || `https://api.dicebear.com/9.x/initials/svg?seed=${creatorName}`}
                alt={creatorName}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-base leading-tight">{creatorName}</p>
              <p className="text-sm text-muted-foreground capitalize font-normal">
                {creator?.primary_niche?.replace(/_/g, " ") || "Creator"}
              </p>
            </div>
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <ApplicationStatusBadge status={status} />
            <span className="text-xs text-muted-foreground">Applied {formatDate(application.applied_at)}</span>
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-4" />

        {/* Creator stats */}
        {(creator as any)?.social_profiles?.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Platforms</h4>
            <div className="grid grid-cols-2 gap-2">
              {(creator as any).social_profiles.map((sp: any) => (
                <div key={sp.platform} className="flex flex-col bg-muted/40 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground mb-1">{PLATFORM_LABELS[sp.platform] || sp.platform}</span>
                  <span className="font-semibold text-sm">{sp.follower_count?.toLocaleString() ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">followers</span>
                  {sp.engagement_rate != null && (
                    <span className="text-xs text-green-600 font-medium mt-1">{sp.engagement_rate.toFixed(1)}% ER</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-5">
          {(creator as any)?.average_rating != null && (
            <div className="flex flex-col items-center bg-muted/40 rounded-lg p-3">
              <Star className="h-4 w-4 text-yellow-500 mb-1" />
              <span className="font-bold text-sm">{Number((creator as any).average_rating).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">Rating</span>
            </div>
          )}
          {(creator as any)?.total_collaborations != null && (
            <div className="flex flex-col items-center bg-muted/40 rounded-lg p-3">
              <Users className="h-4 w-4 text-primary mb-1" />
              <span className="font-bold text-sm">{(creator as any).total_collaborations}</span>
              <span className="text-xs text-muted-foreground">Collabs</span>
            </div>
          )}
          {application.proposed_rate != null && (
            <div className="flex flex-col items-center bg-muted/40 rounded-lg p-3">
              <span className="text-xs text-muted-foreground mb-1">Proposed</span>
              <span className="font-bold text-sm">{formatBDT(application.proposed_rate)}</span>
            </div>
          )}
        </div>

        {/* Proposal */}
        {application.proposal_text && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Proposal</h4>
            <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">
              {application.proposal_text}
            </p>
          </div>
        )}

        {/* Rejection reason (read-only) */}
        {status === "rejected" && application.rejection_reason && (
          <div className="mb-5 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Rejection Reason</h4>
            <p className="text-sm text-red-700 dark:text-red-400">{application.rejection_reason}</p>
          </div>
        )}

        {/* Action buttons */}
        {!isTerminal && !showRejectForm && (
          <div className="flex flex-col gap-2 mt-4">
            {canShortlist && (
              <Button
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                disabled={isPending || status === "shortlisted"}
                onClick={() => handleAction("shortlisted")}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {status === "shortlisted" ? "Already Shortlisted" : "Shortlist"}
              </Button>
            )}
            {canAccept && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isPending}
                onClick={() => handleAction("accepted")}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {onAcceptAndContract ? "Accept & Set Contract Terms" : "Accept"}
              </Button>
            )}
            {canReject && (
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                disabled={isPending}
                onClick={() => setShowRejectForm(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            )}
          </div>
        )}

        {/* Rejection form (B04) */}
        {showRejectForm && (
          <div className="mt-4 space-y-3 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-600">Reject Application</h4>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Reason (shown to creator, optional)</Label>
              <Textarea
                rows={3}
                placeholder="e.g. Budget not aligned, niche mismatch..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRejectForm(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isPending}
                onClick={() => handleAction("rejected", rejectionReason || undefined)}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm Reject
              </Button>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        <Button variant="ghost" size="sm" asChild className="w-full text-muted-foreground">
          <Link href={`/brand/dashboard/creators/${creator?.id}`} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Full Profile
            <ChevronRight className="ml-auto h-4 w-4" />
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
