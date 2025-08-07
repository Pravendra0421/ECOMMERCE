import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      metaPixelId,
      metaCapiToken,
      googleTagManagerId,
      isMetaPixelEnabled,
      isGoogleAnalyticsEnabled,
    } = body;

    const updatedSettings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        metaPixelId: metaPixelId || null,
        metaCapiToken: metaCapiToken || null,
        googleTagManagerId: googleTagManagerId || null,
        isMetaPixelEnabled: Boolean(isMetaPixelEnabled),
        isGoogleAnalyticsEnabled: Boolean(isGoogleAnalyticsEnabled),
      },
      create: {
        id: 1,
        metaPixelId: metaPixelId || null,
        metaCapiToken: metaCapiToken || null,
        googleTagManagerId: googleTagManagerId || null,
        isMetaPixelEnabled: Boolean(isMetaPixelEnabled),
        isGoogleAnalyticsEnabled: Boolean(isGoogleAnalyticsEnabled),
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings." },
      { status: 500 }
    );
  }
}
