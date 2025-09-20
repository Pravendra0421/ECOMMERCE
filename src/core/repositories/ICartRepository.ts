import {
  CartEntity,
  CartItemEntity,
  CartStatus,
} from "../entities/cart.entity";
import {
  AddToCartDTO,
  UpdateCartItemDTO,
  RemoveFromCartDTO,
  GuestCartDTO,
  MergeGuestCartDTO,
} from "../dtos/Cart.dto";
import prisma from "@/lib/prisma";
import { PrismaClient, Prisma } from "@prisma/client";

// Define a more specific type for the Prisma client methods used
type PrismaModelClient = Pick<
  PrismaClient,
  "cart" | "cartItem" | "productVariation"
>;

// Define the correct union type for Prisma client or transaction client
type PrismaClientOrTransaction = PrismaClient | Prisma.TransactionClient;

// Define the interface for the Cart Repository
export interface ICartRepository {
  // Existing methods for authenticated users
  findByUserId(
    userId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity | null>;
  create(
    userId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity>;
  addItem(
    dto: AddToCartDTO,
    identifier: string,
    isGuest: boolean
  ): Promise<CartEntity>;
  updateItem(dto: UpdateCartItemDTO): Promise<CartEntity>;
  removeItem(dto: RemoveFromCartDTO): Promise<CartEntity>;
  clearCart(identifier: string, isGuest: boolean): Promise<CartEntity>;
  getCartWithItems(
    identifier: string,
    isGuest: boolean
  ): Promise<CartEntity | null>;

  // New methods for guest users
  findByGuestId(
    guestId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity | null>;
  createGuestCart(
    guestId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity>;
  addItemToGuestCart(dto: GuestCartDTO): Promise<CartEntity>;
  mergeGuestCart(dto: MergeGuestCartDTO): Promise<CartEntity>;
}

// Implement the Cart Repository
export class CartRepository implements ICartRepository {
  private mapToCartEntity(cart: any): CartEntity {
    return {
      id: cart.id,
      userId: cart.userId ?? undefined,
      guestId: cart.guestId ?? undefined,
      items: cart.items.map((item: any) => ({
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        productVariationId: item.productVariationId,
        productVariation: {
          id: item.productVariation.id,
          productId: item.productId ?? undefined,
          size: item.productVariation.size,
          color: item.productVariation.color,
          price: item.productVariation.price,
          salePrice: item.productVariation.salePrice,
          stock: item.productVariation.stock,
          createdAt: item.productVariation.createdAt,
          updatedAt: item.productVariation.updatedAt,
          images: item.productVariation.images.map((img: any) => ({
            id: img.id,
            url: img.url,
            productVariationId: img.productVariationId ?? undefined,
            createdAt: img.createdAt,
          })),
        },
        quantity: item.quantity,
        price: item.price,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      totalAmount: cart.totalAmount,
      totalItems: cart.totalItems,
      status: cart.status as CartStatus,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      lastActivity: cart.lastActivity,
    };
  }

  // Improved updateCartTotals with better error handling
  private async updateCartTotals(
    cartId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity> {
    const client: PrismaModelClient = (txClient || prisma) as PrismaClient;
    if (!cartId) throw new Error("Cart ID is required");

    try {
      const cartItems = await client.cartItem.findMany({
        where: { cartId },
        include: { productVariation: true },
      });

      // Update prices for all items
      for (const item of cartItems) {
        await client.cartItem.update({
          where: { id: item.id },
          data: {
            price:
              item.productVariation.salePrice > 0
                ? item.productVariation.salePrice
                : item.productVariation.price,
          },
        });
      }

      // Recalculate totals
      const updatedItems = await client.cartItem.findMany({
        where: { cartId },
        include: { productVariation: true },
      });

      const totalItems = updatedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalAmount = updatedItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      const updatedCart = await client.cart.update({
        where: { id: cartId },
        data: { totalItems, totalAmount, lastActivity: new Date() },
        include: {
          items: { include: { productVariation: { include: { images: true } } } },
        },
      });

      return this.mapToCartEntity(updatedCart);
    } catch (error) {
      console.error("Error updating cart totals:", error);
      throw new Error("Failed to update cart totals");
    }
  }

  // --- Authenticated User Cart Methods ---

  async findByUserId(
    userId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity | null> {
    const client: PrismaModelClient = (txClient || prisma) as PrismaClient;
    if (!userId) throw new Error("User ID is required");

    try {
      const cart = await client.cart.findFirst({
        where: { userId, status: CartStatus.ACTIVE },
        include: {
          items: {
            select: {
              id: true,
              cartId: true,
              productId: true,
              productVariationId: true,
              quantity: true,
              price: true,
              createdAt: true,
              updatedAt: true,
              productVariation: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });

      return cart ? this.mapToCartEntity(cart) : null;
    } catch (error) {
      console.error("Error finding cart by user ID:", error);
      throw new Error("Failed to find cart by user ID");
    }
  }

  async create(
    userId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity> {
    const client: PrismaModelClient = (txClient || prisma) as PrismaClient;
    if (!userId) throw new Error("User ID is required");

    try {
      const cart = await client.cart.create({
        data: {
          userId,
          status: CartStatus.ACTIVE,
          totalAmount: 0,
          totalItems: 0,
          lastActivity: new Date(),
        },
        include: {
          items: {
            include: {
              productVariation: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });

      return this.mapToCartEntity(cart);
    } catch (error) {
      console.error("Error creating cart:", error);
      throw new Error("Failed to create cart");
    }
  }

  // --- Guest User Cart Methods ---

  async findByGuestId(
    guestId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity | null> {
    const client: PrismaModelClient = (txClient || prisma) as PrismaClient;
    if (!guestId) throw new Error("Guest ID is required");

    try {
      const cart = await client.cart.findFirst({
        where: { guestId, status: CartStatus.ACTIVE },
        include: {
          items: {
            include: {
              productVariation: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });

      return cart ? this.mapToCartEntity(cart) : null;
    } catch (error) {
      console.error("Error finding cart by guest ID:", error);
      throw new Error("Failed to find cart by guest ID");
    }
  }

  async createGuestCart(
    guestId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity> {
    const client: PrismaModelClient = (txClient || prisma) as PrismaClient;
    if (!guestId) throw new Error("Guest ID is required");

    try {
      const cart = await client.cart.create({
        data: {
          guestId,
          status: CartStatus.ACTIVE,
          totalAmount: 0,
          totalItems: 0,
          lastActivity: new Date(),
        },
        include: {
          items: {
            include: {
              productVariation: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });

      return this.mapToCartEntity(cart);
    } catch (error) {
      console.error("Error creating guest cart:", error);
      throw new Error("Failed to create guest cart");
    }
  }

  // IMPROVED: Simplified transaction with better error handling and retry logic
  async addItem(
    dto: AddToCartDTO,
    identifier: string,
    isGuest: boolean
  ): Promise<CartEntity> {
    const { productVariationId, quantity } = dto;
    if (!identifier)
      throw new Error("Identifier (User ID or Guest ID) is required");
    if (!productVariationId)
      throw new Error("Product variation ID is required");
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    // Retry logic for production deployment issues
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        return await this.performAddItemTransaction(dto, identifier, isGuest);
      } catch (error) {
        retryCount++;
        console.error(`Add item attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to add item after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
      }
    }

    throw new Error("Unexpected error in addItem");
  }

  private async performAddItemTransaction(
    dto: AddToCartDTO,
    identifier: string,
    isGuest: boolean
  ): Promise<CartEntity> {
    const { productVariationId, quantity } = dto;

    return await prisma.$transaction(async (tx) => {
      // Get or create cart
      let cart: CartEntity | null;
      if (isGuest) {
        cart = await this.findByGuestId(identifier, tx);
        if (!cart) {
          cart = await this.createGuestCart(identifier, tx);
        }
      } else {
        cart = await this.findByUserId(identifier, tx);
        if (!cart) {
          cart = await this.create(identifier, tx);
        }
      }

      if (!cart) {
        throw new Error("Cart not found or could not be created");
      }

      // Get product variation with lock to prevent race conditions
      const productVariation = await tx.productVariation.findUnique({
        where: { id: productVariationId },
        include: { images: true },
      });

      if (!productVariation) {
        throw new Error("Product variation not found");
      }

      if (productVariation.stock < quantity) {
        throw new Error("Insufficient stock");
      }

      // Check for existing item
      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_productVariationId: {
            cartId: cart.id,
            productVariationId,
          },
        },
      });

      const finalQuantity = existingItem ? existingItem.quantity + quantity : quantity;
      
      // Final stock check
      if (productVariation.stock < finalQuantity) {
        throw new Error("Insufficient stock for requested quantity");
      }

      // Update stock
      await tx.productVariation.update({
        where: { id: productVariationId },
        data: { stock: productVariation.stock - quantity },
      });

      const itemPrice = productVariation.salePrice > 0 ? productVariation.salePrice : productVariation.price;

      if (existingItem) {
        // Update existing item
        await tx.cartItem.update({
          where: {
            cartId_productVariationId: {
              cartId: cart.id,
              productVariationId,
            },
          },
          data: {
            quantity: finalQuantity,
            price: itemPrice,
          },
        });
      } else {
        // Create new item
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productVariationId,
            productId: productVariation.productId,
            quantity,
            price: itemPrice,
          },
        });
      }

      return this.updateCartTotals(cart.id, tx);
    }, {
      timeout: 10000, // 10 second timeout
    });
  }

  async addItemToGuestCart(dto: GuestCartDTO): Promise<CartEntity> {
    const { guestId, productVariationId, quantity } = dto;
    return this.addItem({ productVariationId, quantity }, guestId, true);
  }

  // IMPROVED: Better error handling for update operations
  async updateItem(dto: UpdateCartItemDTO): Promise<CartEntity> {
    const { cartItemId, quantity } = dto;
    if (!cartItemId) throw new Error("Cart item ID is required");

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        return await this.performUpdateItemTransaction(dto);
      } catch (error) {
        retryCount++;
        console.error(`Update item attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to update item after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
      }
    }

    throw new Error("Unexpected error in updateItem");
  }

  private async performUpdateItemTransaction(dto: UpdateCartItemDTO): Promise<CartEntity> {
    const { cartItemId, quantity } = dto;

    return await prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: cartItemId },
        include: { productVariation: true },
      });

      if (!cartItem) {
        throw new Error("Cart item not found");
      }

      if (quantity <= 0) {
        // Remove item and restore stock
        await tx.cartItem.delete({ where: { id: cartItemId } });
        await tx.productVariation.update({
          where: { id: cartItem.productVariationId },
          data: { stock: cartItem.productVariation.stock + cartItem.quantity },
        });
      } else {
        const quantityDiff = quantity - cartItem.quantity;
        if (cartItem.productVariation.stock < quantityDiff) {
          throw new Error("Insufficient stock");
        }

        // Update stock
        await tx.productVariation.update({
          where: { id: cartItem.productVariationId },
          data: { stock: cartItem.productVariation.stock - quantityDiff },
        });

        // Update cart item
        await tx.cartItem.update({
          where: { id: cartItemId },
          data: {
            quantity,
            price:
              cartItem.productVariation.salePrice > 0
                ? cartItem.productVariation.salePrice
                : cartItem.productVariation.price,
          },
        });
      }

      return this.updateCartTotals(cartItem.cartId, tx);
    }, {
      timeout: 10000,
    });
  }

  // IMPROVED: Better error handling for remove operations
  async removeItem(dto: RemoveFromCartDTO): Promise<CartEntity> {
    const { cartItemId } = dto;

    if (!cartItemId) throw new Error("Cart item ID is required");

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        return await this.performRemoveItemTransaction(dto);
      } catch (error) {
        retryCount++;
        console.error(`Remove item attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to remove item after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
      }
    }

    throw new Error("Unexpected error in removeItem");
  }

  private async performRemoveItemTransaction(dto: RemoveFromCartDTO): Promise<CartEntity> {
    const { cartItemId } = dto;

    return await prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: cartItemId },
        include: { productVariation: true },
      });

      if (!cartItem) {
        throw new Error("Cart item not found");
      }

      // Remove item and restore stock
      await tx.cartItem.delete({ where: { id: cartItemId } });
      await tx.productVariation.update({
        where: { id: cartItem.productVariationId },
        data: { stock: cartItem.productVariation.stock + cartItem.quantity },
      });

      return this.updateCartTotals(cartItem.cartId, tx);
    }, {
      timeout: 10000,
    });
  }

  // IMPROVED: Better error handling for clear operations
  async clearCart(identifier: string, isGuest: boolean): Promise<CartEntity> {
    if (!identifier) throw new Error("Identifier is required");

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        return await this.performClearCartTransaction(identifier, isGuest);
      } catch (error) {
        retryCount++;
        console.error(`Clear cart attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to clear cart after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
      }
    }

    throw new Error("Unexpected error in clearCart");
  }

  private async performClearCartTransaction(identifier: string, isGuest: boolean): Promise<CartEntity> {
    return await prisma.$transaction(async (tx) => {
      const whereClause = isGuest
        ? { guestId: identifier }
        : { userId: identifier };
      
      const cart = await tx.cart.findFirst({
        where: { ...whereClause, status: CartStatus.ACTIVE },
        include: { items: { include: { productVariation: true } } },
      });

      if (!cart) {
        throw new Error("Cart not found for this identifier");
      }

      // Restore stock for all items
      for (const item of cart.items) {
        await tx.productVariation.update({
          where: { id: item.productVariationId },
          data: { stock: item.productVariation.stock + item.quantity },
        });
      }

      // Remove all cart items
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return this.updateCartTotals(cart.id, tx);
    }, {
      timeout: 15000, // Longer timeout for clear operations
    });
  }

  async getCartWithItems(
    identifier: string,
    isGuest: boolean
  ): Promise<CartEntity | null> {
    if (!identifier) throw new Error("Identifier is required");

    try {
      const whereClause = isGuest
        ? { guestId: identifier }
        : { userId: identifier };

      const cart = await prisma.cart.findFirst({
        where: { ...whereClause, status: CartStatus.ACTIVE },
        include: {
          items: {
            include: {
              productVariation: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });

      return cart ? this.mapToCartEntity(cart) : null;
    } catch (error) {
      console.error("Error getting cart with items:", error);
      throw new Error("Failed to get cart with items");
    }
  }

  async mergeGuestCart(dto: MergeGuestCartDTO): Promise<CartEntity> {
    const { guestId, userId } = dto;
    if (!guestId || !userId) {
      throw new Error("Guest ID and User ID are required for merging carts.");
    }

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        return await this.performMergeGuestCartTransaction(dto);
      } catch (error) {
        retryCount++;
        console.error(`Merge cart attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to merge cart after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
      }
    }

    throw new Error("Unexpected error in mergeGuestCart");
  }

  private async performMergeGuestCartTransaction(dto: MergeGuestCartDTO): Promise<CartEntity> {
    const { guestId, userId } = dto;

    return await prisma.$transaction(async (tx) => {
      const guestCart = await tx.cart.findFirst({
        where: { guestId, status: CartStatus.ACTIVE },
        include: { items: true },
      });

      if (!guestCart) {
        throw new Error("Guest cart not found or is not active.");
      }

      let userCart = await tx.cart.findFirst({
        where: { userId, status: CartStatus.ACTIVE },
        include: { items: true },
      });

      if (!userCart) {
        // Create a new cart for the user if they don't have one
        userCart = await tx.cart.create({
          data: {
            userId,
            status: CartStatus.ACTIVE,
            totalAmount: 0,
            totalItems: 0,
          },
          include: {
            items: {
              include: {
                productVariation: {
                  include: { images: true },
                },
              },
            },
          },
        });
      }

      for (const guestItem of guestCart.items) {
        const existingUserItem = userCart.items.find(
          (item) => item.productVariationId === guestItem.productVariationId
        );

        const productVariation = await tx.productVariation.findUnique({
          where: { id: guestItem.productVariationId },
        });

        if (!productVariation) {
          continue;
        }

        if (existingUserItem) {
          // Update quantity for existing item in user cart
          await tx.cartItem.update({
            where: { id: existingUserItem.id },
            data: {
              quantity: existingUserItem.quantity + guestItem.quantity,
              price:
                productVariation.salePrice > 0
                  ? productVariation.salePrice
                  : productVariation.price,
            },
          });
        } else {
          // Create new item in user cart
          await tx.cartItem.create({
            data: {
              cartId: userCart.id,
              productVariationId: guestItem.productVariationId,
              productId: guestItem.productId,
              quantity: guestItem.quantity,
              price:
                productVariation.salePrice > 0
                  ? productVariation.salePrice
                  : productVariation.price,
            },
          });
        }
      }

      // Deactivate the guest cart after merging
      await tx.cart.update({
        where: { id: guestCart.id },
        data: { status: CartStatus.COMPLETED },
      });

      // Recalculate and update the user's cart totals
      return this.updateCartTotals(userCart.id, tx);
    }, {
      timeout: 15000,
    });
  }
}
