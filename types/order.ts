export type OrderStatus = 'queued' | 'in_kitchen' | 'ready' | 'delivered';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Money {
  cents: number;
}

export interface Totals {
  subtotal: Money;
  shipping: Money;
  tip: Money;
  total: Money;
}

export type OrderSlot = 'base' | 'papas_o_sopa' | 'toppings' | 'drink';

export interface OrderItem {
  slot: OrderSlot;
  name: string;
  price: Money;
}

export interface OrderPayload {
  customer: {
    name: string;
    email?: string;
  };
  service: 'dine_in' | 'pickup' | 'delivery';
  deliveryZone?: 'zibata' | 'fuera';
  notes?: string;
  totals: Totals;
  items: OrderItem[];
}

export interface OrderRecord {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_cents: number;
  notes: string | null;
}
