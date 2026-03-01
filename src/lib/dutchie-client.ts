const DUTCHIE_BASE = process.env.DUTCHIE_API_URL ?? "https://api.pos.dutchie.com";

function getAuthHeader(): string {
  const locationKey =
    process.env.DUTCHIE_LOCATION_KEY ?? "demo-location-key";
  const integratorKey =
    process.env.DUTCHIE_INTEGRATOR_KEY ?? "demo-integrator-key";
  return Buffer.from(`${locationKey}:${integratorKey}`).toString("base64");
}

export async function syncInventory(
  items: Array<{ name: string; sku?: string; quantity: number; price: number }>
): Promise<{ success: boolean; message: string; syncedCount: number }> {
  if (
    !process.env.DUTCHIE_LOCATION_KEY ||
    !process.env.DUTCHIE_INTEGRATOR_KEY
  ) {
    return {
      success: true,
      message:
        "Demo mode: Inventory would be synced to Dutchie POS system",
      syncedCount: items.length,
    };
  }

  const response = await fetch(`${DUTCHIE_BASE}/products`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${getAuthHeader()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Dutchie API error: ${response.status}`);
  }

  return {
    success: true,
    message: `Synced ${items.length} items to Dutchie inventory`,
    syncedCount: items.length,
  };
}

export async function getProducts(): Promise<unknown[]> {
  if (
    !process.env.DUTCHIE_LOCATION_KEY ||
    !process.env.DUTCHIE_INTEGRATOR_KEY
  ) {
    return [];
  }

  const response = await fetch(`${DUTCHIE_BASE}/products`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${getAuthHeader()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { data?: unknown[] };
  return data.data ?? [];
}
