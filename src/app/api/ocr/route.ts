import { NextRequest, NextResponse } from "next/server";
import { analyzeInvoice } from "@/lib/textract";
import { checkAndIncrementOcrLimit } from "@/lib/ocr-rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for Textract sync
const OCR_REQUEST_LIMIT = 30;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const DEMO_LINE_ITEMS = [
  { id: "item-0", name: "Blue Dream Flower 1/8oz", sku: "BD-8TH-001", quantity: 5, price: 35 },
  { id: "item-1", name: "OG Kush Pre-Roll Pack", sku: "OGK-PR-002", quantity: 10, price: 25 },
  { id: "item-2", name: "Sour Diesel Cartridge 1g", sku: "SD-CART-1G", quantity: 3, price: 45 },
  { id: "item-3", name: "Hybrid Gummies 100mg", sku: "ED-GUM-100", quantity: 2, price: 28 },
];

const DEMO_FIELD_GEOMETRY = DEMO_LINE_ITEMS.map((_, i) => ({
  product: { left: 0.05, top: 0.2 + i * 0.15, width: 0.5, height: 0.08 },
  sku: { left: 0.55, top: 0.2 + i * 0.15, width: 0.15, height: 0.08 },
  quantity: { left: 0.72, top: 0.2 + i * 0.15, width: 0.08, height: 0.08 },
  price: { left: 0.82, top: 0.2 + i * 0.15, width: 0.12, height: 0.08 },
}));

export async function POST(request: NextRequest) {
  try {
    const { allowed, remaining } = await checkAndIncrementOcrLimit();
    if (!allowed) {
      return NextResponse.json(
        {
          error: `OCR request limit reached (${OCR_REQUEST_LIMIT} max). This is a testing deployment.`,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, or PDF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB for single-page documents." },
        { status: 400 }
      );
    }

    const hasAwsCredentials =
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

    let lineItems;
    let fieldGeometry;

    if (hasAwsCredentials) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await analyzeInvoice(buffer);
        lineItems = result.lineItems;
        fieldGeometry = result.fieldGeometry;
      } catch (textractError) {
        console.warn("Textract failed, using demo data:", textractError);
        lineItems = DEMO_LINE_ITEMS;
        fieldGeometry = DEMO_FIELD_GEOMETRY;
      }
    } else {
      lineItems = DEMO_LINE_ITEMS;
      fieldGeometry = DEMO_FIELD_GEOMETRY;
    }

    return NextResponse.json({
      success: true,
      lineItems,
      fieldGeometry: fieldGeometry ?? [],
      remaining,
      summary: {
        vendor: null,
        date: null,
        total: lineItems.reduce((sum, i) => sum + i.quantity * i.price, 0),
      },
    });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "OCR processing failed",
      },
      { status: 500 }
    );
  }
}
