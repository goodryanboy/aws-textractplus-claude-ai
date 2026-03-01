"use client";

import { useState, useCallback, useEffect } from "react";
import { Box, Container, Typography, Paper, Snackbar, Alert } from "@mui/material";
import UploadZone from "./UploadZone";
import DataVerificationTable from "./DataVerificationTable";
import ProcessingOverlay from "./ProcessingOverlay";
import InvoiceViewer from "./InvoiceViewer";
import ThemeToggle from "./ThemeToggle";
import type { InvoiceLineItem, FieldGeometry } from "@/types/invoice";

export default function Dashboard() {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [fieldGeometry, setFieldGeometry] = useState<FieldGeometry[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const handleFileSelect = useCallback(async (file: File) => {
    setProcessing(true);
    setError(null);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });
      const ocrData = await ocrRes.json();

      if (!ocrRes.ok) {
        throw new Error(ocrData.error ?? "OCR failed");
      }

      const rawItems = ocrData.lineItems ?? [];
      const geometry = ocrData.fieldGeometry ?? [];
      if (rawItems.length === 0) {
        setLineItems([]);
        setFieldGeometry([]);
        setError("No line items found in document");
        return;
      }

      setFieldGeometry(geometry);

      const parseRes = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineItems: rawItems }),
      });
      const parseData = await parseRes.json();

      if (!parseRes.ok) {
        setLineItems(
          rawItems.map((item: InvoiceLineItem, i: number) => ({
            ...item,
            id: item.id ?? `item-${i}`,
          }))
        );
        return;
      }

      const refined = parseData.lineItems ?? rawItems;
      setLineItems(
        refined.map((item: InvoiceLineItem, i: number) => ({
          ...item,
          id: item.id ?? `item-${i}`,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
      setLineItems([]);
      setFieldGeometry([]);
    } finally {
      setProcessing(false);
    }
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, #0c0f12 0%, #151a20 50%, #0c0f12 100%)"
            : "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 6, textAlign: "center", position: "relative" }}>
          <Box sx={{ position: "absolute", top: 0, right: 0 }}>
            <ThemeToggle />
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            AWS Textract + Claude AI
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
            Invoice OCR Pipeline
          </Typography>
        </Box>

        <Paper
          sx={{
            p: 4,
            mb: 4,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Upload Invoice
          </Typography>
          <UploadZone onFileSelect={handleFileSelect} disabled={processing} />

          {processing && (
            <Box sx={{ mt: 4 }}>
              <ProcessingOverlay message="Extracting data with AWS Textract & Claude AI..." />
            </Box>
          )}

          {!processing && lineItems.length > 0 && (
            <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 4 }}>
              {imageUrl && (
                <InvoiceViewer
                  imageUrl={imageUrl}
                  fieldGeometry={fieldGeometry}
                  fileName={fileName}
                />
              )}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Verify & Edit
                </Typography>
                <DataVerificationTable items={lineItems} onChange={setLineItems} />
              </Box>
            </Box>
          )}

          {!processing && lineItems.length === 0 && !error && (
            <Box
              sx={{
                mt: 4,
                py: 6,
                textAlign: "center",
                color: "text.disabled",
              }}
            >
              <Typography variant="body2">
                Upload an invoice to extract product data
              </Typography>
            </Box>
          )}
        </Paper>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            variant="filled"
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
