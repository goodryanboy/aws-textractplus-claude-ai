import { z } from "zod";

export const InvoiceLineItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  price: z.number().min(0, "Price cannot be negative"),
});

export const InvoiceDataSchema = z.object({
  vendor: z.string().optional(),
  date: z.string().optional(),
  total: z.number().optional(),
  lineItems: z.array(InvoiceLineItemSchema),
});

export type InvoiceLineItemType = z.infer<typeof InvoiceLineItemSchema>;
export type InvoiceDataType = z.infer<typeof InvoiceDataSchema>;
