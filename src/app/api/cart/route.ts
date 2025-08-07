// stitchxstate/src/app/api/cart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CartUsecases } from "@/core/usecases/Cart.usecases";
import { CartRepository } from "@/core/repositories/ICartRepository";
import { validateAuth } from "../middleware/validAuth";

const cartUsecases = new CartUsecases(new CartRepository());

// Helper to get identifier (userId or guestId)
function getIdentifier(req: NextRequest, authResult: any) {
  if (authResult && authResult.userId) {
    return { id: authResult.userId, isGuest: false };
  }
  const guestId = req.headers.get("x-guest-id"); // Using a custom header for guest ID
  if (guestId) {
    return { id: guestId, isGuest: true };
  }
  return { id: null, isGuest: false }; // No identifier found
}

export async function GET(req: NextRequest) {
  const authResponse = await validateAuth(req);
  const { id: identifier, isGuest } = getIdentifier(req, authResponse);

  if (!identifier) {
    return NextResponse.json(
      { error: "Unauthorized: No user or guest ID provided." },
      { status: 401 }
    );
  }

  try {
    const cart = isGuest
      ? await cartUsecases.getGuestCart(identifier)
      : await cartUsecases.getCart(identifier);
    return NextResponse.json(cart, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResponse = await validateAuth(req);
  const { id: identifier, isGuest } = getIdentifier(req, authResponse);

  if (!identifier) {
    // If no guest ID is provided, generate one and return it
    const newGuestId = `guest-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    try {
      const cart = await cartUsecases.getOrCreateGuestCart(newGuestId);
      // It's good practice to send the guest ID back to the client
      return NextResponse.json(
        { ...cart, guestId: newGuestId },
        { status: 200 }
      );
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: 400 }
      );
    }
  }

  try {
    const cart = isGuest
      ? await cartUsecases.getOrCreateGuestCart(identifier)
      : await cartUsecases.getOrCreateCart(identifier);
    return NextResponse.json(cart, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authResponse = await validateAuth(req);
  const { id: identifier, isGuest } = getIdentifier(req, authResponse);

  if (!identifier) {
    return NextResponse.json(
      { error: "Unauthorized: No user or guest ID provided." },
      { status: 401 }
    );
  }

  try {
    const cart = isGuest
      ? await cartUsecases.clearGuestCart(identifier)
      : await cartUsecases.clearCart(identifier);
    return NextResponse.json(cart, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
