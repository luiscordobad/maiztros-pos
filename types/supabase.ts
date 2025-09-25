export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          actor: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          phone: string | null;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone?: string | null;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string | null;
          name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      loyalty_points: {
        Row: {
          id: string;
          customer_id: string | null;
          points: number;
          reason: string | null;
          order_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          points?: number;
          reason?: string | null;
          order_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          points?: number;
          reason?: string | null;
          order_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_points_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loyalty_points_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          sku: string;
          name: string;
          qty: number;
          unit_price: number;
          modifiers: Json;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          sku: string;
          name: string;
          qty?: number;
          unit_price?: number;
          modifiers?: Json;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          sku?: string;
          name?: string;
          qty?: number;
          unit_price?: number;
          modifiers?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          ticket_no: number | null;
          customer_id: string | null;
          channel: Database["public"]["Enums"]["order_channel"];
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          discount: number;
          total: number;
          payment_method: string | null;
          prepared_at: string | null;
          ready_at: string | null;
          delivered_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          idempotency_key: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          ticket_no?: number | null;
          customer_id?: string | null;
          channel?: Database["public"]["Enums"]["order_channel"];
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          discount?: number;
          total?: number;
          payment_method?: string | null;
          prepared_at?: string | null;
          ready_at?: string | null;
          delivered_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          idempotency_key?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          ticket_no?: number | null;
          customer_id?: string | null;
          channel?: Database["public"]["Enums"]["order_channel"];
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          discount?: number;
          total?: number;
          payment_method?: string | null;
          prepared_at?: string | null;
          ready_at?: string | null;
          delivered_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          idempotency_key?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          order_id: string | null;
          provider: string | null;
          amount: number;
          status: string | null;
          ext_ref: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          provider?: string | null;
          amount: number;
          status?: string | null;
          ext_ref?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          provider?: string | null;
          amount?: number;
          status?: string | null;
          ext_ref?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      order_channel: "counter" | "whatsapp" | "rappi" | "other";
      order_status: "pending" | "in_progress" | "ready" | "delivered" | "canceled";
    };
    CompositeTypes: {};
  };
};

export type Tables<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Update"];

export type AuditLogsInsert = TablesInsert<'audit_logs'>;
