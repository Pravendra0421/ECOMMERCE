"use client";
import { orderEntity } from "@/core/entities/order.entity";
import Link from "next/link";
import { useRouter } from "next/navigation"; // For page refresh
import { OrderApiRepository } from "@/infrastructure/frontend/repositories/OrderRepository.api";
import { OrderUseCase } from "@/core/usecases/Order.usecase";
import { PrismaUserRepository } from "@/core/repositories/IUserRepository";
import { CartRepository } from "@/core/repositories/ICartRepository";
import { ProductRepository } from "@/core/repositories/IProductRepository";
import toast from "react-hot-toast";
import { useState } from "react";
interface OrdersListTableProps {
  order: orderEntity[];
}

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];
export default function OrderListTable({ order }: OrdersListTableProps) {
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
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleDelete = async (orderId: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the order "${orderId}"? This action cannot be undone.`
      )
    ) {
      try {
        await orderUseCase.deleteOrder(orderId);
        toast.success("order deleted successfully");
        router.refresh(); // Refresh the page to show updated list
      } catch (error) {
        toast.error(" error during delete the order");
      }
    }
  };
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (
      window.confirm(
        `Are you sure you want to update the order status to "${newStatus}"?`
      )
    ) {
      setUpdatingStatus(orderId);
      try {
        await orderUseCase.updateOrder(orderId, { status: newStatus });
        toast.success("Order status updated successfully");
        router.refresh(); // Refresh the page to show updated list
      } catch (error) {
        toast.error("Error updating order status");
      } finally {
        setUpdatingStatus(null);
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
  if (!order || order.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">No orders found</div>
        <p className="text-gray-400">
          There are no orders to display at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Method
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {order.map((orderItem) => (
            <tr key={orderItem.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {orderItem.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{orderItem.total}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      orderItem.status
                    )}`}
                  >
                    {orderItem.status}
                  </span>
                  <select
                    value={orderItem.status}
                    onChange={(e) =>
                      handleStatusUpdate(orderItem.id, e.target.value)
                    }
                    disabled={updatingStatus === orderItem.id}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {updatingStatus === orderItem.id && (
                    <span className="text-xs text-gray-500">Updating...</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {orderItem.paymentMethod}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {orderItem.contactInfo.email}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {orderItem.contactInfo.phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link href={`/sxs_admin/order/${orderItem.id}`}>
                  <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                    View Details
                  </button>
                </Link>
                {/* <button
                  onClick={() => handleDelete(orderItem.id)}
                  className="text-red-600 hover:text-red-900"
                  disabled={updatingStatus === orderItem.id}
                >
                  Delete
                </button> */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
