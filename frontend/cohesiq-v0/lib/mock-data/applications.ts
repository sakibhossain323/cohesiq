import type { Application } from "@/lib/types";
import { mockCreators } from "./creators";
import { mockCampaigns } from "./campaigns";

export const mockApplications: Application[] = [
  {
    id: "app-1",
    campaign_id: "campaign-1",
    campaign: {
      id: mockCampaigns[0].id,
      title: mockCampaigns[0].title,
      brand: mockCampaigns[0].brand
    },
    creator: {
      id: mockCreators[1].id,
      display_name: mockCreators[1].display_name,
      profile_photo_url: mockCreators[1].profile_photo_url,
      primary_niche: mockCreators[1].primary_niche,
      follower_count: 456000
    },
    proposed_rate: 85000,
    proposal_text: "I would love to showcase the Eid collection! My audience is highly engaged with fashion content and I have extensive experience with ethnic wear styling. I can create stunning visuals that highlight the craftsmanship.",
    status: "accepted",
    applied_at: "2026-05-15T10:30:00Z"
  },
  {
    id: "app-2",
    campaign_id: "campaign-1",
    campaign: {
      id: mockCampaigns[0].id,
      title: mockCampaigns[0].title,
      brand: mockCampaigns[0].brand
    },
    creator: {
      id: mockCreators[7].id,
      display_name: mockCreators[7].display_name,
      profile_photo_url: mockCreators[7].profile_photo_url,
      primary_niche: mockCreators[7].primary_niche,
      follower_count: 378000
    },
    proposed_rate: 95000,
    proposal_text: "As a beauty and fashion creator, I can bring a unique perspective to the Eid collection. I'll focus on styling tips and how to pair Aarong pieces with makeup looks.",
    status: "shortlisted",
    applied_at: "2026-05-16T14:20:00Z"
  },
  {
    id: "app-3",
    campaign_id: "campaign-2",
    campaign: {
      id: mockCampaigns[1].id,
      title: mockCampaigns[1].title,
      brand: mockCampaigns[1].brand
    },
    creator: {
      id: mockCreators[0].id,
      display_name: mockCreators[0].display_name,
      profile_photo_url: mockCreators[0].profile_photo_url,
      primary_niche: mockCreators[0].primary_niche,
      follower_count: 824000
    },
    proposed_rate: 95000,
    proposal_text: "Food content is my specialty! I can create engaging Ramadan-themed content showcasing Foodpanda's partner restaurants. My audience loves iftar recommendations.",
    status: "accepted",
    applied_at: "2026-05-10T08:45:00Z"
  },
  {
    id: "app-4",
    campaign_id: "campaign-2",
    campaign: {
      id: mockCampaigns[1].id,
      title: mockCampaigns[1].title,
      brand: mockCampaigns[1].brand
    },
    creator: {
      id: mockCreators[3].id,
      display_name: mockCreators[3].display_name,
      profile_photo_url: mockCreators[3].profile_photo_url,
      primary_niche: mockCreators[3].primary_niche,
      follower_count: 189000
    },
    proposed_rate: 55000,
    proposal_text: "While I primarily focus on travel, food is a huge part of my content when exploring new places. I'd love to showcase local restaurant deliveries!",
    status: "pending",
    applied_at: "2026-05-18T16:00:00Z"
  },
  {
    id: "app-5",
    campaign_id: "campaign-3",
    campaign: {
      id: mockCampaigns[2].id,
      title: mockCampaigns[2].title,
      brand: mockCampaigns[2].brand
    },
    creator: {
      id: mockCreators[2].id,
      display_name: mockCreators[2].display_name,
      profile_photo_url: mockCreators[2].profile_photo_url,
      primary_niche: mockCreators[2].primary_niche,
      follower_count: 567000
    },
    proposed_rate: 140000,
    proposal_text: "I specialize in honest tech reviews and my audience trusts my recommendations. I'll provide a thorough, unbiased review of the Primo Z10 covering all key features.",
    status: "accepted",
    applied_at: "2026-05-12T11:30:00Z"
  },
  {
    id: "app-6",
    campaign_id: "campaign-3",
    campaign: {
      id: mockCampaigns[2].id,
      title: mockCampaigns[2].title,
      brand: mockCampaigns[2].brand
    },
    creator: {
      id: mockCreators[4].id,
      display_name: mockCreators[4].display_name,
      profile_photo_url: mockCreators[4].profile_photo_url,
      primary_niche: mockCreators[4].primary_niche,
      follower_count: 412000
    },
    proposed_rate: 110000,
    proposal_text: "I can review the Primo Z10 from a gaming perspective - testing mobile games, performance, and battery life during gaming sessions.",
    status: "rejected",
    applied_at: "2026-05-13T09:15:00Z"
  },
  {
    id: "app-7",
    campaign_id: "campaign-4",
    campaign: {
      id: mockCampaigns[3].id,
      title: mockCampaigns[3].title,
      brand: mockCampaigns[3].brand
    },
    creator: {
      id: mockCreators[6].id,
      display_name: mockCreators[6].display_name,
      profile_photo_url: mockCreators[6].profile_photo_url,
      primary_niche: mockCreators[6].primary_niche,
      follower_count: 189000
    },
    proposed_rate: 75000,
    proposal_text: "Financial literacy is my passion! I can create educational content about bKash features that resonates with young adults and explains digital payments simply.",
    status: "shortlisted",
    applied_at: "2026-05-20T13:45:00Z"
  },
  {
    id: "app-8",
    campaign_id: "campaign-5",
    campaign: {
      id: mockCampaigns[4].id,
      title: mockCampaigns[4].title,
      brand: mockCampaigns[4].brand
    },
    creator: {
      id: mockCreators[1].id,
      display_name: mockCreators[1].display_name,
      profile_photo_url: mockCreators[1].profile_photo_url,
      primary_niche: mockCreators[1].primary_niche,
      follower_count: 456000
    },
    proposed_rate: 80000,
    proposal_text: "The winter collection was gorgeous! I created 3 stunning outfit posts and the engagement was incredible.",
    status: "completed",
    applied_at: "2025-10-25T10:00:00Z"
  },
  {
    id: "app-9",
    campaign_id: "campaign-1",
    campaign: {
      id: mockCampaigns[0].id,
      title: mockCampaigns[0].title,
      brand: mockCampaigns[0].brand
    },
    creator: {
      id: mockCreators[5].id,
      display_name: mockCreators[5].display_name,
      profile_photo_url: mockCreators[5].profile_photo_url,
      primary_niche: mockCreators[5].primary_niche,
      follower_count: 267000
    },
    proposed_rate: 60000,
    proposal_text: "I can showcase the Eid collection with a fitness-lifestyle angle - comfortable yet stylish pieces for active women.",
    status: "withdrawn",
    applied_at: "2026-05-14T15:30:00Z"
  },
  {
    id: "app-10",
    campaign_id: "campaign-4",
    campaign: {
      id: mockCampaigns[3].id,
      title: mockCampaigns[3].title,
      brand: mockCampaigns[3].brand
    },
    creator: {
      id: mockCreators[4].id,
      display_name: mockCreators[4].display_name,
      profile_photo_url: mockCreators[4].profile_photo_url,
      primary_niche: mockCreators[4].primary_niche,
      follower_count: 412000
    },
    proposed_rate: 65000,
    proposal_text: "I can create gaming-related content showing how to use bKash for in-game purchases and gaming subscriptions!",
    status: "pending",
    applied_at: "2026-05-22T11:00:00Z"
  }
];
