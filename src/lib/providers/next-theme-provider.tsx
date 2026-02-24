"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </NextThemesProvider>
      </body>
    </html>
  );
}
