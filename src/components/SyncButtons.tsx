"use client";

import { useState } from "react";
import { Button, Box, Snackbar, Alert, CircularProgress } from "@mui/material";

function SyncIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z" />
    </svg>
  );
}
import type { InvoiceLineItem } from "@/types/invoice";

interface SyncButtonsProps {
  lineItems: InvoiceLineItem[];
  disabled?: boolean;
}

export default function SyncButtons({ lineItems, disabled }: SyncButtonsProps) {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState<"metrc" | "dutchie" | null>(null);

  const handleSync = async (target: "metrc" | "dutchie") => {
    if (lineItems.length === 0) {
      setSnackbar({
        open: true,
        message: "No items to sync",
        severity: "error",
      });
      return;
    }

    setLoading(target);
    try {
      const url = target === "metrc" ? "/api/metrc" : "/api/dutchie";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineItems }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Sync failed");

      setSnackbar({
        open: true,
        message: data.message ?? `Synced to ${target}`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Sync failed",
        severity: "error",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={
            loading === "metrc" ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <InventoryIcon />
            )
          }
          onClick={() => handleSync("metrc")}
          disabled={disabled || !!loading}
          sx={{
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          {loading === "metrc" ? "Syncing..." : "Sync to METRC"}
        </Button>
        <Button
          variant="outlined"
          startIcon={
            loading === "dutchie" ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SyncIcon />
            )
          }
          onClick={() => handleSync("dutchie")}
          disabled={disabled || !!loading}
        >
          {loading === "dutchie" ? "Syncing..." : "Sync to Dutchie"}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
