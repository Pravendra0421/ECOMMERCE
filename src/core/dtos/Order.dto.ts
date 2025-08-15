import { AddressEntity, ContactInfoEntity } from '@/core/entities/order.entity';
export type PaymentMethodType = 'Stripe' | 'COD' | 'UPI';
export interface UpdateOrderDto {
    status?: string;
    total?: number;
    paymentMethod?: PaymentMethodType;
    shippingAddress?: AddressEntity;
    contactInfo?: ContactInfoEntity;
}
export interface CreateOrderItemDto {
    productId: string;
    productVariationId: string;
    quantity: number;
    price: number;
}
export interface CreateOrderDto {
    cartId?: string;
    userId: string;
    shippingAddress: {
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    contactInfo: {
        email: string;
        phone: string;
    };
    paymentMethod: PaymentMethodType;
    items: CreateOrderItemDto[];
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
}
export interface BuyNowDto {
    productVariationId: string;
    quantity: number;
    shippingAddress: {
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    contactInfo: {
        email: string;
        phone: string;
    };
    paymentMethod: PaymentMethodType;
    userId: string; 
    price: number; 
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string; 
}