import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { validateAuth } from "../../middleware/validAuth";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
export async function POST(req: NextRequest) {
  try {
    const auth = await validateAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { amount } = await req.json(); // amount should we in INR
    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 401 }
      );
    }
    const option = {
      amount: amount * 100, //convert the amount into paise
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
    };
    const order = await razorpay.orders.create(option);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { message: "Failed to create Razorpay order." },
      { status: 500 }
    );
  }
}
