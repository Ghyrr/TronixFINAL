import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PERMISSION_KEYS = ["products", "orders", "customers", "inventory", "settings"] as const;
const ROLES = ["super_admin", "admin"] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Permissions = Record<(typeof PERMISSION_KEYS)[number], boolean>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fullPermissions(): Permissions {
  return { products: true, orders: true, customers: true, inventory: true, settings: true };
}

function parsePermissions(input: unknown): Permissions {
  const source = (input ?? {}) as Record<string, unknown>;
  const out = {} as Permissions;
  for (const key of PERMISSION_KEYS) out[key] = source[key] === true;
  return out;
}

function parseEmail(value: unknown): string {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) throw new HttpError(400, "invalid_email");
  return email;
}

function parsePassword(value: unknown, required: boolean): string | undefined {
  if (value === undefined || value === null || value === "") {
    if (required) throw new HttpError(400, "invalid_password");
    return undefined;
  }
  if (typeof value !== "string" || value.length < 8 || value.length > 72) {
    throw new HttpError(400, "invalid_password");
  }
  return value;
}

function parseFullName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (name.length < 2 || name.length > 120) throw new HttpError(400, "invalid_name");
  return name;
}

function parseRole(value: unknown): (typeof ROLES)[number] {
  if (typeof value !== "string" || !(ROLES as readonly string[]).includes(value)) {
    throw new HttpError(400, "invalid_role");
  }
  return value as (typeof ROLES)[number];
}

async function requireSuperAdmin(admin: SupabaseClient, req: Request): Promise<string> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "unauthorized");

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) throw new HttpError(401, "unauthorized");

  const { data: row, error: rowError } = await admin
    .from("admins")
    .select("id, role, is_active")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (rowError) throw rowError;
  if (!row || !row.is_active || row.role !== "super_admin") throw new HttpError(403, "forbidden");
  return userData.user.id;
}

async function createAuthUser(admin: SupabaseClient, email: string, password: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) {
    if (error && /already|registered|exists/i.test(error.message)) throw new HttpError(409, "email_exists");
    throw new HttpError(400, "create_failed");
  }
  return data.user.id;
}

async function logActivity(admin: SupabaseClient, adminId: string, action: string, entityId: string, details: Record<string, unknown>) {
  const { error } = await admin.from("activity_logs").insert({
    admin_id: adminId,
    action,
    entity: "admin",
    entity_id: entityId,
    details,
  });
  if (error) throw error;
}

async function bootstrap(admin: SupabaseClient, body: Record<string, unknown>) {
  const { count, error: countError } = await admin.from("admins").select("id", { count: "exact", head: true });
  if (countError) throw countError;
  if ((count ?? 0) > 0) throw new HttpError(409, "already_initialized");

  const email = parseEmail(body.email);
  const password = parsePassword(body.password, true) as string;
  const fullName = parseFullName(body.full_name);

  const userId = await createAuthUser(admin, email, password);
  const { error } = await admin.from("admins").insert({
    id: userId,
    email,
    full_name: fullName,
    role: "super_admin",
    permissions: fullPermissions(),
    is_active: true,
  });
  if (error) {
    await admin.auth.admin.deleteUser(userId);
    throw error;
  }
  return { id: userId };
}

async function createAdmin(admin: SupabaseClient, callerId: string, body: Record<string, unknown>) {
  const email = parseEmail(body.email);
  const password = parsePassword(body.password, true) as string;
  const fullName = parseFullName(body.full_name);
  const role = parseRole(body.role ?? "admin");
  const permissions = role === "super_admin" ? fullPermissions() : parsePermissions(body.permissions);

  const userId = await createAuthUser(admin, email, password);
  const { error } = await admin.from("admins").insert({
    id: userId,
    email,
    full_name: fullName,
    role,
    permissions,
    is_active: true,
  });
  if (error) {
    await admin.auth.admin.deleteUser(userId);
    throw error;
  }
  await logActivity(admin, callerId, "admin_created", userId, { email, role });
  return { id: userId };
}

async function updateAdmin(admin: SupabaseClient, callerId: string, body: Record<string, unknown>) {
  if (typeof body.id !== "string" || !UUID_PATTERN.test(body.id)) throw new HttpError(400, "invalid_id");
  const targetId = body.id;

  const { data: target, error: targetError } = await admin
    .from("admins")
    .select("id, role, is_active")
    .eq("id", targetId)
    .maybeSingle();
  if (targetError) throw targetError;
  if (!target) throw new HttpError(404, "not_found");

  const changes: Record<string, unknown> = {};
  if (body.full_name !== undefined) changes.full_name = parseFullName(body.full_name);
  if (body.role !== undefined) changes.role = parseRole(body.role);
  if (body.permissions !== undefined) changes.permissions = parsePermissions(body.permissions);
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") throw new HttpError(400, "invalid_status");
    changes.is_active = body.is_active;
  }
  const password = parsePassword(body.password, false);

  const nextRole = (changes.role as string | undefined) ?? target.role;
  const nextActive = (changes.is_active as boolean | undefined) ?? target.is_active;
  const losesSuperAdmin = target.role === "super_admin" && (nextRole !== "super_admin" || !nextActive);

  if (targetId === callerId && losesSuperAdmin) throw new HttpError(400, "cannot_modify_self");
  if (losesSuperAdmin) {
    const { count, error: countError } = await admin
      .from("admins")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin")
      .eq("is_active", true)
      .neq("id", targetId);
    if (countError) throw countError;
    if ((count ?? 0) === 0) throw new HttpError(400, "last_super_admin");
  }

  if (changes.role === "super_admin") changes.permissions = fullPermissions();

  if (Object.keys(changes).length > 0) {
    const { error } = await admin.from("admins").update({ ...changes, updated_at: new Date().toISOString() }).eq("id", targetId);
    if (error) throw error;
  }

  if (changes.is_active !== undefined) {
    const { error } = await admin.auth.admin.updateUserById(targetId, {
      ban_duration: changes.is_active ? "none" : "876000h",
    });
    if (error) throw error;
  }

  if (password) {
    const { error } = await admin.auth.admin.updateUserById(targetId, { password });
    if (error) throw error;
  }

  await logActivity(admin, callerId, "admin_updated", targetId, {
    fields: Object.keys(changes).concat(password ? ["password"] : []),
  });
  return { id: targetId };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") throw new HttpError(405, "method_not_allowed");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = (await req.json().catch(() => {
      throw new HttpError(400, "invalid_json");
    })) as Record<string, unknown>;

    if (body.action === "bootstrap") {
      return json(await bootstrap(admin, body));
    }

    const callerId = await requireSuperAdmin(admin, req);

    switch (body.action) {
      case "create":
        return json(await createAdmin(admin, callerId, body));
      case "update":
        return json(await updateAdmin(admin, callerId, body));
      default:
        throw new HttpError(400, "unknown_action");
    }
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: "server_error" }, 500);
  }
});
