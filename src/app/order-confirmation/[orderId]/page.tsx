"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OrderApiRepository } from "@/infrastructure/frontend/repositories/OrderRepository.api";
import { orderEntity } from "@/core/entities/order.entity";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
function Orderconfirmation() {
  const searchParams = useSearchParams();
  const orderApi = new OrderApiRepository();
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<orderEntity | null>();
  const router = useRouter();
  useEffect(() => {
    const fetch = async () => {
      const response = await orderApi.findById(orderId);
      setOrder(response);
    };
    fetch();
  }, []);
  return (
    <>
      <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
        <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6 sm:p-8">
          <div className="text-center border-b pb-6">
            <h1 className="text-3xl font-bold text-green-600">Thank You!!</h1>
            <p className="text-gray-600 mt-2">
              Your order has been confirmed successfully.
            </p>
          </div>
          {order && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Order Summary
              </h2>
              <div className="flex justify-between items-center mt-4 text-gray-700">
                <p>Order ID:</p>
                <p className="font-mono text-sm">{order.id}</p>
              </div>
              <div className="flex justify-between items-center mt-4 text-gray-700">
                <p>Total Price:</p>
                <p className="font-mono text-sm">{order.total}</p>
              </div>
              <div className="flex justify-between items-center mt-4 text-gray-700">
                <p>Payment Method :</p>
                <p className="font-mono text-sm">{order.paymentMethod}</p>
              </div>
              <div className="flex justify-between items-center mt-4 text-gray-700">
                <p>Shipping Address </p>
                <p className="font-mono text-sm">
                  {order.shippingAddress.address1},
                  {order.shippingAddress.address2},{order.shippingAddress.city},
                  {order.shippingAddress.state}
                </p>
              </div>
            </div>
          )}
          <div className=" text-center mt-10">
            <Button
              onClick={() => {
                router.push("/profile/orders");
              }}
            >
              View Your All Order
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
export default Orderconfirmation;
