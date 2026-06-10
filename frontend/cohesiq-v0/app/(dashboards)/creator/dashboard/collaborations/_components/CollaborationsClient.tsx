"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatBDT, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Inbox, FileText, CheckCircle2, Clock, XCircle, FileSignature, ChevronRight, MessageSquare, RefreshCw } from "lucide-react";
import type { Application, ApplicationStatus } from "@/lib/types";
import { NegotiationDrawer, type NegotiationActions } from "@/components/negotiation/NegotiationDrawer";
import { acceptOfferAction, negotiateAction, declineOfferAction } from "../_actions/collaboration-actions";
import { getApplicationsByCreatorId } from "@/lib/api/applications";
import { usePolling } from "@/hooks/use-polling";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string; icon: React.ElementType }> = {
  invited: { label: "Offer received", className: "border-purple-200 bg-purple-50 text-purple-700", icon: FileSignature },
  declined: { label: "Declined", className: "border-gray-200 bg-gray-50 text-gray-700", icon: XCircle },
  pending: { label: "Applied", className: "border-yellow-200 bg-yellow-50 text-yellow-700", icon: Clock },
  shortlisted: { label: "Shortlisted", className: "border-blue-200 bg-blue-50 text-blue-700", icon: Clock },
  pending_agreement: { label: "Negotiating", className: "border-indigo-200 bg-indigo-50 text-indigo-700", icon: MessageSquare },
  accepted: { label: "Accepted", className: "border-green-200 bg-green-50 text-green-700", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "border-red-200 bg-red-50 text-red-700", icon: XCircle },
  withdrawn: { label: "Withdrawn", className: "border-gray-200 bg-gray-50 text-gray-700", icon: Clock },
  completed: { label: "Completed", className: "border-muted bg-muted/50 text-muted-foreground", icon: CheckCircle2 },
};

interface CollaborationsClientProps {
  creatorId: string;
  offers: Application[];
  myApplications: Application[];
  activeContracts: Application[];
}

const creatorActions: NegotiationActions = {
  accept: acceptOfferAction,
  counter: negotiateAction,
  decline: declineOfferAction,
};

export function CollaborationsClient({ creatorId, offers, myApplications, activeContracts }: CollaborationsClientProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [negotiationApp, setNegotiationApp] = useState<Application | null>(null);

  const [localOffers, setLocalOffers] = useState(offers);
  const [localMyApps, setLocalMyApps] = useState(myApplications);
  const [localActive, setLocalActive] = useState(activeContracts);

  const fetchApplications = async () => {
    const token = await getToken();
    if (!token) return;
    const apps = await getApplicationsByCreatorId(creatorId, token);
    const sorted = apps.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
    
    setLocalOffers(sorted.filter((a) => a.status === 'invited' || a.status === 'pending_agreement'));
    setLocalMyApps(sorted.filter((a) => !['invited', 'pending_agreement', 'accepted', 'completed'].includes(a.status)));
    setLocalActive(sorted.filter((a) => a.status === 'accepted' || a.status === 'completed'));
  };

  const { lastUpdated, isRefreshing, refresh } = usePolling(fetchApplications, 30_000);

  const handleResult = () => {
    setNegotiationApp(null);
    refresh();
    router.refresh();
  };

  const OfferCard = ({ app }: { app: Application }) => {
    const config = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
    const StatusIcon = config.icon;
    const brandName = app.campaign?.brand?.brand_name ?? "Brand";
    return (
      <Card className="overflow-hidden border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:px-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={app.campaign?.brand?.logo_url} />
                <AvatarFallback className="bg-muted text-xs font-semibold">
                  {brandName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{app.campaign?.title || "Unknown Campaign"}</h3>
                <p className="text-sm text-muted-foreground">
                  {brandName} · {formatDate(app.applied_at)}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 ${config.className}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {config.label}
            </Badge>
          </div>

          <div className="border-t border-border bg-muted/20 p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Proposed rate:</span>
              <span className="font-semibold text-foreground">
                {app.agreed_rate ? formatBDT(app.agreed_rate) : app.proposed_rate ? formatBDT(app.proposed_rate) : "Non-cash / TBD"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setNegotiationApp(app)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Review &amp; respond
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/creator/dashboard/campaigns/${app.campaign_id}`}>
                  Campaign <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ApplicationCard = ({ app }: { app: Application }) => {
    const config = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
    const StatusIcon = config.icon;
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:px-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={app.campaign?.brand?.logo_url} />
                <AvatarFallback className="bg-muted text-xs font-semibold">
                  {(app.campaign?.brand?.brand_name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{app.campaign?.title || "Unknown Campaign"}</h3>
                <p className="text-sm text-muted-foreground">
                  {app.campaign?.brand?.brand_name} · Applied {formatDate(app.applied_at)}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 ${config.className}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {config.label}
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-t border-border bg-muted/20">
            <div className="p-5 sm:px-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your Proposal</h4>
              {app.proposal_text ? (
                <p className="text-sm text-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3">
                  &ldquo;{app.proposal_text}&rdquo;
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No proposal text provided.</p>
              )}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Proposed Rate:</span>
                <span className="text-sm font-semibold text-foreground">
                  {app.proposed_rate ? formatBDT(app.proposed_rate) : "N/A"}
                </span>
              </div>
            </div>

            <div className="p-5 sm:px-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Status Details</h4>
                {app.status === "rejected" && app.rejection_reason && (
                  <div className="bg-red-50 text-red-900 border border-red-100 rounded-md p-3 text-sm">
                    <span className="font-semibold block mb-1">Reason:</span>
                    {app.rejection_reason}
                  </div>
                )}
                {app.status === "pending" && (
                  <p className="text-sm text-muted-foreground">Waiting for the brand to review your application.</p>
                )}
                {app.status === "shortlisted" && (
                  <p className="text-sm text-muted-foreground">The brand shortlisted you — an offer may be on the way.</p>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/creator/dashboard/campaigns/${app.campaign_id}`}>
                    View Campaign details <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Collaborations</h1>
          <p className="mt-2 text-muted-foreground">
            Respond to brand offers, track your applications, and manage active contracts.
          </p>
        </div>
        <div className="flex items-center gap-2 pb-1">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            title="Refresh"
            onClick={() => { refresh(); router.refresh(); }}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue={localOffers.length > 0 ? "offers" : "my_applications"} className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto h-auto p-1 bg-muted/50">
          <TabsTrigger value="offers" className="py-2 px-4 flex gap-2">
            Offers
            {localOffers.length > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary h-5 px-1.5 py-0 text-xs">
                {localOffers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my_applications" className="py-2 px-4">My Applications</TabsTrigger>
          <TabsTrigger value="active" className="py-2 px-4 flex gap-2">
            <FileSignature className="h-4 w-4" />
            Contracts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-4">
          {localOffers.length === 0 ? (
            <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Inbox className="mb-4 h-12 w-12 opacity-20" />
                <p className="font-medium text-foreground text-lg">No open offers</p>
                <p className="mt-2 text-sm max-w-sm text-balance">
                  When a brand sends you a contract offer, it will appear here for you to accept, counter, or decline.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {localOffers.map((offer) => (
                <OfferCard key={offer.id} app={offer} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my_applications" className="space-y-6">
          {localMyApps.length === 0 ? (
            <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <FileText className="mb-4 h-12 w-12 opacity-20" />
                <p className="font-medium text-foreground text-lg">No active applications</p>
                <p className="mt-2 mb-6 text-sm max-w-sm text-balance">
                  You haven&apos;t applied to any campaigns yet, or all your past applications are closed.
                </p>
                <Button asChild>
                  <Link href="/creator/dashboard/campaigns">Discover Campaigns</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {localMyApps.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
              <div className="flex items-start gap-4">
                <FileSignature className="h-8 w-8 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Track deliverables on My Contracts</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submit draft content, view brand feedback, publish your posts, and track payment — all in one place.
                  </p>
                </div>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/creator/dashboard/contracts">
                  My Contracts <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          {localActive.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground px-1">
                Accepted applications ({localActive.length})
              </p>
              {localActive.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {negotiationApp && (
        <NegotiationDrawer
          open={!!negotiationApp}
          onClose={() => setNegotiationApp(null)}
          campaignId={negotiationApp.campaign_id}
          application={negotiationApp}
          viewerRole="creator"
          counterpartyName={negotiationApp.campaign?.brand?.brand_name || "Brand"}
          actions={creatorActions}
          onResult={handleResult}
        />
      )}
    </div>
  );
}
