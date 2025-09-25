import type { OrderPayload, OrderStatus, PaymentStatus, OrderItem } from '@/types/order';

type JsonPrimitive = string | number | boolean | null;
export type Json = JsonPrimitive | JsonPrimitive[] | { [key: string]: Json };

export type AuditResponsePayload = { ok: true; order_id: string };

export type AuditPayload = {
  request?: OrderPayload;
  response?: AuditResponsePayload;
} | null;

type Timestamp = string;

type OrdersRow = {
  id: string;
  created_at: Timestamp;
  customer_name: string;
  customer_email: string | null;
  service: OrderPayload['service'];
  delivery_zone: NonNullable<OrderPayload['deliveryZone']> | null;
  notes: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  tip_cents: number;
  total_cents: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  paid_at: Timestamp | null;
};

type OrdersInsert = {
  id?: string;
  created_at?: Timestamp;
  customer_name: string;
  customer_email?: string | null;
  service: OrderPayload['service'];
  delivery_zone?: NonNullable<OrderPayload['deliveryZone']> | null;
  notes?: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  tip_cents: number;
  total_cents: number;
  payment_status?: PaymentStatus;
  status?: OrderStatus;
  paid_at?: Timestamp | null;
};

type OrdersUpdate = Partial<OrdersInsert>;

type OrderItemsRow = {
  id: string;
  created_at: Timestamp;
  order_id: string;
  slot: OrderItem['slot'];
  name: string;
  price_cents: number;
};

type OrderItemsInsert = {
  id?: string;
  created_at?: Timestamp;
  order_id: string;
  slot: OrderItem['slot'];
  name: string;
  price_cents: number;
};

type OrderItemsUpdate = Partial<OrderItemsInsert>;

type AuditLogsRow = {
  id: string;
  created_at: Timestamp;
  type: string;
  idempotency_key: string | null;
  order_id: string | null;
  payload: AuditPayload;
};

type AuditLogsInsert = {
  id?: string;
  created_at?: Timestamp;
  type?: string;
  idempotency_key?: string | null;
  order_id?: string | null;
  payload?: AuditPayload;
};

type AuditLogsUpdate = Partial<AuditLogsInsert>;

export type Database = {
  public: {
    Tables: {
      orders: {
        Row: OrdersRow;
        Insert: OrdersInsert;
        Update: OrdersUpdate;
      };
      order_items: {
        Row: OrderItemsRow;
        Insert: OrderItemsInsert;
        Update: OrderItemsUpdate;
      };
      audit_logs: {
        Row: AuditLogsRow;
        Insert: AuditLogsInsert;
        Update: AuditLogsUpdate;
      };
    };
  };
};
