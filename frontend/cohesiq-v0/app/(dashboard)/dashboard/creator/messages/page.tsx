"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Info, FileText } from "lucide-react";

// Mock data for the UI
const MOCK_CONVERSATIONS = [
  {
    id: "1",
    brand_name: "TechNova",
    logo_url: "https://api.dicebear.com/9.x/initials/svg?seed=TechNova",
    last_message: "Can we clarify the timeline for the second video?",
    time: "10:23 AM",
    unread: 2,
    campaign_title: "Q4 Tech Gadgets Launch",
  },
  {
    id: "2",
    brand_name: "FreshEats Delivery",
    logo_url: "https://api.dicebear.com/9.x/initials/svg?seed=FreshEats",
    last_message: "Great! The draft looks perfect. Approved.",
    time: "Yesterday",
    unread: 0,
    campaign_title: "Summer Discount Promo",
  },
  {
    id: "3",
    brand_name: "StyleSync",
    logo_url: "https://api.dicebear.com/9.x/initials/svg?seed=StyleSync",
    last_message: "Looking forward to working with you!",
    time: "Oct 12",
    unread: 0,
    campaign_title: "Fall Collection Amplification",
  }
];

const MOCK_MESSAGES = [
  {
    id: "m1",
    sender: "brand",
    text: "Hi there! We loved your recent tech reviews and would like to invite you to our Q4 launch campaign.",
    time: "10:00 AM"
  },
  {
    id: "m2",
    sender: "creator",
    text: "Thanks for reaching out! I'm definitely interested. Could you provide a bit more detail on the deliverable timeline?",
    time: "10:15 AM"
  },
  {
    id: "m3",
    sender: "brand",
    text: "Can we clarify the timeline for the second video? Ideally we'd want it up by mid-November.",
    time: "10:23 AM"
  }
];

export default function CreatorMessagesPage() {
  const [activeConversation, setActiveConversation] = useState(MOCK_CONVERSATIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const activeChat = MOCK_CONVERSATIONS.find(c => c.id === activeConversation);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] w-full flex-col p-4 sm:p-6 lg:p-8">
      {/* Demo Banner */}
      <div className="mb-4 rounded-md bg-blue-50 p-3 border border-blue-200 flex items-center justify-center gap-2 text-blue-800 text-sm">
        <Info className="h-4 w-4" />
        <span className="font-medium">Demo Mode:</span> Direct Messaging is currently in development. This is a preview of the upcoming chat interface.
      </div>

      <div className="flex flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        
        {/* Left Sidebar - Contacts List */}
        <div className="w-full sm:w-80 border-r border-border flex flex-col bg-muted/10 shrink-0 hidden sm:flex">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {MOCK_CONVERSATIONS.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveConversation(chat.id)}
                className={`w-full text-left p-4 flex items-start gap-3 border-b border-border transition-colors hover:bg-muted/50 ${
                  activeConversation === chat.id ? "bg-muted/60" : ""
                }`}
              >
                <Avatar className="h-10 w-10 border border-border mt-0.5">
                  <AvatarImage src={chat.logo_url} />
                  <AvatarFallback>{chat.brand_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-sm truncate pr-2">{chat.brand_name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {chat.campaign_title}
                  </p>
                  <p className={`text-xs truncate ${chat.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {chat.last_message}
                  </p>
                </div>
                {chat.unread > 0 && (
                  <Badge className="ml-2 mt-2 h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px]">
                    {chat.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane - Chat Window */}
        {activeChat ? (
          <div className="flex-1 flex flex-col min-w-0 bg-background">
            {/* Chat Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={activeChat.logo_url} />
                  <AvatarFallback>{activeChat.brand_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">{activeChat.brand_name}</h3>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                    Online
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="hidden sm:flex text-xs h-8">
                <FileText className="mr-2 h-3.5 w-3.5" />
                View Campaign
              </Button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="text-center">
                <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                  Today
                </span>
              </div>
              
              {MOCK_MESSAGES.map(msg => {
                const isBrand = msg.sender === "brand";
                return (
                  <div key={msg.id} className={`flex flex-col ${!isBrand ? "items-end" : "items-start"}`}>
                    <div className="flex items-end gap-2 max-w-[75%] sm:max-w-[60%]">
                      {isBrand && (
                        <Avatar className="h-6 w-6 border border-border shrink-0 mb-1">
                          <AvatarImage src={activeChat.logo_url} />
                        </Avatar>
                      )}
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                        !isBrand 
                          ? "bg-primary text-primary-foreground rounded-br-none" 
                          : "bg-muted text-foreground rounded-bl-none border border-border/50"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                    <span className={`text-[10px] text-muted-foreground mt-1 mx-8 ${!isBrand ? "text-right" : ""}`}>
                      {msg.time}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border bg-card shrink-0">
              <div className="relative flex items-center">
                <Input 
                  placeholder="Messaging is currently in development..." 
                  className="pr-12 bg-muted/30 border-muted-foreground/20 h-11"
                  disabled
                />
                <Button 
                  size="icon" 
                  disabled
                  className="absolute right-1 h-9 w-9 rounded-md bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-2">
                This feature will be unlocked in an upcoming release.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/5">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
