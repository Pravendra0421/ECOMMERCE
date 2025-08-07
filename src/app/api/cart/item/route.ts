// stitchxstate/src/app/api/cart/item/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CartUsecases } from "@/core/usecases/Cart.usecases";
import { CartRepository } from "@/core/repositories/ICartRepository";
import { validateAuth } from "../../middleware/validAuth";
import { UpdateCartItemDTO, RemoveFromCartDTO } from "@/core/dtos/Cart.dto";

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

export async function PUT(req: NextRequest) {
  const authResponse = await validateAuth(req);
  const { id: identifier, isGuest } = getIdentifier(req, authResponse);

  // Allow if either user is authenticated or a guest ID is provided
  if (!identifier) {
    return NextResponse.json(
      { error: "Unauthorized: No user or guest ID provided." },
      { status: 401 }
    );
  }

  let dto: UpdateCartItemDTO;
  try {
    const body = await req.json();
    if (!body.cartItemId || typeof body.quantity !== "number") {
      return NextResponse.json(
        { error: "Invalid cartItemId or quantity" },
        { status: 400 }
      );
    }
    dto = body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Note: updateCartItem operates directly on cartItemId, so it's cart type agnostic.
    const cart = await cartUsecases.updateCartItem(dto);
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

  // Allow if either user is authenticated or a guest ID is provided
  if (!identifier) {
    return NextResponse.json(
      { error: "Unauthorized: No user or guest ID provided." },
      { status: 401 }
    );
  }

  let dto: RemoveFromCartDTO;
  try {
    const body = await req.json();
    if (!body.cartItemId) {
      return NextResponse.json(
        { error: "Invalid cartItemId" },
        { status: 400 }
      );
    }
    dto = body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Note: removeCartItem operates directly on cartItemId, so it's cart type agnostic.
    const cart = await cartUsecases.removeCartItem(dto);
    return NextResponse.json(cart, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
