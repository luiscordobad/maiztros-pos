import type { Database } from '@/types/supabase';

export type OrderChannel = Database['public']['Enums']['order_channel'];
export type OrderStatus = Exclude<Database['public']['Enums']['order_status'], 'canceled'>;

export interface DashboardFilters {
  range: { from: string; to: string };
  channels: OrderChannel[];
  status: OrderStatus | null;
}

export interface SalesByHourPoint {
  bucket: string;
  sales: number;
  orders: number;
}

export interface KpiSummary {
  salesToday: number;
  ticketsToday: number;
  averageTicket: number;
  deliveryShare: number;
}

export interface TopProductRow {
  sku: string;
  name: string;
  units: number;
  revenue: number;
}

export interface HeatmapRow {
  hour: number;
  totalOrders: number;
  totalSales: number;
}

export type OrderStatusAll = Database['public']['Enums']['order_status'];

export interface OrderTableRow {
  id: string;
  createdAt: string;
  ticketNo: number | null;
  channel: OrderChannel;
  status: OrderStatusAll;
  total: number;
  paymentMethod: string | null;
}

export interface CohortRow {
  week: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface DailyCloseSnapshot {
  branch: string;
  reportDate: string;
  totals: {
    sales: number;
    tickets: number;
    averageTicket: number;
    deliveryShare: number;
  };
  paymentBreakdown: Record<string, number>;
  channelBreakdown: Record<string, number>;
  topProducts: TopProductRow[];
}
