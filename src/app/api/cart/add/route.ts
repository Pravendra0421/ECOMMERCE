// stitchxstate/src/app/api/cart/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CartUsecases } from "@/core/usecases/Cart.usecases";
import { CartRepository } from "@/core/repositories/ICartRepository";
import { validateAuth } from "../../middleware/validAuth";
import { AddToCartDTO } from "@/core/dtos/Cart.dto";

const cartUsecases = new CartUsecases(new CartRepository());

// Helper to get identifier (userId or guestId) - duplicated, consider utility
function getIdentifier(req: NextRequest, authResult: any) {
  if (authResult && authResult.userId) {
    return { id: authResult.userId, isGuest: false };
  }
  const guestId = req.headers.get("x-guest-id");
  if (guestId) {
    return { id: guestId, isGuest: true };
  }
  return { id: null, isGuest: false };
}

export async function POST(req: NextRequest) {
  const authResponse = await validateAuth(req); // Check for authenticated user
  const { id: identifier, isGuest } = getIdentifier(req, authResponse);

  if (!identifier) {
    return NextResponse.json(
      { error: "Unauthorized: No user or guest ID provided." },
      { status: 401 }
    );
  }

  let dto: AddToCartDTO;
  try {
    const body = await req.json();
    if (
      !body.productVariationId ||
      typeof body.quantity !== "number" ||
      body.quantity <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }
    dto = body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const cart = isGuest
      ? await cartUsecases.addItemToGuestCart({ ...dto, guestId: identifier }) // Pass guestId explicitly for the DTO
      : await cartUsecases.addToCart(dto, identifier);
    return NextResponse.json(cart, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
