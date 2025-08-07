// src/lib/track-event.ts
declare global {
  interface Window {
    fbq?: (...args: any[]) => void; // Keep for fallback or if direct pixel is ever used
    dataLayer: any[]; // <-- Add this for GTM dataLayer
  }
}

export const trackEvent = (
  eventName: string,
  data: Record<string, any> = {},
  eventID?: string
) => {
  if (typeof window !== "undefined") {
    if (window.dataLayer) {
      // GTM dataLayer ko push karo
      window.dataLayer.push({
        event: "customMetaPixelEvent", // <-- Yeh ek custom Data Layer event name hai jo GTM sunega
        eventName: eventName, // <-- Actual Meta Pixel event name (e.g., 'ViewContent', 'AddToCart')
        eventData: data, // <-- Event ke saare parameters
        eventID: eventID, // <-- Deduplication ke liye unique ID
      });
      console.log(`[DataLayer] Pushed: ${eventName} with eventID: ${eventID}`);
    } else {
      // Fallback: Agar GTM dataLayer available nahi hai (normally nahi hoga agar GTM lag gaya)
      if (window.fbq) {
        window.fbq("track", eventName, data, { eventID });
        console.warn(
          `[Client-side Pixel Fallback] ${eventName} event triggered directly (dataLayer not found).`
        );
      } else {
        console.warn(
          `[Client-side Tracking] Neither dataLayer nor fbq is available for event: ${eventName}`
        );
      }
    }
  }
};
