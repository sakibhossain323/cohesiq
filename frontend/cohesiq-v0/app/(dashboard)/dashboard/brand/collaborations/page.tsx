"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Send, FileSignature } from "lucide-react";

export default function BrandCollaborationsPage() {
  const [invitations] = useState([]);
  const [activeContracts] = useState([]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-primary" />
          Collaborations
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your sent invitations and active creator contracts.
        </p>
      </div>

      <Tabs defaultValue="invitations" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto h-auto p-1 bg-muted/50">
          <TabsTrigger value="invitations" className="py-2 px-4 flex gap-2">
            Sent Invitations
          </TabsTrigger>
          <TabsTrigger value="active" className="py-2 px-4">
            Active Contracts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="invitations" className="space-y-6">
          <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Send className="mb-4 h-12 w-12 opacity-20" />
              <p className="font-medium text-foreground text-lg">No sent invitations</p>
              <p className="mt-2 text-sm max-w-sm text-balance">
                When you invite a creator to a campaign from the Find Creators page, it will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="space-y-6">
          <Card className="min-h-[40vh] flex items-center justify-center border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <FileSignature className="mb-4 h-12 w-12 opacity-20" />
              <p className="font-medium text-foreground text-lg">No active contracts</p>
              <p className="mt-2 text-sm max-w-sm text-balance">
                When you accept a creator's application, it will move here so you can track deliverables.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
