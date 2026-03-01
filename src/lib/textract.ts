import {
  TextractClient,
  AnalyzeExpenseCommand,
  type ExpenseDocument,
} from "@aws-sdk/client-textract";
import type {
  InvoiceLineItem,
  AnalyzeInvoiceResult,
  FieldGeometry,
  BoundingBoxNorm,
} from "@/types/invoice";
import { InvoiceLineItemSchema } from "./schemas";

const client = new TextractClient({
  region: process.env.AWS_REGION ?? "us-west-2",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

function extractBoundingBox(geom: { Left?: number; Top?: number; Width?: number; Height?: number } | undefined): BoundingBoxNorm | undefined {
  if (!geom || geom.Left == null || geom.Top == null || geom.Width == null || geom.Height == null) return undefined;
  return {
    left: geom.Left,
    top: geom.Top,
    width: geom.Width,
    height: geom.Height,
  };
}

export async function analyzeInvoice(buffer: Buffer): Promise<AnalyzeInvoiceResult> {
  const command = new AnalyzeExpenseCommand({
    Document: {
      Bytes: new Uint8Array(buffer),
    },
  });

  const response = await client.send(command);
  const { lineItems, fieldGeometry } = parseExpenseDocuments(response.ExpenseDocuments ?? []);
  return { lineItems, fieldGeometry };
}

function parseExpenseDocuments(docs: ExpenseDocument[]): { lineItems: InvoiceLineItem[]; fieldGeometry: FieldGeometry[] } {
  const items: InvoiceLineItem[] = [];
  const fieldGeometry: FieldGeometry[] = [];
  let idCounter = 0;

  for (const doc of docs) {
    const lineItemGroups = doc.LineItemGroups ?? [];

    for (const group of lineItemGroups) {
      const lineItems = group.LineItems ?? [];

      for (const lineItem of lineItems) {
        const { parsed, geometry } = parseLineItemWithGeometry(lineItem, idCounter);
        if (parsed) {
          const validated = InvoiceLineItemSchema.safeParse({
            ...parsed,
            id: `item-${idCounter}`,
          });
          if (validated.success) {
            items.push(validated.data as InvoiceLineItem);
            fieldGeometry.push(geometry);
          }
        }
        idCounter++;
      }
    }
  }

  return { lineItems: items, fieldGeometry };
}

function getFieldType(field: { Type?: unknown }): string {
  const t = field.Type;
  if (t && typeof t === "object" && "Text" in t && typeof (t as { Text?: string }).Text === "string") {
    return (t as { Text: string }).Text;
  }
  return String(t ?? "");
}

interface LineItemField {
  Type?: unknown;
  ValueDetection?: { Text?: string; Geometry?: { BoundingBox?: { Left?: number; Top?: number; Width?: number; Height?: number } } };
}

function parseLineItemWithGeometry(
  lineItem: { LineItemExpenseFields?: LineItemField[] },
  id: number
): { parsed: Partial<InvoiceLineItem> | null; geometry: FieldGeometry } {
  const fields = lineItem.LineItemExpenseFields ?? [];
  let name = "";
  let sku: string | undefined;
  let quantity = 0;
  let price = 0;
  const geometry: FieldGeometry = {};

  for (const field of fields) {
    const type = getFieldType(field);
    const value = field.ValueDetection?.Text?.trim() ?? "";
    const box = extractBoundingBox(field.ValueDetection?.Geometry?.BoundingBox);

    switch (type) {
      case "ITEM":
        name = value;
        if (box) geometry.product = box;
        break;
      case "QUANTITY":
        quantity = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
        if (box) geometry.quantity = box;
        break;
      case "PRICE":
        price = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
        if (box) geometry.price = box;
        break;
      case "UNIT_PRICE":
        if (!price) price = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
        if (box && !geometry.price) geometry.price = box;
        break;
      case "EXPENSE_ROW":
        if (value && !sku) sku = value;
        if (box && !geometry.sku) geometry.sku = box;
        break;
      default:
        if (value && /^[A-Z0-9-]+$/i.test(value) && !sku) sku = value;
        if (box && !geometry.sku) geometry.sku = box;
    }
  }

  if (!name && !quantity && !price) return { parsed: null, geometry };

  return {
    parsed: {
      id: `item-${id}`,
      name: name || "Unknown Product",
      sku: sku || undefined,
      quantity: quantity || 1,
      price,
    },
    geometry,
  };
}
