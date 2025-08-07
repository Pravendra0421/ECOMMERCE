import { NextRequest, NextResponse } from "next/server";
import { OrderUseCase } from "@/core/usecases/Order.usecase";
import { OrderRepository } from "@/core/repositories/IOrderRepository";
import { ProductRepository } from "@/core/repositories/IProductRepository";
import { PrismaUserRepository } from "@/core/repositories/IUserRepository";
import { CartRepository } from "@/core/repositories/ICartRepository";
import { validateAuth } from "../../middleware/validAuth";
import { UpdateOrderDto } from "@/core/dtos/Order.dto";
const orderRepository = new OrderRepository();
const cartRepository = new CartRepository();
const userRepository = new PrismaUserRepository();
const productRepository = new ProductRepository();
const orderUseCase = new OrderUseCase(
  orderRepository,
  cartRepository,
  userRepository,
  productRepository
);
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID is required." },
        { status: 400 }
      );
    }
    // const auth = await validateAuth(req);

    // if (auth instanceof NextResponse) return auth;

    // if (!auth) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // const requestingUserId = auth.userId;

    // if (!requestingUserId) {
    //   return NextResponse.json(
    //     { message: "User ID is required for authorization." },
    //     { status: 401 }
    //   );
    // }

    const success = await orderUseCase.deleteOrder(orderId);

    if (success) {
      return NextResponse.json(
        { message: `Order ${orderId} deleted successfully.` },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: `Failed to delete order ${orderId}.` },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error deleting order:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ message: error.message }, { status: 403 }); // Forbidden
    }
    return NextResponse.json(
      {
        message: "Failed to delete order.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID is required." },
        { status: 400 }
      );
    }

    const auth = await validateAuth(req);

    if (auth instanceof NextResponse) return auth;

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.userId;
    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required." },
        { status: 401 }
      );
    }

    const order = await orderUseCase.getOrderDetailForAdmin(orderId, userId);

    return NextResponse.json({ order }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching admin order details:", error);
    if (error.message.includes("Order not found")) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      {
        message: "Failed to fetch order details.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await validateAuth(req);
    if (auth instanceof NextResponse) return auth;

    // Extract orderId from the URL path
    const url = new URL(req.url);
    // Assumes route is /api/orders/[orderId]
    const segments = url.pathname.split("/");
    const orderId = segments[segments.length - 1];
    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID is required." },
        { status: 400 }
      );
    }

    const updateData = await req.json();

    const updatedOrder = await orderUseCase.updateOrder(orderId, updateData);

    if (!updatedOrder) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order: updatedOrder }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { message: "Failed to update order.", error: error.message },
      { status: 500 }
    );
  }
}
