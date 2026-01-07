// shared/models/checkout.model.ts
// All checkout-related interfaces

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subscribeMarketing: boolean;
  orderNotes: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  country: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface ShippingMethod {
  shippingMethodId: number;
  name: string;
  cost: number;
  estimatedDelivery: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  country: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface PaymentInfo {
  paymentType: 'COD' | 'Card' | 'UPI';
  
  cardNumber?: string;
  cardExpiry?: string;
  cardCVV?: string;
  nameOnCard?: string;
  billingAddress: BillingAddress;
}

export interface OrderItem {
  productGuid: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface AdditionalFields {
  gstNumber?: string;
  deliveryInstructions?: string;
  alternatePhone?: string;
  preferredDeliveryTime?: string;
}

export interface CheckoutRequest {
  contactInfo: ContactInfo;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  paymentInfo: PaymentInfo;
  orderItems: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  additionalFields: AdditionalFields;
 sessionId?: string | null;   // guest
  userGuid?: string | null;    // logged-in
  
}

export interface CheckoutResponse {
  orderId: number;
  message: string;
}

