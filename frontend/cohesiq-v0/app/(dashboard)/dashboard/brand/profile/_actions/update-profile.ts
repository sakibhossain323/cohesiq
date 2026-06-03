"use server";

import { auth } from "@clerk/nextjs/server";
import { updateBrandProfile } from "@/lib/api/brands";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(brandId: string, formData: any) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const updated = await updateBrandProfile(brandId, formData, token);
    revalidatePath("/dashboard/brand/profile");
    return { success: true, brand: updated };
  } catch (error) {
    console.error("Failed to update brand profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
