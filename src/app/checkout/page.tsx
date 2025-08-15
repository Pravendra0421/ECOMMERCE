"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  AddressEntity,
  ContactInfoEntity,
  orderEntity,
  OrderItemEntity,
} from "@/core/entities/order.entity";
import { CartEntity } from "@/core/entities/cart.entity";
import { OrderApiRepository } from "@/infrastructure/frontend/repositories/OrderRepository.api";
import { CartApiRepository } from "@/infrastructure/frontend/repositories/Cart.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter } from "next/navigation";
import {
  PaymentMethodType,
  CreateOrderDto,
  UpdateOrderDto,
  BuyNowDto,
} from "@/core/dtos/Order.dto";
import { getCurrentUser } from "@/lib/auth";
import { Suspense } from "react";

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flowType = searchParams.get("type");
  const productVariationId = searchParams.get("productVariationId");
  const quantity = parseInt(searchParams.get("quantity") || "1");
  const buyNowPrice = parseFloat(searchParams.get("price") || "0");
  const buyNowProductName = searchParams.get("productName") || "Product Name";
  const buyNowImageUrl =
    searchParams.get("imageUrl") || "https://placehold.co/100x100";
  const buyNowSize = searchParams.get("size") || "N/A";
  const buyNowColor = searchParams.get("color") || "N/A";
  const preExistingOrderId = searchParams.get("orderId");
  const [cartData, setCartData] = useState<CartEntity | null>(null);
  const [orderData, setOrderData] = useState<orderEntity | null>(null); // Pre-existing order (e.g., from Buy Now)
  const [loading, setLoading] = useState(true); // Page data loading state
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Added to track auth loading status
  const [shippingAddress, setShippingAddress] = useState<AddressEntity>({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [contactInfo, setContactInfo] = useState<ContactInfoEntity>({
    email: "",
    phone: "",
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethodType>("COD");
  const orderApi = useMemo(() => new OrderApiRepository(), []);
  const cartApi = useMemo(() => new CartApiRepository(), []);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Component ke band hone par script ko memory se saaf kar dein
      document.body.removeChild(script);
    };
  }, []);
  useEffect(() => {
    const fetchUser = async () => {
      setIsAuthLoading(true); // Auth loading start
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
        setCurrentUser(null); // Set to null on error
      } finally {
        setIsAuthLoading(false); // Auth loading complete
      }
    };
    fetchUser();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start main data loading
      setError(null);

      // IMPORTANT: Wait for auth data to be loaded
      if (isAuthLoading) {
        return; // Do nothing if auth is still loading
      }

      // If currentUser is null after auth loading is complete, redirect
      if (!currentUser) {
        router.push("/login/request-otp");
        return;
      }
      console.log("Checkout searchParams:", {
        flowType,
        productVariationId,
        quantity,
      });

      try {
        if (flowType === "buy-now") {
          if (preExistingOrderId) {
            const fetchedOrder = await orderApi.findById(preExistingOrderId);
            if (fetchedOrder && fetchedOrder.userId === currentUser.id) {
              setOrderData(fetchedOrder);
              if (fetchedOrder.shippingAddress)
                setShippingAddress(fetchedOrder.shippingAddress);
              if (fetchedOrder.contactInfo)
                setContactInfo(fetchedOrder.contactInfo);
              if (fetchedOrder.paymentMethod)
                setSelectedPaymentMethod(fetchedOrder.paymentMethod);
            } else {
              setError("Pre-existing order not found or unauthorized.");
              router.push("/products");
            }
          } else if (productVariationId && quantity) {
            // Buy Now, new order - display handled by itemsToDisplay, no initial fetch
          } else {
            setError('Invalid "Buy Now" request. Missing product details.');
            router.push("/products");
          }
        } else if (flowType === "cart") {
          const fetchedCart = await cartApi.findByUserId(currentUser.id);
          if (fetchedCart) {
            if (fetchedCart.userId === currentUser.id) {
              setCartData(fetchedCart);
            } else {
              setError(
                "Cart found but does not belong to the current user. Unauthorized access."
              );
              router.push("/products");
            }
          } else {
            setError("No active cart found for your account.");
            router.push("/products");
          }
        } else {
          router.push("/products");
          return;
        }
      } catch (error: unknown) {
        // Explicitly typed as unknown (TypeScript default for catch)
        let errorMessage = "Failed to load checkout details. Please try again.";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === "string") {
          // If an API throws a plain string error
          errorMessage = error;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ) {
          // If a non-Error object with a 'message' property is thrown
          errorMessage = (error as { message: string }).message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false); // Main data loading complete
      }
    };
    // Call fetchData only when auth loading is complete
    if (!isAuthLoading) {
      fetchData();
    }
  }, [
    flowType,
    productVariationId,
    quantity,
    buyNowPrice,
    preExistingOrderId,
    router,
    orderApi,
    cartApi,
    currentUser,
    isAuthLoading,
  ]); // Added isAuthLoading to dependencies

  const itemsToDisplay: OrderItemEntity[] = useMemo(() => {
    if (orderData) {
      return orderData.items;
    }
    if (cartData) {
      return cartData.items.map((cartItem) => ({
        id: cartItem.id,
        orderId: "",
        productVariationId: cartItem.productVariationId,
        quantity: cartItem.quantity,
        price: cartItem.price,
        productVariation: cartItem.productVariation,
      }));
    }
    if (
      flowType === "buy-now" &&
      productVariationId &&
      quantity &&
      buyNowPrice > 0
    ) {
      return [
        {
          id: "temp-buy-now-item",
          orderId: "",
          productVariationId: productVariationId,
          quantity: quantity,
          price: buyNowPrice,
          productVariation: {
            id: productVariationId,
            price: buyNowPrice,
            salePrice: buyNowPrice,
            images: [{ url: buyNowImageUrl }],
            product: { name: buyNowProductName },
            size: buyNowSize,
            color: buyNowColor,
          } as any,
        },
      ];
    }
    return [];
  }, [
    orderData,
    cartData,
    flowType,
    productVariationId,
    quantity,
    buyNowPrice,
    buyNowProductName,
    buyNowImageUrl,
    buyNowSize,
    buyNowColor,
  ]);
  const totalPrice = itemsToDisplay.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = 0;
  const totalPayable = totalPrice + shippingCost;
  const handlePlaceOrder = async () => {
    setError(null);

    // === Validation (Ise jaisa hai waisa hi rehne dein) ===
    if (!currentUser) {
      router.push("/login/request-otp");
      return;
    }
    if (
      !contactInfo.email ||
      !contactInfo.phone ||
      !shippingAddress.firstName ||
      !shippingAddress.address1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode ||
      !shippingAddress.country
    ) {
      setError(
        "Please fill in all required contact and shipping information fields."
      );
      return;
    }
    // === Validation End ===

    setProcessing(true); // Button ko disable karne ke liye processing shuru

    // ==========================================================
    // === PAYMENT METHOD KE HISAB SE LOGIC ===
    // ==========================================================

    // ---> AGAR PAYMENT METHOD 'COD' HAI
    if (selectedPaymentMethod === "COD") {
      try {
        let finalOrderId: string;
        if (cartData) {
          const orderPayload: CreateOrderDto = {
            userId: currentUser.id,
            shippingAddress: shippingAddress,
            contactInfo: contactInfo,
            paymentMethod: "COD",
            items: cartData.items.map((item) => ({
              productId: item.productId,
              productVariationId: item.productVariationId,
              quantity: item.quantity,
              price: item.price,
            })),
          };
          const newOrder = await orderApi.createOrder(cartData, orderPayload);
          finalOrderId = newOrder.id;
        } else if (flowType === "buy-now") {
          const buyNowPayload: BuyNowDto = {
            userId: currentUser.id,
            productVariationId: productVariationId!,
            quantity: quantity,
            price: buyNowPrice,
            shippingAddress: shippingAddress,
            contactInfo: contactInfo,
            paymentMethod: "COD",
          };
          const newOrder = await orderApi.createOrderFromProduct(buyNowPayload);
          finalOrderId = newOrder.id;
        } else {
          throw new Error("Cannot determine order source.");
        }
        router.push(`/order-confirmation?orderId=${finalOrderId}`);
      } catch (err: any) {
        setError(err.message || "Failed to place order.");
        setProcessing(false);
      }
      return; // COD ka process yahan khatam.
    }

    // ---> AGAR PAYMENT METHOD 'UPI' HAI
    if (selectedPaymentMethod === "UPI") {
      try {
        // 1. Backend se Razorpay ka Order ID banwayein
        const { order: razorpayOrder } = await orderApi.createRazorpayOrder(
          totalPayable
        );
        if (!razorpayOrder) throw new Error("Could not initialize payment.");

        // 2. Razorpay ka Payment Popup Kholein
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: "INR",
          name: "Your Store Name", // Aapke store ka naam
          description: "Order Payment",
          order_id: razorpayOrder.id,

          // 3. Payment ke baad yeh function chalega
          handler: async function (response: any) {
            try {
              let finalOrderId: string;
              // Cart se order
              if (cartData) {
                const orderPayload: CreateOrderDto = {
                  userId: currentUser.id,
                  shippingAddress: shippingAddress,
                  contactInfo: contactInfo,
                  paymentMethod: "UPI",
                  items: cartData.items.map((item) => ({
                    productId: item.productId,
                    productVariationId: item.productVariationId,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                  // Razorpay ki details verification ke liye
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                };
                const newOrder = await orderApi.createOrder(
                  cartData,
                  orderPayload
                );
                finalOrderId = newOrder.id;
              }
              // Buy Now se order
              else if (flowType === "buy-now") {
                const buyNowPayload: BuyNowDto = {
                  userId: currentUser.id,
                  productVariationId: productVariationId!,
                  quantity: quantity,
                  price: buyNowPrice,
                  shippingAddress: shippingAddress,
                  contactInfo: contactInfo,
                  paymentMethod: "UPI",
                  // Razorpay ki details verification ke liye
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                };
                const newOrder = await orderApi.createOrderFromProduct(
                  buyNowPayload
                );
                finalOrderId = newOrder.id;
              } else {
                throw new Error("Cannot determine order source.");
              }
              router.push(`/order-confirmation?orderId=${finalOrderId}`);
            } catch (err: any) {
              setError(err.message || "Order creation failed after payment.");
              setProcessing(false);
            }
          },
          prefill: {
            name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            email: contactInfo.email,
            contact: contactInfo.phone,
          },
          modal: {
            ondismiss: function () {
              // Agar user popup band kar de
              setError("Payment was cancelled.");
              setProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        setError(err.message || "Payment failed. Please try again.");
        setProcessing(false);
      }
    }
  };
  if (isAuthLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-700 text-lg">Loading checkout details...</p>
        {/* You can add a spinner or loading animation here */}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="text-red-600 text-center text-lg">{error}</div>
        <Button
          onClick={() => router.back()}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
        >
          Go Back
        </Button>
      </div>
    );
  }

  if (itemsToDisplay.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>
          No items found for checkout. Please add items to your cart or choose
          &quot;Buy Now&quot; for a product.
        </p>
        <Button
          onClick={() => router.push("/products")}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
        >
          Continue Shopping
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col lg:flex-row max-w-6xl mx-auto my-8 bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="w-full lg:w-3/5 p-8 border-r border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

        {/* Contact Section */}
        <div className="mb-8 p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact</h2>
          <Input
            type="email"
            placeholder="Email or mobile phone number *"
            value={contactInfo.email}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, email: e.target.value })
            }
            required
          />
          <Input
            type="tel"
            placeholder="Phone number *"
            value={contactInfo.phone}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, phone: e.target.value })
            }
            className="mb-2"
            required
          />
          <div className="flex items-center text-sm text-gray-600">
            <input type="checkbox" id="email_offers" className="mr-2" />
            <label htmlFor="email_offers">Email me with news and offers</label>
          </div>
        </div>

        {/* Delivery Section */}
        <div className="mb-8 p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Delivery</h2>
          <select
            value={shippingAddress.country}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                country: e.target.value,
              })
            }
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            required
          >
            <option value="">Country/Region *</option>
            <option value="India">India</option>
            <option value="US">United States</option>
          </select>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              type="text"
              placeholder="First name *"
              value={shippingAddress.firstName}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  firstName: e.target.value,
                })
              }
              required
            />
            <Input
              type="text"
              placeholder="Last name *"
              value={shippingAddress.lastName}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  lastName: e.target.value,
                })
              }
              required
            />
          </div>
          <Input
            type="text"
            placeholder="Address *"
            value={shippingAddress.address1}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                address1: e.target.value,
              })
            }
            className="mb-4"
            required
          />
          <Input
            type="text"
            placeholder="Apartment, suite, etc. (optional)"
            value={shippingAddress.address2 || ""}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                address2: e.target.value,
              })
            }
            className="mb-4"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              type="text"
              placeholder="City *"
              value={shippingAddress.city}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, city: e.target.value })
              }
              required
            />
            <Input
              type="text"
              placeholder="State *"
              value={shippingAddress.state}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  state: e.target.value,
                })
              }
              required
            />
            <Input
              type="text"
              placeholder="PIN code *"
              value={shippingAddress.postalCode}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  postalCode: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <input type="checkbox" id="save_info" className="mr-2" />
            <label htmlFor="save_info">
              Save this information for next time
            </label>
          </div>
        </div>

        {/* Shipping Method Section */}
        <div className="mb-8 p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Shipping method
          </h2>
          <p className="text-gray-600">
            Enter your shipping address to view available shipping methods.
          </p>
        </div>

        {/* Payment Section */}
        <div className="mb-8 p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment</h2>
          <p className="text-sm text-gray-600 mb-4">
            All transactions are secure and encrypted.
          </p>

          <div className="space-y-4">
            <label
              className={`block border rounded-md p-3 cursor-pointer ${
                selectedPaymentMethod === "Stripe"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="Stripe"
                checked={selectedPaymentMethod === "Stripe"}
                onChange={() => setSelectedPaymentMethod("Stripe")}
                className="mr-2"
              />
              Credit card
            </label>
            <label
              className={`block border rounded-md p-3 cursor-pointer ${
                selectedPaymentMethod === "COD"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={selectedPaymentMethod === "COD"}
                onChange={() => setSelectedPaymentMethod("COD")}
                className="mr-2"
              />
              Cash on Delivery (COD)
            </label>
            <label
              className={`block border rounded-md p-3 cursor-pointer ${
                selectedPaymentMethod === "UPI"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="UPI"
                checked={selectedPaymentMethod === "UPI"}
                onChange={() => setSelectedPaymentMethod("UPI")}
                className="mr-2"
              />
              UPI
            </label>
          </div>
        </div>
        {error && (
          <div className="text-red-500 text-center mb-4 p-2 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        <Button
          onClick={handlePlaceOrder}
          className="w-full bg-gray-900 text-white py-4 px-6 rounded-md font-semibold text-lg hover:bg-gray-700 transition-colors duration-300 shadow-md"
        >
          Place Order
        </Button>
      </div>

      {/* Right Section: Order Summary (jaisa aapne pehle likha hai) */}
      <div className="w-full lg:w-2/5 p-8 bg-gray-100 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Order Summary
          </h2>
          <div className="space-y-4">
            {itemsToDisplay.length > 0 ? (
              itemsToDisplay.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    {item.productVariation &&
                      item.productVariation.images &&
                      item.productVariation.images.length > 0 && (
                        <div className="relative mr-4">
                          <img
                            src={item.productVariation.images[0].url}
                            alt={"Product Image"}
                            className="w-16 h-16 object-cover rounded-md border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src = `https://placehold.co/64x64/cccccc/ffffff?text=Image`;
                            }}
                          />
                          <span className="absolute -top-2 -right-2 bg-gray-700 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                      )}
                    <div>
                      <p className="text-sm text-gray-600">
                        {item.productVariation?.size &&
                          `Size: ${item.productVariation.size}`}
                        {item.productVariation?.color &&
                          item.productVariation?.size &&
                          ` / `}
                        {item.productVariation?.color &&
                          `Color: ${item.productVariation.color}`}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900">
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No items in order summary.</p>
            )}
          </div>

          <div className="border-t border-gray-300 mt-6 pt-6 space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>Rs. {totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Shipping</span>
              <span>
                {(shippingCost as number) === 0
                  ? "Free"
                  : `Rs. ${(shippingCost as number).toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-4">
              <span>Total</span>
              <span>INR Rs. {totalPayable.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutPageContent />
    </Suspense>
  );
}
