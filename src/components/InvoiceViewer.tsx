"use client";

import { useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { FieldGeometry } from "@/types/invoice";

const HIGHLIGHT_COLORS = {
  product: "rgba(13, 148, 136, 0.35)",
  sku: "rgba(45, 212, 191, 0.35)",
  quantity: "rgba(34, 197, 94, 0.35)",
  price: "rgba(245, 158, 11, 0.35)",
};

type HighlightKey = keyof typeof HIGHLIGHT_COLORS;

interface InvoiceViewerProps {
  imageUrl: string;
  fieldGeometry: FieldGeometry[];
  fileName?: string;
}

const TOLERANCE = 0.01;

function isAtInitialState(
  scale: number,
  positionX: number,
  positionY: number,
  initial: { scale: number; positionX: number; positionY: number } | null
): boolean {
  if (!initial) return true;
  return (
    Math.abs(scale - initial.scale) < TOLERANCE &&
    Math.abs(positionX - initial.positionX) < TOLERANCE &&
    Math.abs(positionY - initial.positionY) < TOLERANCE
  );
}

export default function InvoiceViewer({
  imageUrl,
  fieldGeometry,
  fileName,
}: InvoiceViewerProps) {
  const [highlights, setHighlights] = useState<Set<HighlightKey>>(new Set(["product", "price"]));
  const [hasChanges, setHasChanges] = useState(false);
  const initialRef = useRef<{ scale: number; positionX: number; positionY: number } | null>(null);

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: "background.paper",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} color="text.primary">
          Document Preview
        </Typography>
      </Box>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit
        wheel={{ step: 0.08 }}
        doubleClick={{ mode: "reset" }}
        onTransformed={(_, state) => {
          if (initialRef.current === null) {
            initialRef.current = { scale: state.scale, positionX: state.positionX, positionY: state.positionY };
          }
          setHasChanges(!isAtInitialState(state.scale, state.positionX, state.positionY, initialRef.current));
        }}
        onInit={(ref) => {
          const s = ref.state;
          if (s) initialRef.current = { scale: s.scale, positionX: s.positionX, positionY: s.positionY };
        }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
              <ToggleButtonGroup
                value={Array.from(highlights)}
                onChange={(_, v: HighlightKey[]) => v !== null && setHighlights(new Set(v))}
                exclusive={false}
                size="small"
                sx={{ flexWrap: "wrap" }}
              >
                {(["product", "sku", "quantity", "price"] as const).map((key) => (
                  <ToggleButton
                    key={key}
                    value={key}
                    sx={{
                      textTransform: "capitalize",
                      fontSize: "0.75rem",
                      py: 0.5,
                      "&.Mui-selected": {
                        bgcolor: HIGHLIGHT_COLORS[key],
                        color: "text.primary",
                        "&:hover": { bgcolor: HIGHLIGHT_COLORS[key] },
                      },
                    }}
                  >
                    {key}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title="Zoom in">
                  <IconButton size="small" onClick={() => zoomIn()} sx={{ color: "text.secondary" }}>
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom out">
                  <IconButton size="small" onClick={() => zoomOut()} sx={{ color: "text.secondary" }}>
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={hasChanges ? "Reset view" : "No changes to reset"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => {
                        resetTransform();
                        setHasChanges(false);
                      }}
                      disabled={!hasChanges}
                      sx={{ color: "text.secondary" }}
                    >
                      <FitScreenIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>

            <Box
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 1,
                  bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.06)"),
                  minHeight: 320,
                }}
              >
                <TransformComponent
                  wrapperStyle={{ width: "100%", minHeight: 320 }}
                  contentStyle={{ width: "100%", minHeight: 320, display: "flex", justifyContent: "center", alignItems: "flex-start" }}
                >
                  <Box sx={{ position: "relative", display: "inline-block" }}>
                    <img
                      src={imageUrl}
                      alt={fileName ?? "Invoice"}
                      style={{
                        display: "block",
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: "70vh",
                        objectFit: "contain",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: "none",
                      }}
                    >
                      {fieldGeometry.map((geom, idx) => (
                        <Box key={idx} sx={{ position: "absolute", inset: 0 }}>
                          {highlights.has("product") && geom.product && (
                            <Box
                              sx={{
                                position: "absolute",
                                left: `${geom.product.left * 100}%`,
                                top: `${geom.product.top * 100}%`,
                                width: `${geom.product.width * 100}%`,
                                height: `${geom.product.height * 100}%`,
                                bgcolor: HIGHLIGHT_COLORS.product,
                                border: "1px solid rgba(13, 148, 136, 0.6)",
                                borderRadius: 0.5,
                                boxSizing: "border-box",
                              }}
                            />
                          )}
                          {highlights.has("sku") && geom.sku && (
                            <Box
                              sx={{
                                position: "absolute",
                                left: `${geom.sku.left * 100}%`,
                                top: `${geom.sku.top * 100}%`,
                                width: `${geom.sku.width * 100}%`,
                                height: `${geom.sku.height * 100}%`,
                                bgcolor: HIGHLIGHT_COLORS.sku,
                                border: "1px solid rgba(45, 212, 191, 0.6)",
                                borderRadius: 0.5,
                                boxSizing: "border-box",
                              }}
                            />
                          )}
                          {highlights.has("quantity") && geom.quantity && (
                            <Box
                              sx={{
                                position: "absolute",
                                left: `${geom.quantity.left * 100}%`,
                                top: `${geom.quantity.top * 100}%`,
                                width: `${geom.quantity.width * 100}%`,
                                height: `${geom.quantity.height * 100}%`,
                                bgcolor: HIGHLIGHT_COLORS.quantity,
                                border: "1px solid rgba(34, 197, 94, 0.6)",
                                borderRadius: 0.5,
                                boxSizing: "border-box",
                              }}
                            />
                          )}
                          {highlights.has("price") && geom.price && (
                            <Box
                              sx={{
                                position: "absolute",
                                left: `${geom.price.left * 100}%`,
                                top: `${geom.price.top * 100}%`,
                                width: `${geom.price.width * 100}%`,
                                height: `${geom.price.height * 100}%`,
                                bgcolor: HIGHLIGHT_COLORS.price,
                                border: "1px solid rgba(245, 158, 11, 0.6)",
                                borderRadius: 0.5,
                                boxSizing: "border-box",
                              }}
                            />
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </TransformComponent>
              </Box>
          </Box>
        )}
      </TransformWrapper>
    </Paper>
  );
}
