"use client";

import { useMemo } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { ColorModeProvider, useColorMode } from "@/lib/color-mode-context";

function ThemeInner({ children }: { children: React.ReactNode }) {
  const { mode } = useColorMode();
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "dark"
            ? {
                primary: { main: "#0d9488", light: "#2dd4bf", dark: "#0f766e" },
                secondary: { main: "#14b8a6", light: "#5eead4", dark: "#0d9488" },
                background: { default: "#0c0f12", paper: "#151a20" },
              }
            : {
                primary: { main: "#0d9488", light: "#0f766e", dark: "#115e59" },
                secondary: { main: "#14b8a6", light: "#0d9488", dark: "#0f766e" },
                background: { default: "#f8fafc", paper: "#ffffff" },
              }),
          success: { main: "#22c55e" },
          error: { main: "#ef4444" },
        },
        typography: {
          fontFamily: '"DM Sans", "Outfit", system-ui, sans-serif',
          h4: { fontWeight: 600, letterSpacing: "-0.02em" },
          h5: { fontWeight: 600, letterSpacing: "-0.01em" },
          body1: { letterSpacing: "0.01em" },
        },
        shape: { borderRadius: 12 },
        components: {
          MuiButton: {
            styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                border: mode === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)",
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: mode === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)",
              },
            },
          },
        },
      }),
    [mode]
  );
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ColorModeProvider>
      <ThemeInner>{children}</ThemeInner>
    </ColorModeProvider>
  );
}
