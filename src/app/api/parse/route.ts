import { NextRequest, NextResponse } from "next/server";
import { refineInvoiceData } from "@/lib/claude";

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

    const rawItems = lineItems.map(
      (item: { name?: string; sku?: string; quantity?: number; price?: number }) => ({
        name: String(item.name ?? ""),
        sku: item.sku ? String(item.sku) : undefined,
        quantity: Number(item.quantity ?? 0),
        price: Number(item.price ?? 0),
      })
    );

    let refined;
    if (process.env.ANTHROPIC_API_KEY) {
      refined = await refineInvoiceData(rawItems);
    } else {
      refined = rawItems.map((item, i) => ({
        ...item,
        id: `item-${i}`,
      }));
    }

    return NextResponse.json({
      success: true,
      lineItems: refined.map((item: { id?: string }, i: number) => ({
        ...item,
        id: item.id ?? `item-${i}`,
      })),
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Claude parsing failed",
      },
      { status: 500 }
    );
  }
}
