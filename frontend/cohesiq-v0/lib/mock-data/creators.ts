import type { Creator } from "@/lib/types";

export const mockCreators: Creator[] = [
  {
    id: "creator-1",
    display_name: "Rafsan TheChotoBhai",
    tagline: "Making food fun, one recipe at a time",
    bio: "Hi! I'm Rafsan, a passionate food content creator from Dhaka. I love exploring street food, cooking traditional Bangladeshi dishes, and sharing easy recipes that anyone can try at home. I've been creating content for 5 years and worked with over 50 brands.",
    profile_photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    city: "Dhaka",
    primary_niche: "Food",
    niches: ["Food", "Lifestyle", "Travel"],
    languages: ["Bangla", "English"],
    social_profiles: [
      {
        id: "sp-1-1",
        platform: "youtube",
        handle: "@rafsanthechotobhai",
        profile_url: "https://youtube.com/@rafsanthechotobhai",
        follower_count: 824000,
        engagement_rate: 8.5,
        avg_views_per_post: 450000,
        is_primary_platform: true
      },
      {
        id: "sp-1-2",
        platform: "instagram",
        handle: "@rafsanthechotobhai",
        profile_url: "https://instagram.com/rafsanthechotobhai",
        follower_count: 312000,
        engagement_rate: 5.2,
        is_primary_platform: false
      },
      {
        id: "sp-1-3",
        platform: "facebook",
        handle: "Rafsan TheChotoBhai",
        profile_url: "https://facebook.com/rafsanthechotobhai",
        follower_count: 540000,
        engagement_rate: 3.8,
        is_primary_platform: false
      }
    ],
    rate_cards: [
      { id: "rc-1-1", platform: "youtube", deliverable_type: "dedicated_video", price_bdt: 150000, is_negotiable: true },
      { id: "rc-1-2", platform: "youtube", deliverable_type: "integrated_mention", price_bdt: 80000, is_negotiable: true },
      { id: "rc-1-3", platform: "instagram", deliverable_type: "photo_post", price_bdt: 45000, is_negotiable: false },
      { id: "rc-1-4", platform: "instagram", deliverable_type: "story", price_bdt: 15000, is_negotiable: false }
    ],
    is_available: true,
    total_collaborations: 52,
    average_rating: 4.8
  },
  {
    id: "creator-2",
    display_name: "Nusrat Faria",
    tagline: "Fashion & beauty enthusiast",
    bio: "I'm Nusrat, a fashion and beauty content creator based in Chittagong. I love showcasing affordable fashion, skincare routines, and makeup tutorials for everyday looks. Let's make beauty accessible to everyone!",
    profile_photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    city: "Chittagong",
    primary_niche: "Fashion",
    niches: ["Fashion", "Beauty", "Lifestyle"],
    languages: ["Bangla", "English"],
    social_profiles: [
      {
        id: "sp-2-1",
        platform: "instagram",
        handle: "@nusratfaria_style",
        profile_url: "https://instagram.com/nusratfaria_style",
        follower_count: 456000,
        engagement_rate: 6.8,
        is_primary_platform: true
      },
      {
        id: "sp-2-2",
        platform: "tiktok",
        handle: "@nusratfaria_style",
        profile_url: "https://tiktok.com/@nusratfaria_style",
        follower_count: 289000,
        engagement_rate: 9.2,
        avg_views_per_post: 120000,
        is_primary_platform: false
      },
      {
        id: "sp-2-3",
        platform: "youtube",
        handle: "@NusratFariaStyle",
        profile_url: "https://youtube.com/@NusratFariaStyle",
        follower_count: 178000,
        engagement_rate: 4.5,
        avg_views_per_post: 85000,
        is_primary_platform: false
      }
    ],
    rate_cards: [
      { id: "rc-2-1", platform: "instagram", deliverable_type: "photo_post", price_bdt: 55000, is_negotiable: true },
      { id: "rc-2-2", platform: "instagram", deliverable_type: "story", price_bdt: 18000, is_negotiable: false },
      { id: "rc-2-3", platform: "tiktok", deliverable_type: "short_video", price_bdt: 35000, is_negotiable: true },
      { id: "rc-2-4", platform: "youtube", deliverable_type: "dedicated_video", price_bdt: 95000, is_negotiable: true }
    ],
    is_available: true,
    total_collaborations: 38,
    average_rating: 4.6
  },
  {
    id: "creator-3",
    display_name: "Tanzim Ahmed",
    tagline: "Tech reviews you can trust",
    bio: "Hey, I'm Tanzim! I'm a tech reviewer and gadget enthusiast from Dhaka. I help people make informed decisions about smartphones, laptops, and accessories with honest, in-depth reviews.",
    profile_photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    city: "Dhaka",
    primary_niche: "Technology",
    niches: ["Technology", "Gaming"],
    languages: ["Bangla", "English"],
    social_profiles: [
      {
        id: "sp-3-1",
        platform: "youtube",
        handle: "@TanzimTechBD",
        profile_url: "https://youtube.com/@TanzimTechBD",
        follower_count: 567000,
        engagement_rate: 7.2,
        avg_views_per_post: 280000,
        is_primary_platform: true
      },
      {
        id: "sp-3-2",
        platform: "facebook",
        handle: "Tanzim Tech BD",
        profile_url: "https://facebook.com/tanzimtechbd",
        follower_count: 234000,
        engagement_rate: 4.1,
        is_primary_platform: false
      }
    ],
    rate_cards: [
      { id: "rc-3-1", platform: "youtube", deliverable_type: "dedicated_video", price_bdt: 120000, is_negotiable: true },
      { id: "rc-3-2", platform: "youtube", deliverable_type: "integrated_mention", price_bdt: 65000, is_negotiable: true },
      { id: "rc-3-3", platform: "facebook", deliverable_type: "photo_post", price_bdt: 25000, is_negotiable: false }
    ],
    is_available: true,
    total_collaborations: 45,
    average_rating: 4.9
  },
  {
    id: "creator-4",
    display_name: "Sadia Rahman",
    tagline: "Exploring Bangladesh one destination at a time",
    bio: "Travel blogger and photographer documenting the hidden gems of Bangladesh. From the beaches of Cox's Bazar to the tea gardens of Sylhet, I share authentic travel experiences and tips.",
    profile_photo_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    city: "Sylhet",
    primary_niche: "Travel",
    niches: ["Travel", "Lifestyle", "Food"],
    languages: ["Bangla", "English"],
    social_profiles: [
      {
        id: "sp-4-1",
        platform: "instagram",
        handle: "@sadiatravels",
        profile_url: "https://instagram.com/sadiatravels",
        follower_count: 189000,
        engagement_rate: 8.1,
        is_primary_platform: true
      },
      {
        id: "sp-4-2",
        platform: "youtube",
        handle: "@SadiaTravelsBD",
        profile_url: "https://youtube.com/@SadiaTravelsBD",
        follower_count: 98000,
        engagement_rate: 5.5,
        avg_views_per_post: 45000,
        is_primary_platform: false
      },
      {
        id: "sp-4-3",
        platform: "tiktok",
        handle: "@sadiatravels",
        profile_url: "https://tiktok.com/@sadiatravels",
        follower_count: 156000,
        engagement_rate: 11.2,
        avg_views_per_post: 78000,
        is_primary_platform: false
      }
    ],
    rate_cards: [
      { id: "rc-4-1", platform: "instagram", deliverable_type: "photo_post", price_bdt: 28000, is_negotiable: true },
      { id: "rc-4-2", platform: "instagram", deliverable_type: "story", price_bdt: 10000, is_negotiable: false },
      { id: "rc-4-3", platform: "youtube", deliverable_type: "dedicated_video", price_bdt: 70000, is_negotiable: true },
      { id: "rc-4-4", platform: "tiktok", deliverable_type: "short_video", price_bdt: 22000, is_negotiable: true }
    ],
    is_available: false,
    total_collaborations: 24,
    average_rating: 4.7
  },
  {
    id: "creator-5",
    display_name: "Emon Khan",
    tagline: "Level up your gaming",
    bio: "Professional gamer and streamer. I cover mobile gaming, esports, and gaming news for the Bangladeshi gaming community. Let's play together!",
    profile_photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    city: "Dhaka",
    primary_niche: "Gaming",
    niches: ["Gaming", "Technology"],
    languages: ["Bangla", "English"],
    social_profiles: [
      {
        id: "sp-5-1",
        platform: "youtube",
        handle: "@EmonGamingBD",
        profile_url: "https://youtube.com/@EmonGamingBD",
        follower_count: 412000,
        engagement_rate: 9.8,
        avg_views_per_post: 195000,
        is_primary_platform: true
      },
      {
        id: "sp-5-2",
        platform: "facebook",
        handle: "Emon Gaming BD",
        profile_url: "https://facebook.com/emongamingbd",
        follower_count: 678000,
        engagement_rate: 5.4,
        is_primary_platform: false
      },
      {
        id: "sp-5-3",
        platform: "tiktok",
        handle: "@emongamingbd",
        profile_url: "https://tiktok.com/@emongamingbd",
        follower_count: 234000,
        engagement_rate: 12.5,
        avg_views_per_post: 110000,
        is_primary_platform: false
      }
    ],
    rate_cards: [
      { id: "rc-5-1", platform: "youtube", deliverable_type: "dedicated_video", price_bdt: 100000, is_negotiable: true },
      { id: "rc-5-2", platform: "youtube", deliverable_type: "live_stream", price_bdt: 75000, is_negotiable: true },
      { id: "rc-5-3", platform: "facebook", deliverable_type: "live_stream", price_bdt: 55000, is_negotiable: false },
      { id: "rc-5-4", platform: "tiktok", deliverable_type: "short_video", price_bdt: 30000, is_negotiable: true }
    ],
    is_available: true,
    total_collaborations: 31,
    average_rating: 4.5
  },
  {
    id: "creator-6",
    display_name: "Fatima Akter",
    tagline: "Fitness is a lifestyle, not a destination",
    bio: "Certified fitness trainer and wellness advocate. I share workout routines, nutrition tips, and motivation to help you achieve your health goals. Let's get fit together!",
    profile_photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    city: "Dhaka",
    primary_niche: "Fitness",
    niches: ["Fitness", "Lifestyle", "Beauty"],
    languages: ["Bangla", "English"],
    social_profiles: [
      {
        id: "sp-6-1",
        platform: "instagram",
        handle: "@fatima_fit_bd",
        profile_url: "https://instagram.com/fatima_fit_bd",
        follower_count: 267000,
        engagement_rate: 7.4,
        is_primary_platform: true
      },
      {
        id: "sp-6-2",
        platform: "youtube",
        handle: "@FatimaFitBD",
        profile_url: "https://youtube.com/@FatimaFitBD",
        follower_count: 145000,
        engagement_rate: 6.1,
        avg_views_per_post: 62000,
        is_primary_platform: false
      },
      {
        id: "sp-6-3",
        platform: "tiktok",
        handle: "@fatima_fit_bd",
        profile_url: "https://tiktok.com/@fatima_fit_bd",
        follower_count: 198000,
        engagement_rate: 10.8,
        avg_views_per_post: 89000,
        is_primary_platform: false
      }
    ],
    rate_cards: [
      { id: "rc-6-1", platform: "instagram", deliverable_type: "photo_post", price_bdt: 38000, is_negotiable: true },
      { id: "rc-6-2", platform: "instagram", deliverable_type: "story", price_bdt: 12000, is_negotiable: false },
      { id: "rc-6-3", platform: "youtube", deliverable_type: "dedicated_video", price_bdt: 85000, is_negotiable: true },
      { id: "rc-6-4", platform: "tiktok", deliverable_type: "short_video", price_bdt: 25000, is_negotiable: true }
    ],
    is_available: true,
    total_collaborations: 28,
    average_rating: 4.8
  },
  {
    id: "creator-7",
    display_name: "Ariful Islam",
    tagline: "Making finance simple",
    bio: "Financial educator helping young Bangladeshis understand money management, investments, and building wealth. I break down complex financial concepts into easy-to-understand content.",
    profile_photo_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
    city: "Rajshahi",
    primary_niche: "Finance",
    niches: ["Finance", "Lifestyle"],
    languages: ["Bangla", "English"],
    social_profiles: [
      {
        id: "sp-7-1",
        platform: "youtube",
        handle: "@ArifulFinanceBD",
        profile_url: "https://youtube.com/@ArifulFinanceBD",
        follower_count: 189000,
        engagement_rate: 5.8,
        avg_views_per_post: 78000,
        is_primary_platform: true
      },
      {
        id: "sp-7-2",
        platform: "facebook",
        handle: "Ariful Finance BD",
        profile_url: "https://facebook.com/arifulfinancebd",
        follower_count: 312000,
        engagement_rate: 4.2,
        is_primary_platform: false
      },
      {
        id: "sp-7-3",
        platform: "linkedin",
        handle: "ariful-islam-finance",
        profile_url: "https://linkedin.com/in/ariful-islam-finance",
        follower_count: 45000,
        engagement_rate: 3.5,
        is_primary_platform: false
      }
    ],
    rate_cards: [
      { id: "rc-7-1", platform: "youtube", deliverable_type: "dedicated_video", price_bdt: 90000, is_negotiable: true },
      { id: "rc-7-2", platform: "youtube", deliverable_type: "integrated_mention", price_bdt: 50000, is_negotiable: true },
      { id: "rc-7-3", platform: "facebook", deliverable_type: "photo_post", price_bdt: 30000, is_negotiable: false },
      { id: "rc-7-4", platform: "linkedin", deliverable_type: "blog_post", price_bdt: 35000, is_negotiable: true }
    ],
    is_available: true,
    total_collaborations: 19,
    average_rating: 4.6
  },
  {
    id: "creator-8",
    display_name: "Mim Chowdhury",
    tagline: "Beauty beyond boundaries",
    bio: "Makeup artist and beauty content creator. I create tutorials, product reviews, and beauty tips for all skin types. Celebrating diversity and inclusivity in beauty.",
    profile_photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    city: "Chittagong",
    primary_niche: "Beauty",
    niches: ["Beauty", "Fashion", "Lifestyle"],
    languages: ["Bangla", "English"],
    social_profiles: [
      {
        id: "sp-8-1",
        platform: "instagram",
        handle: "@mimbeautybd",
        profile_url: "https://instagram.com/mimbeautybd",
        follower_count: 378000,
        engagement_rate: 7.9,
        is_primary_platform: true
      },
      {
        id: "sp-8-2",
        platform: "youtube",
        handle: "@MimBeautyBD",
        profile_url: "https://youtube.com/@MimBeautyBD",
        follower_count: 234000,
        engagement_rate: 5.6,
        avg_views_per_post: 98000,
        is_primary_platform: false
      },
      {
        id: "sp-8-3",
        platform: "tiktok",
        handle: "@mimbeautybd",
        profile_url: "https://tiktok.com/@mimbeautybd",
        follower_count: 445000,
        engagement_rate: 13.2,
        avg_views_per_post: 185000,
        is_primary_platform: false
      }
    ],
    rate_cards: [
      { id: "rc-8-1", platform: "instagram", deliverable_type: "photo_post", price_bdt: 48000, is_negotiable: true },
      { id: "rc-8-2", platform: "instagram", deliverable_type: "story", price_bdt: 16000, is_negotiable: false },
      { id: "rc-8-3", platform: "youtube", deliverable_type: "dedicated_video", price_bdt: 110000, is_negotiable: true },
      { id: "rc-8-4", platform: "tiktok", deliverable_type: "short_video", price_bdt: 42000, is_negotiable: true }
    ],
    is_available: true,
    total_collaborations: 42,
    average_rating: 4.7
  }
];
