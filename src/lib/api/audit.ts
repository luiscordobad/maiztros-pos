import { supabaseAdmin } from './supabaseAdmin';

interface AuditLogParams {
  actor: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  meta?: Record<string, any>;
}

export async function logAudit({ actor, action, entity, entity_id, meta }: AuditLogParams) {
  const { error } = await supabaseAdmin.from('audit_logs').insert({
    actor,
    action,
    entity,
    entity_id,
    meta: meta ? JSON.stringify(meta) : null,
  });
  if (error) {
    console.error('audit log error', error.message);
  }
}
