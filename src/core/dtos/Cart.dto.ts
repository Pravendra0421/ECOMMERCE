export interface AddToCartDTO {
  productVariationId: string;
  quantity: number;
}

export interface UpdateCartItemDTO {
  cartItemId: string; // Update a specific cart item
  quantity: number;
}

// DTO for removing an item from the cart
export interface RemoveFromCartDTO {
  cartItemId: string;
}

export interface ClearCartDTO {
  cartId: string;
}

// DTO for guest cart operations
export interface GuestCartDTO {
  guestId: string;
  productVariationId: string;
  quantity: number;
}

// DTO for merging guest cart with user cart
export interface MergeGuestCartDTO {
  guestId: string;
  userId: string;
}
