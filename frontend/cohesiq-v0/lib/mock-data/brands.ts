import type { Brand } from "@/lib/types";

export const mockBrands: Brand[] = [
  {
    id: "brand-1",
    brand_name: "Aarong",
    description: "Aarong is Bangladesh's most iconic lifestyle retail chain, celebrating and promoting Bangladeshi culture, heritage, and craftsmanship. We work with artisans across the country to bring authentic, high-quality products to our customers.",
    logo_url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop",
    website: "https://www.aarong.com",
    city: "Dhaka",
    niche: "Fashion",
    is_verified: true,
    total_campaigns: 24,
    average_rating: 4.8
  },
  {
    id: "brand-2",
    brand_name: "Foodpanda Bangladesh",
    description: "Foodpanda is Bangladesh's leading food delivery platform, connecting customers with their favorite restaurants and delivering delicious meals right to their doorsteps. We're passionate about food and convenience.",
    logo_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop",
    website: "https://www.foodpanda.com.bd",
    city: "Dhaka",
    niche: "Food",
    is_verified: true,
    total_campaigns: 18,
    average_rating: 4.5
  },
  {
    id: "brand-3",
    brand_name: "Walton",
    description: "Walton is Bangladesh's leading electronics and technology company, manufacturing smartphones, laptops, refrigerators, and home appliances. We're committed to bringing world-class technology to every Bangladeshi home.",
    logo_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop",
    website: "https://www.waltonbd.com",
    city: "Dhaka",
    niche: "Technology",
    is_verified: true,
    total_campaigns: 31,
    average_rating: 4.6
  },
  {
    id: "brand-4",
    brand_name: "bKash",
    description: "bKash is Bangladesh's largest mobile financial service provider, enabling millions of people to send money, pay bills, and manage their finances through their mobile phones. We're driving financial inclusion across Bangladesh.",
    logo_url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&h=200&fit=crop",
    website: "https://www.bkash.com",
    city: "Dhaka",
    niche: "Finance",
    is_verified: true,
    total_campaigns: 15,
    average_rating: 4.7
  }
];
