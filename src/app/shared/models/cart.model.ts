// src/app/shared/models/cart.model.ts

export interface Cart {
  userGuid?: string | null;     // ✅ FIX: userId → userGuid (nullable)
  sessionId?: string | null;    // ✅ FIX: nullable for logged-in users
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

export interface CartItem {
  cartItemId: number;
  productGuid: string;
  productName: string;
  productCategory: string;
  productUnit: string;
  imageUrl: string;
  quantity: number;
  price: number;
  itemTotal: number;
}

export interface AddToCartRequest {
  userGuid?: string | null;     // ✅ FIX
  sessionId?: string | null;    // ✅ FIX
  productGuid: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
