// stitchxstate/src/app/api/cart/merge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CartUsecases } from "@/core/usecases/Cart.usecases";
import { CartRepository } from "@/core/repositories/ICartRepository";
import { validateAuth } from "../../middleware/validAuth";
import { MergeGuestCartDTO } from "@/core/dtos/Cart.dto";

const cartUsecases = new CartUsecases(new CartRepository());

export async function POST(req: NextRequest) {
  // Ensure the user is authenticated (they just logged in)
  const auth = await validateAuth(req);
  if (auth instanceof NextResponse) return auth;

  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized: User ID is required for merging." },
      { status: 401 }
    );
  }

  let dto: MergeGuestCartDTO;
  try {
    const body = await req.json();
    if (!body.guestId) {
      return NextResponse.json(
        { error: "Invalid guestId in request body." },
        { status: 400 }
      );
    }
    dto = { guestId: body.guestId, userId }; // Assign userId from auth
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const mergedCart = await cartUsecases.mergeGuestCartIntoUserCart(dto);
    return NextResponse.json(mergedCart, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
