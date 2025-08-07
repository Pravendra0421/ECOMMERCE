import {
  CartEntity,
  CartItemEntity,
  CartStatus,
} from "../entities/cart.entity";
import {
  AddToCartDTO,
  UpdateCartItemDTO,
  RemoveFromCartDTO,
  GuestCartDTO, // Import the new DTO
  MergeGuestCartDTO,
} from "../dtos/Cart.dto";
import prisma from "@/lib/prisma"; // Assuming this is your global PrismaClient instance
import { PrismaClient, Prisma } from "@prisma/client";

// Define a more specific type for the Prisma client methods used
type PrismaModelClient = Pick<
  PrismaClient,
  "cart" | "cartItem" | "productVariation" // Only include models/methods you actually use with 'tx' or 'prisma'
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
  ): Promise<CartEntity>; // This method will be updated to handle guestId too
  updateItem(dto: UpdateCartItemDTO): Promise<CartEntity>;
  removeItem(dto: RemoveFromCartDTO): Promise<CartEntity>;
  clearCart(identifier: string, isGuest: boolean): Promise<CartEntity>; // Modified to accept identifier and a flag
  getCartWithItems(
    identifier: string,
    isGuest: boolean
  ): Promise<CartEntity | null>; // Modified to accept identifier and a flag

  // New methods for guest users
  findByGuestId(
    guestId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity | null>;
  createGuestCart(
    guestId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity>;
  addItemToGuestCart(dto: GuestCartDTO): Promise<CartEntity>; // Specific for adding to guest cart
  mergeGuestCart(dto: MergeGuestCartDTO): Promise<CartEntity>;
}

// Implement the Cart Repository
export class CartRepository implements ICartRepository {
  private mapToCartEntity(cart: any): CartEntity {
    return {
      id: cart.id,
      userId: cart.userId ?? undefined,
      guestId: cart.guestId ?? undefined, // Map guestId
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

  private async updateCartTotals(
    cartId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity> {
    const client: PrismaModelClient = (txClient || prisma) as PrismaClient;
    if (!cartId) throw new Error("Cart ID is required");

    const cartItems = await client.cartItem.findMany({
      where: { cartId },
      include: { productVariation: true },
    });

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
  }

  // --- Authenticated User Cart Methods ---

  async findByUserId(
    userId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity | null> {
    const client: PrismaModelClient = (txClient || prisma) as PrismaClient;
    if (!userId) throw new Error("User ID is required");

    const cart = await client.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE },
      include: {
        items: {
          // Explicitly select the fields you need from CartItem
          select: {
            id: true,
            cartId: true,
            productId: true, // <--- ADD THIS LINE
            productVariationId: true,
            quantity: true,
            price: true,
            createdAt: true,
            updatedAt: true,
            productVariation: {
              // Still include the relation
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    return cart ? this.mapToCartEntity(cart) : null;
  }

  async create(
    userId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity> {
    const client: PrismaModelClient = (txClient || prisma) as PrismaClient;
    if (!userId) throw new Error("User ID is required");

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
  }

  // --- Guest User Cart Methods ---

  async findByGuestId(
    guestId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity | null> {
    const client: PrismaModelClient = (txClient || prisma) as PrismaClient;
    if (!guestId) throw new Error("Guest ID is required");

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
  }

  async createGuestCart(
    guestId: string,
    txClient?: PrismaClientOrTransaction
  ): Promise<CartEntity> {
    const client: PrismaModelClient = (txClient || prisma) as PrismaClient;
    if (!guestId) throw new Error("Guest ID is required");

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
  }

  // --- Unified Add Item (for both user and guest) ---
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

    return await prisma.$transaction(async (tx) => {
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

      await tx.productVariation.update({
        where: { id: productVariationId },
        data: { stock: productVariation.stock - quantity },
      });

      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_productVariationId: {
            cartId: cart.id,
            productVariationId,
          },
        },
      });

      if (existingItem) {
        await tx.cartItem.update({
          where: {
            cartId_productVariationId: {
              cartId: cart.id,
              productVariationId,
            },
          },
          data: {
            quantity: existingItem.quantity + quantity,
            price:
              productVariation.salePrice > 0
                ? productVariation.salePrice
                : productVariation.price,
          },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productVariationId,
            productId: productVariation.productId,
            quantity,
            price:
              productVariation.salePrice > 0
                ? productVariation.salePrice
                : productVariation.price,
          },
        });
      }

      return this.updateCartTotals(cart.id, tx);
    });
  }

  async addItemToGuestCart(dto: GuestCartDTO): Promise<CartEntity> {
    const { guestId, productVariationId, quantity } = dto;
    return this.addItem({ productVariationId, quantity }, guestId, true);
  }

  async updateItem(dto: UpdateCartItemDTO): Promise<CartEntity> {
    const { cartItemId, quantity } = dto;
    if (!cartItemId) throw new Error("Cart item ID is required");

    return await prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: cartItemId },
        include: { productVariation: true },
      });

      if (!cartItem) {
        throw new Error("Cart item not found");
      }

      if (quantity <= 0) {
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

        await tx.productVariation.update({
          where: { id: cartItem.productVariationId },
          data: { stock: cartItem.productVariation.stock - quantityDiff },
        });

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
    });
  }

  async removeItem(dto: RemoveFromCartDTO): Promise<CartEntity> {
    const { cartItemId } = dto;

    if (!cartItemId) throw new Error("Cart item ID is required");

    return await prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: cartItemId },
        include: { productVariation: true },
      });

      if (!cartItem) {
        throw new Error("Cart item not found");
      }

      await tx.cartItem.delete({ where: { id: cartItemId } });

      await tx.productVariation.update({
        where: { id: cartItem.productVariationId },
        data: { stock: cartItem.productVariation.stock + cartItem.quantity },
      });

      return this.updateCartTotals(cartItem.cartId, tx);
    });
  }

  async clearCart(identifier: string, isGuest: boolean): Promise<CartEntity> {
    if (!identifier) throw new Error("Identifier is required");

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

      for (const item of cart.items) {
        await tx.productVariation.update({
          where: { id: item.productVariationId },
          data: { stock: item.productVariation.stock + item.quantity },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return this.updateCartTotals(cart.id, tx);
    });
  }

  async getCartWithItems(
    identifier: string,
    isGuest: boolean
  ): Promise<CartEntity | null> {
    if (!identifier) throw new Error("Identifier is required");

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
  }

  async mergeGuestCart(dto: MergeGuestCartDTO): Promise<CartEntity> {
    const { guestId, userId } = dto;
    if (!guestId || !userId) {
      throw new Error("Guest ID and User ID are required for merging carts.");
    }

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
          // FIX: Include items here so the type matches expectations
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
        // FIX: Ensure userCart is treated as non-null here.
        // The include in create above should resolve the type issue,
        // but if TypeScript still complains, a non-null assertion (!) can be used.
        const existingUserItem = userCart.items.find(
          (item) => item.productVariationId === guestItem.productVariationId
        );

        const productVariation = await tx.productVariation.findUnique({
          where: { id: guestItem.productVariationId },
        });

        if (!productVariation) {
          // Skip if product variation not found, or handle as an error/log
          continue;
        }

        if (existingUserItem) {
          // Update quantity for existing item in user cart
          await tx.cartItem.update({
            where: { id: existingUserItem.id },
            data: {
              quantity: existingUserItem.quantity + guestItem.quantity,
              // Update price to current, in case it changed
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
              productId: guestItem.productId, // Make sure productId is transferred
              quantity: guestItem.quantity,
              price:
                productVariation.salePrice > 0
                  ? productVariation.salePrice
                  : productVariation.price,
            },
          });
        }
        // No need to update stock here as stock was already reduced when item was added to guest cart
        // If you want to handle stock on merge, you'd need to consider if user already had the item
      }

      // Deactivate the guest cart after merging
      await tx.cart.update({
        where: { id: guestCart.id },
        data: { status: CartStatus.COMPLETED }, // Or 'ABANDONED', or delete if preferred
      });

      // Recalculate and update the user's cart totals
      return this.updateCartTotals(userCart.id, tx);
    });
  }
}
