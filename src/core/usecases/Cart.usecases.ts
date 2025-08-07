// core/usecases/CartUsecases.ts
import { ICartRepository } from "../repositories/ICartRepository";
import {
  AddToCartDTO,
  UpdateCartItemDTO,
  RemoveFromCartDTO,
  GuestCartDTO,
  MergeGuestCartDTO,
} from "../dtos/Cart.dto";
import { CartEntity } from "../entities/cart.entity";

export class CartUsecases {
  constructor(private cartRepository: ICartRepository) {}

  // --- Authenticated User Cart Operations ---

  async getOrCreateCart(userId: string): Promise<CartEntity> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
      if (!cart) {
        throw new Error(
          "Failed to create cart after not finding existing one."
        );
      }
    }
    return cart;
  }

  async getCart(userId: string): Promise<CartEntity> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    // Pass isGuest: false for authenticated users
    const cart = await this.cartRepository.getCartWithItems(userId, false);
    if (!cart) {
      throw new Error("Cart not found for user.");
    }
    return cart;
  }

  async addToCart(dto: AddToCartDTO, userId: string): Promise<CartEntity> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!dto.productVariationId || dto.quantity <= 0) {
      throw new Error("Invalid product variation ID or quantity");
    }
    // Pass isGuest: false for authenticated users
    return this.cartRepository.addItem(dto, userId, false);
  }

  async clearCart(userId: string): Promise<CartEntity> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    // Pass isGuest: false for authenticated users
    return this.cartRepository.clearCart(userId, false);
  }

  // updateCartItem and removeCartItem don't change as they operate on cartItemId directly.
  async updateCartItem(dto: UpdateCartItemDTO): Promise<CartEntity> {
    if (!dto.cartItemId) {
      throw new Error("Cart item ID is required");
    }
    if (dto.quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }
    return this.cartRepository.updateItem(dto);
  }

  async removeCartItem(dto: RemoveFromCartDTO): Promise<CartEntity> {
    if (!dto.cartItemId) {
      throw new Error("Cart item ID is required");
    }
    return this.cartRepository.removeItem(dto);
  }

  // --- Guest User Cart Operations ---

  async getOrCreateGuestCart(guestId: string): Promise<CartEntity> {
    if (!guestId) {
      throw new Error("Guest ID is required");
    }
    let cart = await this.cartRepository.findByGuestId(guestId);
    if (!cart) {
      cart = await this.cartRepository.createGuestCart(guestId);
      if (!cart) {
        throw new Error(
          "Failed to create guest cart after not finding existing one."
        );
      }
    }
    return cart;
  }

  async getGuestCart(guestId: string): Promise<CartEntity> {
    if (!guestId) {
      throw new Error("Guest ID is required");
    }
    // Pass isGuest: true for guest users
    const cart = await this.cartRepository.getCartWithItems(guestId, true);
    if (!cart) {
      throw new Error("Guest cart not found.");
    }
    return cart;
  }

  async addItemToGuestCart(dto: GuestCartDTO): Promise<CartEntity> {
    if (!dto.guestId || !dto.productVariationId || dto.quantity <= 0) {
      throw new Error("Invalid guest ID, product variation ID, or quantity");
    }
    // Calls the repository's specific guest add method
    return this.cartRepository.addItemToGuestCart(dto);
  }

  async clearGuestCart(guestId: string): Promise<CartEntity> {
    if (!guestId) {
      throw new Error("Guest ID is required");
    }
    // Pass isGuest: true for guest users
    return this.cartRepository.clearCart(guestId, true);
  }

  async mergeGuestCartIntoUserCart(
    dto: MergeGuestCartDTO
  ): Promise<CartEntity> {
    if (!dto.guestId || !dto.userId) {
      throw new Error("Guest ID and User ID are required for merging.");
    }
    return this.cartRepository.mergeGuestCart(dto);
  }
}
