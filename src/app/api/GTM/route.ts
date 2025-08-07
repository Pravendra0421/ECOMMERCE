import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface AppSettings {
  metaPixelId: string | undefined;
  googleTagManager: string | undefined;
  isMetaPixelEnabled: boolean;
  isGoogleAnalyticsEnabled: boolean;
}

export async function GET() {
  try {
    const settingsRecord = await prisma.settings.findFirst();
    const settings: AppSettings = {
      metaPixelId: settingsRecord?.metaPixelId || undefined,
      googleTagManager: settingsRecord?.googleTagManagerId || undefined,
      isMetaPixelEnabled: settingsRecord?.isMetaPixelEnabled || false,
      isGoogleAnalyticsEnabled:
        settingsRecord?.isGoogleAnalyticsEnabled || false,
    };
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching app settings from API (public):", error);
    return NextResponse.json(
      { error: "Failed to fetch application settings." },
      { status: 500 }
    );
  }
}
