"use client";
import { orderEntity } from "@/core/entities/order.entity";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderApiRepository } from "@/infrastructure/frontend/repositories/OrderRepository.api";
import { OrderUseCase } from "@/core/usecases/Order.usecase";
import { PrismaUserRepository } from "@/core/repositories/IUserRepository";
import { CartRepository } from "@/core/repositories/ICartRepository";
import { ProductRepository } from "@/core/repositories/IProductRepository";
import toast from "react-hot-toast";
interface OrderDetailViewProps {
  order: orderEntity;
}

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default function OrderDetailView({ order }: OrderDetailViewProps) {
  const router = useRouter();
  const orderRepository = new OrderApiRepository();
  const userRepository = new PrismaUserRepository();
  const cartRepository = new CartRepository();
  const productRepository = new ProductRepository();
  const orderUseCase = new OrderUseCase(
    orderRepository,
    cartRepository,
    userRepository,
    productRepository
  );
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    if (
      window.confirm(
        `Are you sure you want to update the order status to "${newStatus}"?`
      )
    ) {
      setUpdatingStatus(true);
      try {
        await orderUseCase.updateOrder(order.id, { status: newStatus });
        toast.success("Order status updated successfully");
        router.refresh();
      } catch (error) {
        toast.error("Error updating order status");
      } finally {
        setUpdatingStatus(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "REFUNDED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Order Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Order #{order.id}
            </h2>
            <p className="text-gray-600">
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
              <select
                value={order.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updatingStatus}
                className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {updatingStatus && (
                <span className="text-sm text-gray-500">Updating...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Order Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">₹{order.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items:</span>
              <span className="font-semibold">{order.items.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Customer Information
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Email:</span>
              <p className="font-semibold">{order.contactInfo.email}</p>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <p className="font-semibold">{order.contactInfo.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Shipping Address
        </h3>
        <div className="text-gray-700">
          <p>
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </p>
          <p>{order.shippingAddress.address1}</p>
          {order.shippingAddress.address2 && (
            <p>{order.shippingAddress.address2}</p>
          )}
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.postalCode}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Order Items
        </h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-4 p-3 bg-white rounded border"
            >
              <div className="flex-shrink-0">
                {item.productVariation.images &&
                item.productVariation.images.length > 0 ? (
                  <img
                    src={item.productVariation.images[0].url}
                    alt="Product"
                    className="h-16 w-16 object-cover rounded"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-xs">No Image</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  Product Variation ID: {item.productVariationId}
                </h4>
                <p className="text-sm text-gray-600">
                  Size: {item.productVariation.size} | Color:{" "}
                  {item.productVariation.color}
                </p>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity} | Price: ₹{item.price}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-6">
        <button
          onClick={() => router.back()}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Back to Orders
        </button>
      </div>
    </div>
  );
}
