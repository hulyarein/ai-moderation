// filepath: /home/tr-ggr/NerdProjects/nextjs/ai-moderation/app/api/profile/random/route.ts
import { NextResponse } from "next/server";
import { getRandomProfilePicture } from "@/utils/profilePictureSelector";

export async function GET() {
  try {
    // Now using the optimized function that uses an enum instead of reading from filesystem
    const profilePicture = getRandomProfilePicture();
    return NextResponse.json({ profilePicture });
  } catch (error) {
    console.error("Error getting random profile picture:", error);
    return NextResponse.json(
      { error: "Failed to get random profile picture" },
      { status: 500 }
    );
  }
}
