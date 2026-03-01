"use client";

import { useCallback, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";

function CloudUploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
    </svg>
  );
}

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file && /\.(jpe?g|png|pdf)$/i.test(file.name)) {
        onFileSelect(file);
      }
    },
    [onFileSelect, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,application/pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileSelect(file);
    };
    input.click();
  }, [onFileSelect, disabled]);

  return (
    <Paper
      component="div"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      sx={{
        cursor: disabled ? "not-allowed" : "pointer",
        p: 4,
        textAlign: "center",
        border: "2px dashed",
        borderColor: isDragging ? "primary.main" : "divider",
        bgcolor: isDragging ? "action.hover" : "background.paper",
        transition: "all 0.2s ease",
        opacity: disabled ? 0.6 : 1,
        "&:hover": disabled
          ? {}
          : {
              borderColor: "primary.main",
              bgcolor: "action.hover",
            },
      }}
    >
      <Box sx={{ color: "primary.main", mb: 2 }}>
        <CloudUploadIcon />
      </Box>
      <Typography variant="h6" color="text.primary" gutterBottom>
        Drop invoice here or click to upload
      </Typography>
      <Typography variant="body2" color="text.secondary">
        JPEG, PNG, or PDF — max 5MB
      </Typography>
    </Paper>
  );
}
