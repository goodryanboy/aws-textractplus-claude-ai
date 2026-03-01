export interface InvoiceLineItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
}

export interface InvoiceData {
  vendor?: string;
  date?: string;
  total?: number;
  lineItems: InvoiceLineItem[];
}

export interface TextractLineItem {
  item?: string;
  quantity?: string;
  price?: string;
  expenseRow?: string;
}

export interface BoundingBoxNorm {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FieldGeometry {
  product?: BoundingBoxNorm;
  sku?: BoundingBoxNorm;
  quantity?: BoundingBoxNorm;
  price?: BoundingBoxNorm;
}

export interface AnalyzeInvoiceResult {
  lineItems: InvoiceLineItem[];
  fieldGeometry: FieldGeometry[];
}
