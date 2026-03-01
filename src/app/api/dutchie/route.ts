import { NextRequest, NextResponse } from "next/server";
import { syncInventory } from "@/lib/dutchie-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineItems } = body;

    if (!Array.isArray(lineItems)) {
      return NextResponse.json(
        { error: "lineItems array is required" },
        { status: 400 }
      );
    }

    const items = lineItems.map(
      (item: { name?: string; sku?: string; quantity?: number; price?: number }) => ({
        name: String(item.name ?? ""),
        sku: item.sku ? String(item.sku) : undefined,
        quantity: Number(item.quantity ?? 0),
        price: Number(item.price ?? 0),
      })
    );

    const result = await syncInventory(items);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      syncedCount: result.syncedCount,
    });
  } catch (error) {
    console.error("Dutchie sync error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Dutchie sync failed",
      },
      { status: 500 }
    );
  }
}
