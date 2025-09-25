export interface KdsOrder {
  id: string;
  ticket_no: number | null;
  channel: string;
  status: 'pending' | 'in_progress' | 'ready';
  created_at: string;
  ready_at: string | null;
  items: { name: string; qty: number }[];
}
