import type { Campaign } from "@/lib/types";
import { mockBrands } from "./brands";

export const mockCampaigns: Campaign[] = [
  {
    id: "campaign-1",
    brand_id: "brand-1",
    brand: {
      id: mockBrands[0].id,
      brand_name: mockBrands[0].brand_name,
      logo_url: mockBrands[0].logo_url,
      is_verified: mockBrands[0].is_verified
    },
    title: "Aarong Eid Collection 2026 Launch",
    description: "We're launching our exclusive Eid collection featuring traditional Bangladeshi designs with a modern twist. We're looking for fashion and lifestyle creators to showcase our new collection through authentic storytelling. The campaign should highlight the craftsmanship, quality, and cultural significance of our pieces. Creators will receive products for styling and can keep them after the campaign.",
    primary_niche: "Fashion",
    required_platforms: ["instagram", "youtube"],
    budget_per_creator_min: 50000,
    budget_per_creator_max: 150000,
    creator_min_followers: 50000,
    application_deadline: "2026-06-15",
    status: "active",
    application_count: 24,
    deliverables: [
      { platform: "instagram", deliverable_type: "photo_post", quantity: 2 },
      { platform: "instagram", deliverable_type: "story", quantity: 5 },
      { platform: "youtube", deliverable_type: "integrated_mention", quantity: 1 }
    ]
  },
  {
    id: "campaign-2",
    brand_id: "brand-2",
    brand: {
      id: mockBrands[1].id,
      brand_name: mockBrands[1].brand_name,
      logo_url: mockBrands[1].logo_url,
      is_verified: mockBrands[1].is_verified
    },
    title: "Foodpanda Ramadan Food Festival",
    description: "Ramadan is the biggest food season in Bangladesh, and Foodpanda wants to celebrate it with amazing content! We're looking for food creators to showcase our partner restaurants, special iftar deals, and the joy of ordering food during Ramadan. Content should be warm, family-focused, and highlight the convenience of food delivery.",
    primary_niche: "Food",
    required_platforms: ["youtube", "facebook", "instagram"],
    budget_per_creator_min: 30000,
    budget_per_creator_max: 100000,
    creator_min_followers: 25000,
    application_deadline: "2026-06-01",
    status: "active",
    application_count: 18,
    deliverables: [
      { platform: "youtube", deliverable_type: "dedicated_video", quantity: 1 },
      { platform: "instagram", deliverable_type: "story", quantity: 3 },
      { platform: "facebook", deliverable_type: "photo_post", quantity: 1 }
    ]
  },
  {
    id: "campaign-3",
    brand_id: "brand-3",
    brand: {
      id: mockBrands[2].id,
      brand_name: mockBrands[2].brand_name,
      logo_url: mockBrands[2].logo_url,
      is_verified: mockBrands[2].is_verified
    },
    title: "Walton Primo Z10 Launch Campaign",
    description: "Walton is launching the Primo Z10, our most advanced smartphone yet. We need tech reviewers and content creators to create honest, detailed reviews of the device. Focus on camera quality, performance, battery life, and value for money compared to other phones in this price segment. We want authentic content that helps consumers make informed decisions.",
    primary_niche: "Technology",
    required_platforms: ["youtube"],
    budget_per_creator_min: 80000,
    budget_per_creator_max: 200000,
    creator_min_followers: 100000,
    application_deadline: "2026-06-10",
    status: "active",
    application_count: 12,
    deliverables: [
      { platform: "youtube", deliverable_type: "dedicated_video", quantity: 1 },
      { platform: "youtube", deliverable_type: "short_video", quantity: 2 }
    ]
  },
  {
    id: "campaign-4",
    brand_id: "brand-4",
    brand: {
      id: mockBrands[3].id,
      brand_name: mockBrands[3].brand_name,
      logo_url: mockBrands[3].logo_url,
      is_verified: mockBrands[3].is_verified
    },
    title: "bKash Digital Bangladesh Campaign",
    description: "bKash is promoting digital financial literacy across Bangladesh. We're looking for creators who can explain bKash features (send money, pay bills, merchant payments) in simple, relatable ways. Content should target young adults and showcase how digital payments make life easier. Educational but entertaining content preferred.",
    primary_niche: "Finance",
    required_platforms: ["youtube", "facebook", "tiktok"],
    budget_per_creator_min: 40000,
    budget_per_creator_max: 120000,
    creator_min_followers: 50000,
    application_deadline: "2026-07-01",
    status: "active",
    application_count: 8,
    deliverables: [
      { platform: "youtube", deliverable_type: "integrated_mention", quantity: 1 },
      { platform: "facebook", deliverable_type: "photo_post", quantity: 2 },
      { platform: "tiktok", deliverable_type: "short_video", quantity: 3 }
    ]
  },
  {
    id: "campaign-5",
    brand_id: "brand-1",
    brand: {
      id: mockBrands[0].id,
      brand_name: mockBrands[0].brand_name,
      logo_url: mockBrands[0].logo_url,
      is_verified: mockBrands[0].is_verified
    },
    title: "Aarong Winter Collection 2025",
    description: "Our winter collection campaign was a huge success! We partnered with 8 creators to showcase our shawls, sweaters, and winter wear. The campaign generated over 2 million impressions and drove significant traffic to our stores.",
    primary_niche: "Fashion",
    required_platforms: ["instagram", "youtube"],
    budget_per_creator_min: 45000,
    budget_per_creator_max: 130000,
    creator_min_followers: 40000,
    application_deadline: "2025-11-15",
    status: "completed",
    application_count: 32,
    deliverables: [
      { platform: "instagram", deliverable_type: "photo_post", quantity: 3 },
      { platform: "instagram", deliverable_type: "story", quantity: 4 }
    ]
  },
  {
    id: "campaign-6",
    brand_id: "brand-3",
    brand: {
      id: mockBrands[2].id,
      brand_name: mockBrands[2].brand_name,
      logo_url: mockBrands[2].logo_url,
      is_verified: mockBrands[2].is_verified
    },
    title: "Walton Gaming Tournament Sponsorship",
    description: "Draft campaign for our upcoming esports tournament sponsorship. Looking to partner with gaming creators for live streaming and tournament coverage. Details being finalized.",
    primary_niche: "Gaming",
    required_platforms: ["youtube", "facebook"],
    budget_per_creator_max: 180000,
    creator_min_followers: 75000,
    status: "draft",
    application_count: 0,
    deliverables: [
      { platform: "youtube", deliverable_type: "live_stream", quantity: 2 },
      { platform: "facebook", deliverable_type: "live_stream", quantity: 1 }
    ]
  }
];
