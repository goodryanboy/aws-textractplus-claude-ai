import Anthropic from "@anthropic-ai/sdk";
import { InvoiceLineItemSchema, type InvoiceLineItemType } from "./schemas";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function refineInvoiceData(
  rawLineItems: Array<{ name: string; sku?: string; quantity: number; price: number }>
): Promise<InvoiceLineItemType[]> {
  const prompt = `You are an expert at parsing cannabis dispensary invoices. Given the following raw OCR-extracted line items from an invoice, normalize and refine the data.

For each line item:
1. Clean up product names (fix OCR errors, standardize cannabis product naming)
2. Infer or extract SKU codes where missing (look for alphanumeric codes in product names)
3. Ensure quantity and price are correct numbers

Return ONLY a valid JSON array of objects with this exact structure (no markdown, no explanation):
[{"name": "string", "sku": "string or null", "quantity": number, "price": number}, ...]

Raw OCR data:
${JSON.stringify(rawLineItems, null, 2)}`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = message.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let text = textContent.text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    text = jsonMatch[0];
  }

  const parsed = JSON.parse(text) as unknown[];
  const result: InvoiceLineItemType[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i] as Record<string, unknown>;
    const validated = InvoiceLineItemSchema.safeParse({
      id: `item-${i}`,
      name: String(item.name ?? ""),
      sku: item.sku ? String(item.sku) : undefined,
      quantity: Number(item.quantity ?? 0),
      price: Number(item.price ?? 0),
    });
    if (validated.success) {
      result.push(validated.data);
    }
  }

  return result;
}
