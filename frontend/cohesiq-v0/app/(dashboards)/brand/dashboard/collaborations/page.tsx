"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, FileSignature } from "lucide-react";

export default function BrandCollaborationsPage() {
  const [invitations] = useState([]);
  const [activeContracts] = useState([]);

  return (
    <div className="bd-page">
      <header className="bd-header">
        <div className="bd-header-inner">
          <div>
            <span className="eyebrow mb-3 block">Brand Hub</span>
            <h1 className="bd-header-title">Collaborations</h1>
            <p className="bd-header-sub">Manage your sent invitations and active creator contracts.</p>
          </div>
        </div>
      </header>

      <div className="bd-body">
        <Tabs defaultValue="invitations" className="w-full">
          <TabsList className="mb-6 w-full sm:w-auto h-auto p-1 bg-surface-subtle border border-border rounded-xl">
            <TabsTrigger value="invitations" className="py-2 px-5 rounded-lg">
              Sent Invitations
            </TabsTrigger>
            <TabsTrigger value="active" className="py-2 px-5 rounded-lg">
              Active Contracts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invitations">
            <div className="bd-section">
              <div className="bd-empty">
                <div className="bd-empty-icon"><Send className="h-6 w-6" /></div>
                <p className="bd-empty-title">No sent invitations</p>
                <p className="bd-empty-desc">
                  When you invite a creator from the Find Creators page, it will appear here.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="bd-section">
              <div className="bd-empty">
                <div className="bd-empty-icon"><FileSignature className="h-6 w-6" /></div>
                <p className="bd-empty-title">No active contracts</p>
                <p className="bd-empty-desc">
                  When you accept a creator&apos;s application, it will appear here so you can track deliverables.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
