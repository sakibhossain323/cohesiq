"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatBDT, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Inbox, FileText, CheckCircle2, Clock, XCircle, FileSignature } from "lucide-react";
import type { Application, ApplicationStatus } from "@/lib/types";
import { respondToInvitationAction } from "../_actions/collaboration-actions";

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string; icon: React.ElementType }> = {
  invited: { label: "Invited", className: "border-purple-200 bg-purple-50 text-purple-700", icon: Clock },
  declined: { label: "Declined", className: "border-gray-200 bg-gray-50 text-gray-700", icon: XCircle },
  pending: { label: "Pending Review", className: "border-yellow-200 bg-yellow-50 text-yellow-700", icon: Clock },
  shortlisted: { label: "Shortlisted", className: "border-blue-200 bg-blue-50 text-blue-700", icon: Clock },
  accepted: { label: "Accepted", className: "border-green-200 bg-green-50 text-green-700", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "border-red-200 bg-red-50 text-red-700", icon: XCircle },
  withdrawn: { label: "Withdrawn", className: "border-gray-200 bg-gray-50 text-gray-700", icon: Clock },
  completed: { label: "Completed", className: "border-muted bg-muted/50 text-muted-foreground", icon: CheckCircle2 },
};

interface CollaborationsClientProps {
  invitations: Application[];
  myApplications: Application[];
  activeContracts: Application[];
}

export function CollaborationsClient({ invitations, myApplications, activeContracts }: CollaborationsClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleRespond = (campaignId: string, applicationId: string, action: "accept" | "decline") => {
    startTransition(async () => {
      await respondToInvitationAction(campaignId, applicationId, action);
    });
  };

  const ApplicationCard = ({ app, isInvite = false }: { app: Application, isInvite?: boolean }) => {
    const config = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
    const StatusIcon = config.icon;
    
    return (
      <Card className={`overflow-hidden ${isInvite ? 'border-primary/20 bg-primary/[0.02]' : ''}`}>
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
                <div className="flex items-center gap-2 mb-1">
                  {isInvite && (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none shrink-0 h-5 px-1.5 py-0 text-xs">
                      New Invitation
                    </Badge>
                  )}
                  <h3 className="font-semibold text-lg text-foreground">
                    {app.campaign?.title || "Unknown Campaign"}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {app.campaign?.brand?.brand_name} · {isInvite ? "Invited on" : "Applied on"} {formatDate(app.applied_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              {!isInvite && (
                <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 ${config.className}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {config.label}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-t border-border bg-muted/20">
            <div className="p-5 sm:px-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {isInvite ? "Brand's Proposal" : "Your Proposal"}
              </h4>
              {app.proposal_text ? (
                <p className="text-sm text-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3">
                  "{app.proposal_text}"
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
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Status Details
                </h4>
                
                {app.status === 'rejected' && app.rejection_reason && (
                  <div className="bg-red-50 text-red-900 border border-red-100 rounded-md p-3 text-sm">
                    <span className="font-semibold block mb-1">Reason:</span>
                    {app.rejection_reason}
                  </div>
                )}
                
                {app.status === 'accepted' && (
                  <div className="bg-green-50 text-green-900 border border-green-100 rounded-md p-3 text-sm">
                    <span className="font-semibold block mb-1">Agreed Terms:</span>
                    Rate: {app.agreed_rate ? formatBDT(app.agreed_rate) : "As proposed"}
                  </div>
                )}

                {app.status === 'pending' && !isInvite && (
                  <p className="text-sm text-muted-foreground">
                    Waiting for the brand to review your application.
                  </p>
                )}

                {isInvite && (
                  <p className="text-sm text-muted-foreground">
                    The brand is waiting for your response.
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {isInvite && (
                  <>
                    <Button 
                      variant="default" 
                      size="sm" 
                      disabled={isPending}
                      onClick={() => handleRespond(app.campaign_id, app.id, "accept")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={isPending}
                      onClick={() => handleRespond(app.campaign_id, app.id, "decline")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </>
                )}
                <Button variant="secondary" size="sm" className={isInvite ? "" : "sm:ml-auto"} asChild>
                  <Link href={`/dashboard/creator/campaigns/${app.campaign_id}`}>
                    View Campaign details
                    <ArrowRight className="ml-2 h-4 w-4" />
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Collaborations</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your campaign applications, brand invitations, and active contracts.
        </p>
      </div>

      <Tabs defaultValue="my_applications" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto h-auto p-1 bg-muted/50">
          <TabsTrigger value="invitations" className="py-2 px-4 flex gap-2">
            Invitations
            {invitations.length > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary h-5 px-1.5 py-0 text-xs">
                {invitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my_applications" className="py-2 px-4">
            My Applications
          </TabsTrigger>
          <TabsTrigger value="active" className="py-2 px-4">
            Active Contracts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="invitations" className="space-y-6">
          {invitations.length === 0 ? (
            <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Inbox className="mb-4 h-12 w-12 opacity-20" />
                <p className="font-medium text-foreground text-lg">No new invitations</p>
                <p className="mt-2 text-sm max-w-sm text-balance">
                  When a brand finds your profile and invites you to a campaign, it will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invitations.map(invite => (
                <ApplicationCard key={invite.id} app={invite} isInvite={true} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my_applications" className="space-y-6">
          {myApplications.length === 0 ? (
            <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <FileText className="mb-4 h-12 w-12 opacity-20" />
                <p className="font-medium text-foreground text-lg">No active applications</p>
                <p className="mt-2 mb-6 text-sm max-w-sm text-balance">
                  You haven't applied to any campaigns yet, or all your past applications are closed.
                </p>
                <Button asChild>
                  <Link href="/dashboard/creator/campaigns">
                    Discover Campaigns
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myApplications.map(app => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-6">
          {activeContracts.length === 0 ? (
            <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <FileSignature className="mb-4 h-12 w-12 opacity-20" />
                <p className="font-medium text-foreground text-lg">No active contracts</p>
                <p className="mt-2 text-sm max-w-sm text-balance">
                  When a brand accepts your application, it will move here so you can track your deliverables and payment status.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeContracts.map(app => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
