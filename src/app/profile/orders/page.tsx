"use client";
import { useEffect, useState } from "react";
import { orderEntity } from "@/core/entities/order.entity";
import { OrderApiRepository } from "@/infrastructure/frontend/repositories/OrderRepository.api";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
export default function OrderPage() {
  const [orders, setOrder] = useState<orderEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //get user form the useStore
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      setError("you must be logged in to view your orders");
      return;
    }
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user?.id) {
          throw new Error("user Id not available");
        }
        const repo = new OrderApiRepository();
        const data = await repo.findByUserId(user?.id);
        setOrder(data);
      } catch (error) {
        setError("failed to fetch order");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [user?.id, isAuthenticated]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-[20px] w-[100px] rounded-full" />
      </div>
    );
  }
  if (error) {
    return <div className=" text-red-500 text-center py-8">{error}</div>;
  }
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No orders found.</div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-6 shadow-lg bg-white"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    OrderId: #{order.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : order.status === "CANCELLED"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Shipping Address
                  </h4>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.firstName}{" "}
                    {order.shippingAddress.lastName}
                    <br />
                    {order.shippingAddress.address1}
                    <br />
                    {order.shippingAddress.address2 &&
                      `${order.shippingAddress.address2}`}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                    <br />
                    {order.shippingAddress.country}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Contact Info
                  </h4>
                  <p className="text-sm text-gray-600">
                    Email: {order.contactInfo.email}
                    <br />
                    Phone: {order.contactInfo.phone}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Order Items
                </h4>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {item.productVariation.images &&
                        item.productVariation.images.length > 0 ? (
                          <Image
                            src={item.productVariation.images[0].url}
                            alt="Product"
                            width={64}
                            height={64}
                            className="object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.productVariation.color &&
                            `${item.productVariation.color}`}
                          {item.productVariation.size &&
                            ` - ${item.productVariation.size}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-500">
                          Price: Rs. {item.price}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          Rs. {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold text-gray-900">
                      Rs. {order.total.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Payment Method: {order.paymentMethod}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
