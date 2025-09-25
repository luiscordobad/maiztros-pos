import type { Database, Json } from '@/types/supabase';

import { supabaseAdmin } from './supabaseAdmin';

type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

interface AuditLogParams {
  actor: AuditLogInsert['actor'];
  action: AuditLogInsert['action'];
  entity: AuditLogInsert['entity'];
  entity_id: AuditLogInsert['entity_id'];
  meta?: Json | null;
}

export async function logAudit({ actor, action, entity, entity_id, meta }: AuditLogParams) {
  const payload: AuditLogInsert = {
    actor,
    action,
    entity,
    entity_id,
    meta: meta ?? null,
  };

  const { error } = await supabaseAdmin.from('audit_logs').insert(payload);
  if (error) {
    console.error('audit log error', error.message);
  }
}
