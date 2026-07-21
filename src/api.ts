// Thin wrapper around the Express API endpoints.
// Falls back silently if the server returns an error — localStorage remains the cache.

const BASE = "/api";

async function get<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data as T;
  } catch {
    return null;
  }
}

async function put(url: string, body: unknown): Promise<void> {
  try {
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Silently ignore — localStorage already has the latest state
  }
}

// ── Tenant entity API ──────────────────────────────────────────────────────

export function loadEntity<T>(companyId: string, entity: string): Promise<T | null> {
  return get<T>(`${BASE}/data/${companyId}/${entity}`);
}

export function saveEntity(companyId: string, entity: string, data: unknown): Promise<void> {
  return put(`${BASE}/data/${companyId}/${entity}`, data);
}

// ── Global users API ───────────────────────────────────────────────────────

export function loadUsers<T>(): Promise<T | null> {
  return get<T>(`${BASE}/users`);
}

export function saveUsers(data: unknown): Promise<void> {
  return put(`${BASE}/users`, data);
}

// ── Convenience: load all entities for a tenant in parallel ───────────────

export const TENANT_ENTITIES = [
  "company", "branches", "products", "categories", "brands",
  "batchStocks", "suppliers", "purchaseOrders",
  "leads", "customers", "invoices",
  "employees", "leaveRequests",
  "transactions", "documents", "notifications", "auditLogs",
  "assets", "stockMovements", "vendorBills",
] as const;

export type EntityName = typeof TENANT_ENTITIES[number];

export async function loadAllEntities(companyId: string): Promise<Record<string, unknown>> {
  const results = await Promise.all(
    TENANT_ENTITIES.map(e => loadEntity(companyId, e))
  );
  const map: Record<string, unknown> = {};
  TENANT_ENTITIES.forEach((name, i) => {
    if (results[i] !== null) map[name] = results[i];
  });
  return map;
}
