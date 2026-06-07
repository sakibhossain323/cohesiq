export const BRAND_CATEGORIES = [
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "stationery", label: "Stationery" },
  { value: "edtech", label: "EdTech" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "sports", label: "Sports" },
  { value: "gaming", label: "Gaming" },
  { value: "health_wellness", label: "Health & Wellness" },
  { value: "finance", label: "Finance" },
  { value: "telecom", label: "Telecom" },
  { value: "media_entertainment", label: "Media & Entertainment" },
  { value: "home_lifestyle", label: "Home & Lifestyle" },
] as const;

export type BrandCategory = (typeof BRAND_CATEGORIES)[number]["value"];

export function getBrandCategoryLabel(value?: string | null) {
  return BRAND_CATEGORIES.find((category) => category.value === value)?.label ?? "Not set";
}
