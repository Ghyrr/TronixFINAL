import { SUPABASE_URL, supabase } from '@/lib/supabase';
import type { AdminPermissions, AdminRole } from '@/lib/types';

export interface AdminAccountInput {
  email?: string;
  password?: string;
  full_name?: string;
  role?: AdminRole;
  permissions?: AdminPermissions;
  is_active?: boolean;
}

export class AdminApiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

async function callAdminUsers(body: Record<string, unknown>): Promise<{ id: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  
  const isBootstrap = body.action === 'bootstrap';
  
  if (!token && !isBootstrap) {
    throw new AdminApiError('unauthorized');
  }

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const headers: Record<string, string> = {
    apikey: anonKey,
    'Content-Type': 'application/json',
  };

  // Use the user's token if logged in. Otherwise, use the anon key so Supabase Gateway lets the request through.
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['Authorization'] = `Bearer ${anonKey}`;
  }

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/admin-users`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new AdminApiError('network');
  }

  const payload = (await response.json().catch(() => null)) as { id?: unknown; error?: unknown } | null;
  if (!response.ok || !payload) {
    throw new AdminApiError(typeof payload?.error === 'string' ? payload.error : 'generic');
  }
  if (typeof payload.id !== 'string') throw new AdminApiError('generic');
  return { id: payload.id };
}

export function createAdminAccount(input: AdminAccountInput & { email: string; password: string; full_name: string }) {
  return callAdminUsers({ action: 'create', ...input });
}

export function updateAdminAccount(id: string, input: AdminAccountInput) {
  return callAdminUsers({ action: 'update', id, ...input });
}

export function bootstrapSuperAdmin(input: { email: string; password: string; full_name: string }) {
  return callAdminUsers({ action: 'bootstrap', ...input });
}