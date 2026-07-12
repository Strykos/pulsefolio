"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useWebSocket, type ConnectionStatus } from "@/lib/websocket";

export interface ApiStreamMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface WebSocketContextValue {
  status: ConnectionStatus;
  lastMessage: ApiStreamMessage | null;
  portfolioValue: number | null;
  hasLiveStream: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

function isApiStreamMessage(message: unknown): message is ApiStreamMessage {
  if (!message || typeof message !== "object") return false;
  const candidate = message as Partial<ApiStreamMessage>;
  return (
    typeof candidate.type === "string" &&
    typeof candidate.timestamp === "string" &&
    !!candidate.data &&
    typeof candidate.data === "object"
  );
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
  const [hasLiveStream, setHasLiveStream] = useState(false);

  const { status, lastMessage: rawLastMessage } = useWebSocket({
    onMessage: (message) => {
      if (!isApiStreamMessage(message)) return;

      if (message.type === "portfolio.update") {
        const value = message.data.total_value;
        if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
          setPortfolioValue(value);
          setHasLiveStream(true);
        }
      }
      if (message.type === "price.tick") {
        setHasLiveStream(true);
      }
    },
  });
  const lastMessage = isApiStreamMessage(rawLastMessage) ? rawLastMessage : null;

  return (
    <WebSocketContext.Provider
      value={{ status, lastMessage, portfolioValue, hasLiveStream: status === "connected" && hasLiveStream }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocketContext must be used within WebSocketProvider");
  return ctx;
}
