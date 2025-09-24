export type OrderChannel = 'counter' | 'whatsapp' | 'rappi' | 'other';
export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'delivered' | 'canceled';

export interface PosProduct {
  sku: string;
  name: string;
  price: number;
  category: string;
  modifiers?: string[];
}

export interface PosCartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: string[];
}

export interface CustomerPayload {
  phone?: string;
  name?: string;
}

export interface CouponResponse {
  id: string;
  code: string;
  type: 'amount' | 'percent';
  value: number;
  min_total: number;
}

export interface PaymentRequest {
  provider: 'cash' | 'card' | 'mp';
  amount: number;
}

export interface PosOrderPayload {
  channel: OrderChannel;
  customer?: CustomerPayload;
  items: PosCartItem[];
  notes?: string;
  couponCode?: string;
  total: number;
  discount: number;
  subtotal: number;
  paymentMethod?: string;
}

export interface LoyaltySummary {
  points: number;
}
