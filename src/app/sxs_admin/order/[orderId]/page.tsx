import React from "react";
import { OrderRepository } from "@/core/repositories/IOrderRepository";
import { PrismaUserRepository } from "@/core/repositories/IUserRepository";
import { CartRepository } from "@/core/repositories/ICartRepository";
import { ProductRepository } from "@/core/repositories/IProductRepository";
import { OrderUseCase } from "@/core/usecases/Order.usecase";
import OrderDetailView from "../(_component)/orderDetailview";
import { orderEntity } from "@/core/entities/order.entity";
import { notFound } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
interface OrderDetailPageProps {
  params: {
    orderId: string;
  };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const orderRepository = new OrderRepository();
  const userRepository = new PrismaUserRepository();
  const cartRepository = new CartRepository();
  const productRepository = new ProductRepository();
  const orderUseCase = new OrderUseCase(
    orderRepository,
    cartRepository,
    userRepository,
    productRepository
  );

  let order: orderEntity | null = null;

  try {
    // For admin, we'll use a different approach to get order details
    // Since the current getOrderDetail requires userId, we'll need to modify this
    const allOrders = await orderUseCase.getAllOrdersForAdmin();
    order = allOrders.find((o) => o.id === orderId) || null;

    if (!order) {
      notFound();
    }
  } catch (error: any) {
    console.error("Error fetching order:", error);
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        <p className="text-gray-600">Order ID: {orderId}</p>
      </div>
      <ScrollArea className="h-[80vh] w-full ">
        <OrderDetailView order={order} />
      </ScrollArea>
    </div>
  );
}
