import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";
import prisma from "@/lib/prisma"; // Import your Prisma client

function sha256(data: string) {
  return crypto
    .createHash("sha256")
    .update(data.trim().toLowerCase())
    .digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const dbSettings = await prisma.settings.findFirst();

    const PIXEL_ID = dbSettings?.metaPixelId;
    const ACCESS_TOKEN = dbSettings?.metaCapiToken;

    // Basic validation for retrieved settings
    if (!PIXEL_ID) {
      console.error("Meta Pixel ID is not configured in database.");
      return NextResponse.json(
        { error: "Server configuration error: Meta Pixel ID missing." },
        { status: 500 }
      );
    }
    if (!ACCESS_TOKEN) {
      console.error("Meta CAPI Token is not configured in database.");
      return NextResponse.json(
        { error: "Server configuration error: Meta CAPI Token missing." },
        { status: 500 }
      );
    }

    // 2. Parse the request body sent from the client
    const body = await req.json();

    // 3. Extract user data (cookies, IP, user agent) from the request headers
    const cookies = req.headers.get("cookie");
    const fbc = cookies
      ? cookies
          .split("; ")
          .find((row) => row.startsWith("_fbc="))
          ?.split("=")[1]
      : null;
    const fbp = cookies
      ? cookies
          .split("; ")
          .find((row) => row.startsWith("_fbp="))
          ?.split("=")[1]
      : null;

    const ipAddress = req.headers.get("x-forwarded-for");

    const userData: { [key: string]: string | string[] } = {};

    if (body.email) {
      userData.em = [sha256(body.email)];
    }
    if (body.phone) {
      userData.ph = [sha256(body.phone)];
    }
    if (fbc) {
      userData.fbc = fbc;
    }
    if (fbp) {
      userData.fbp = fbp;
    }
    if (ipAddress) {
      userData.client_ip_address = ipAddress;
    }
    if (req.headers.get("user-agent")) {
      userData.client_user_agent = req.headers.get("user-agent") as string;
    }
    // Add more PII fields here if collected and hashed (e.g., first_name, last_name, city, state, zip)
    // if (body.firstName) userData.fn = [sha256(body.firstName)];
    // if (body.lastName) userData.ln = [sha256(body.lastName)];

    // 4. Construct the event data object for Meta CAPI
    const eventData = {
      event_name: body.event_name, // Event name from client
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.event_id, // Crucial for deduplication with client-side pixel events
      action_source: "website", // Source of the event
      user_data: userData, // Hashed user data and browser IDs
      custom_data: {
        value: body.value,
        currency: body.currency || "INR",
        content_ids: body.content_ids,
        content_type: body.content_type || "product",
        // Add more custom_data as needed for specific events (e.g., num_items for Purchase)
        // num_items: body.num_items,
        // order_id: body.order_id,
      },
      // You can also add context data if available (e.g., page_title, page_url)
      // context: {
      //   page: {
      //     page_title: body.page_title,
      //     page_url: body.page_url,
      //   },
      // },
    };

    // 5. Validate essential data before sending to Meta
    if (
      !eventData.event_name ||
      !eventData.event_id ||
      !eventData.custom_data.value ||
      !eventData.custom_data.content_ids
    ) {
      console.error("Missing essential event data in request body.");
      return NextResponse.json(
        {
          error:
            "Missing essential event data (event_name, event_id, value, or content_ids).",
        },
        { status: 400 }
      );
    }

    // 6. Send the event data to Meta's Conversion API
    const res = await axios.post(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      { data: [eventData] } // Meta CAPI expects an array of event objects
    );

    console.log("Meta CAPI response:", res.data);
    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error(
      "Error sending event to Meta CAPI:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
