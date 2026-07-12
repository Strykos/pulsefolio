"use client";

import { ThemeProvider } from "./ThemeProvider";
import { WebSocketProvider } from "./WebSocketProvider";
import { AuthProvider } from "./AuthProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <WebSocketProvider>{children}</WebSocketProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
