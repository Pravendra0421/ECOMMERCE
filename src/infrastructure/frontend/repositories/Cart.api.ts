// src/lib/cartApi.ts
import { CartEntity, CartStatus } from "@/core/entities/cart.entity";
import {
  AddToCartDTO,
  RemoveFromCartDTO,
  UpdateCartItemDTO,
  MergeGuestCartDTO,
  GuestCartDTO,
} from "@/core/dtos/Cart.dto";
import { ICartRepository } from "@/core/repositories/ICartRepository"; // Import the interface
import { PrismaClient, Prisma } from "@prisma/client"; // Import for type compatibility, though not used for actual Prisma operations

// Define the correct union type for Prisma client or transaction client
type PrismaClientOrTransaction = PrismaClient | Prisma.TransactionClient;

// Helper function to parse JSON data into CartEntity
const parseCartEntity = (data: any): CartEntity => {
  if (!data || typeof data.id !== "string") {
    throw new Error("Invalid cart data structure");
  }

  return {
    id: data.id,
    userId: data.userId || undefined, // Ensure userId is undefined if null
    guestId: data.guestId || undefined, // Ensure guestId is undefined if null
    items: data.items.map((item: any) => ({
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      productVariationId: item.productVariationId,
      productVariation: {
        ...item.productVariation,
        createdAt: new Date(item.productVariation.createdAt),
        updatedAt: new Date(item.productVariation.updatedAt),
        images: item.productVariation.images.map((img: any) => ({
          ...img,
          createdAt: new Date(img.createdAt),
        })),
      },
      quantity: item.quantity,
      price: item.price,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })),
    totalAmount: data.totalAmount,
    totalItems: data.totalItems,
    status: data.status as CartStatus,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    lastActivity: new Date(data.lastActivity),
  };
};

// --- Client-side Guest ID Management ---
function getGuestIdFromClient(): string | null {
  return localStorage.getItem("guestId");
}

function setGuestIdOnClient(guestId: string) {
  localStorage.setItem("guestId", guestId);
}

function removeGuestIdFromClient() {
  localStorage.removeItem("guestId");
}

// Implement the ICartRepository interface
export class CartApiRepository implements ICartRepository {
  private baseUrl: string;

  constructor(baseUrl: string = "/api/cart") {
    this.baseUrl = baseUrl;
  }

  // Helper to add authentication and guest headers to requests
  private async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const guestId = getGuestIdFromClient();
    const headers = new Headers(options.headers);

    if (guestId) {
      headers.set("x-guest-id", guestId); // Add guest ID to header for backend to identify guest carts
    }

    // IMPORTANT: Add your actual user authentication token here if available.
    // const authToken = getAuthToken();
    // if (authToken) {
    //   headers.set('Authorization', `Bearer ${authToken}`);
    // }

    return fetch(url, { ...options, headers });
  }

  /**
   * ICartRepository method: findByUserId
   * On the client-side, this will call the generic /api/cart GET endpoint.
   * The backend will determine the user based on authentication.
   * txClient is ignored as it's a server-side concept.
   */
  async findByUserId(
    userId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity | null> {
    // userId is not directly used in the client-side fetch, as auth is handled by middleware/headers.
    // txClient is ignored.
    const response = await this.fetchWithAuth(`${this.baseUrl}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        return null;
      }
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch cart by user ID.");
    }

    const data = await response.json();
    if (data.guestId && !getGuestIdFromClient()) {
      setGuestIdOnClient(data.guestId);
    }
    return parseCartEntity(data);
  }

  /**
   * ICartRepository method: create
   * On the client-side, this calls the generic /api/cart POST endpoint.
   * The backend will create a user cart if authenticated.
   * txClient is ignored.
   */
  async create(
    userId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity> {
    // userId is not directly used in the client-side fetch body, as auth is handled by middleware.
    // txClient is ignored.
    const response = await this.fetchWithAuth(`${this.baseUrl}`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create cart.");
    }

    const data = await response.json();
    if (data.guestId && !getGuestIdFromClient()) {
      setGuestIdOnClient(data.guestId);
    }
    return parseCartEntity(data);
  }

  /**
   * ICartRepository method: addItem
   * This is the unified method. On the client, we determine if it's a guest or user
   * by checking for the presence of a guestId in local storage.
   * The 'identifier' and 'isGuest' parameters are used here to guide the API call.
   */
  async addItem(
    dto: AddToCartDTO,
    identifier: string,
    isGuest: boolean
  ): Promise<CartEntity> {
    // In the client-side API, `identifier` and `isGuest` are redundant if `fetchWithAuth`
    // correctly sets the `x-guest-id` header based on `localStorage` and `authToken`.
    // However, to strictly adhere to the interface, we keep the signature.
    // The actual API call remains the same.
    const response = await this.fetchWithAuth(`${this.baseUrl}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add item to cart.");
    }

    const data = await response.json();
    return parseCartEntity(data);
  }

  /**
   * ICartRepository method: updateItem
   * Directly maps to the existing client-side updateItem.
   */
  async updateItem(dto: UpdateCartItemDTO): Promise<CartEntity> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/item`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update cart item.");
    }

    const data = await response.json();
    return parseCartEntity(data);
  }

  /**
   * ICartRepository method: removeItem
   * Directly maps to the existing client-side removeItem.
   */
  async removeItem(dto: RemoveFromCartDTO): Promise<CartEntity> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/item`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to remove cart item.");
    }

    const data = await response.json();
    return parseCartEntity(data);
  }

  /**
   * ICartRepository method: clearCart
   * Clears all items from the current cart (user or guest).
   * The backend determines the target cart based on headers.
   */
  async clearCart(identifier: string, isGuest: boolean): Promise<CartEntity> {
    // identifier and isGuest are used by the backend to identify the cart.
    // On the client-side, the fetchWithAuth helper already sends the guestId header
    // or relies on existing authentication. So, these parameters are not directly
    // used in the fetch call body/query, but are part of the interface.
    const response = await this.fetchWithAuth(`${this.baseUrl}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to clear cart.");
    }

    const data = await response.json();
    return parseCartEntity(data);
  }

  /**
   * ICartRepository method: getCartWithItems
   * Fetches the current cart for the authenticated user or guest.
   * The backend determines if it's a user or guest based on headers.
   */
  async getCartWithItems(
    identifier: string,
    isGuest: boolean
  ): Promise<CartEntity | null> {
    // Similar to findByUserId, the identifier and isGuest are handled implicitly by fetchWithAuth.
    const response = await this.fetchWithAuth(`${this.baseUrl}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        return null;
      }
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch cart with items.");
    }

    const data = await response.json();
    if (data.guestId && !getGuestIdFromClient()) {
      setGuestIdOnClient(data.guestId);
    }
    return parseCartEntity(data);
  }

  /**
   * ICartRepository method: findByGuestId
   * On the client-side, this will call the generic /api/cart GET endpoint.
   * The backend will determine the guest based on the 'x-guest-id' header.
   * txClient is ignored.
   */
  async findByGuestId(
    guestId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity | null> {
    // guestId is not directly used in the client-side fetch, as it's sent via 'x-guest-id' header.
    // txClient is ignored.
    const response = await this.fetchWithAuth(`${this.baseUrl}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        return null;
      }
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch cart by guest ID.");
    }

    const data = await response.json();
    if (data.guestId && !getGuestIdFromClient()) {
      setGuestIdOnClient(data.guestId);
    }
    return parseCartEntity(data);
  }

  /**
   * ICartRepository method: createGuestCart
   * On the client-side, this calls the generic /api/cart POST endpoint.
   * The backend will create a guest cart if no user is authenticated and no guestId is present.
   * txClient is ignored.
   */
  async createGuestCart(
    guestId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity> {
    // guestId is not directly used in the client-side fetch body, as it's handled by the backend
    // if a new one needs to be generated. If client already has one, it's sent via header.
    // txClient is ignored.
    const response = await this.fetchWithAuth(`${this.baseUrl}`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create guest cart.");
    }

    const data = await response.json();
    if (data.guestId && !getGuestIdFromClient()) {
      setGuestIdOnClient(data.guestId);
    }
    return parseCartEntity(data);
  }

  /**
   * ICartRepository method: addItemToGuestCart
   * This is a specific method for adding to a guest cart.
   * It calls the unified addItem endpoint, relying on fetchWithAuth to send the guestId.
   */
  async addItemToGuestCart(dto: GuestCartDTO): Promise<CartEntity> {
    // The dto for GuestCartDTO contains guestId, but the backend /api/cart/add
    // endpoint expects AddToCartDTO and infers guest/user from headers.
    // So we extract productVariationId and quantity.
    const { productVariationId, quantity } = dto;
    const addToCartDto: AddToCartDTO = { productVariationId, quantity };

    const response = await this.fetchWithAuth(`${this.baseUrl}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(addToCartDto),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add item to guest cart.");
    }

    const data = await response.json();
    return parseCartEntity(data);
  }

  /**
   * ICartRepository method: mergeGuestCart
   * Merges a guest cart into a user's cart upon login.
   * This method expects the guestId and userId to be sent in the DTO.
   */
  async mergeGuestCart(dto: MergeGuestCartDTO): Promise<CartEntity> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(dto), // dto contains guestId and userId
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to merge guest cart.");
    }

    // IMPORTANT: After successful merge, remove the guestId from client storage
    removeGuestIdFromClient();

    const data = await response.json();
    return parseCartEntity(data);
  }
}
