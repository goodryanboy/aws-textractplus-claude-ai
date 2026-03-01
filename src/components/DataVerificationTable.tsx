"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Typography,
} from "@mui/material";
import type { InvoiceLineItem } from "@/types/invoice";
import { InvoiceLineItemSchema } from "@/lib/schemas";

interface DataVerificationTableProps {
  items: InvoiceLineItem[];
  onChange: (items: InvoiceLineItem[]) => void;
}

export default function DataVerificationTable({
  items,
  onChange,
}: DataVerificationTableProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateItem = useCallback(
    (id: string, field: keyof InvoiceLineItem, value: string | number) => {
      const updated = items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      );
      onChange(updated);

      const item = updated.find((i) => i.id === id);
      if (item) {
        const result = InvoiceLineItemSchema.safeParse({
          ...item,
          quantity: typeof item.quantity === "string" ? parseFloat(item.quantity as string) : item.quantity,
          price: typeof item.price === "string" ? parseFloat(item.price as string) : item.price,
        });
        setErrors((prev) => ({
          ...prev,
          [id]: result.success ? "" : result.error?.issues[0]?.message ?? "",
        }));
      }
    },
    [items, onChange]
  );

  const removeItem = useCallback(
    (id: string) => {
      onChange(items.filter((i) => i.id !== id));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [items, onChange]
  );

  const total = items.reduce(
    (sum, i) =>
      sum +
      (typeof i.quantity === "number" ? i.quantity : parseFloat(String(i.quantity)) || 0) *
        (typeof i.price === "number" ? i.price : parseFloat(String(i.price)) || 0),
    0
  );

  if (items.length === 0) return null;

  return (
    <TableContainer component={Paper} sx={{ overflow: "hidden" }}>
      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Qty
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Price
            </TableCell>
            <TableCell width={56} />
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              hover
              sx={{
                "&:hover .delete-btn": { opacity: 1 },
              }}
            >
              <TableCell>
                <TextField
                  size="small"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  error={!!errors[item.id]}
                  fullWidth
                  variant="outlined"
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  value={item.sku ?? ""}
                  onChange={(e) => updateItem(item.id, "sku", e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="—"
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
                />
              </TableCell>
              <TableCell align="right">
                <TextField
                  size="small"
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                  }
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ width: 80, "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
                />
              </TableCell>
              <TableCell align="right">
                <TextField
                  size="small"
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    updateItem(item.id, "price", parseFloat(e.target.value) || 0)
                  }
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ width: 100, "& .MuiOutlinedInput-root": { bgcolor: "background.default" } }}
                />
              </TableCell>
              <TableCell>
                <IconButton
                  className="delete-btn"
                  size="small"
                  onClick={() => removeItem(item.id)}
                  sx={{ opacity: 0.5, color: "error.main" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", textAlign: "right" }}>
        <Typography variant="h6" color="primary.main">
          Total: ${total.toFixed(2)}
        </Typography>
      </Box>
    </TableContainer>
  );
}
