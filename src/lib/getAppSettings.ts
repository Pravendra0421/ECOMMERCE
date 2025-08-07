interface AppSettings {
  metaPixelId: string | undefined;
  googleTagManagerId: string | undefined;
  isMetaPixelEnabled: boolean;
  isGoogleAnalyticsEnabled: boolean;
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const URL =
      process.env.NEXT_PUBLIC_API_BASE_URL_MAIN || "http://localhost:3000";
    const res = await fetch(`${URL}/api/GTM`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch app settings: ${res.status} ${res.statusText}`
      );
    }

    const data: AppSettings = await res.json();
    return data;
  } catch (error) {
    console.error("Error in getAppSettings:", error);
    return {
      metaPixelId: undefined,
      googleTagManagerId: undefined,
      isMetaPixelEnabled: false,
      isGoogleAnalyticsEnabled: false,
    };
  }
}
