"use client";

import { Box, Typography, CircularProgress } from "@mui/material";

interface ProcessingOverlayProps {
  message?: string;
}

export default function ProcessingOverlay({
  message = "Processing invoice...",
}: ProcessingOverlayProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        py: 8,
        px: 4,
      }}
    >
      <CircularProgress
        size={56}
        thickness={4}
        sx={{ color: "primary.main" }}
      />
      <Typography variant="h6" color="text.secondary">
        {message}
      </Typography>
      <Typography variant="body2" color="text.disabled">
        AWS Textract + Claude AI
      </Typography>
    </Box>
  );
}
