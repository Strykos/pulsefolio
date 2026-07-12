"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export interface StreamMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

function defaultWsUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const base = api.replace(/\/$/, "");
  return base.replace(/^http/, "ws") + "/api/v1/stream";
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? defaultWsUrl();

interface UseWebSocketOptions {
  onMessage?: (message: StreamMessage) => void;
  enabled?: boolean;
}

export function useWebSocket({ onMessage, enabled = true }: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastMessage, setLastMessage] = useState<StreamMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    try {
      setStatus("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setStatus("connected");

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as StreamMessage;
          setLastMessage(message);
          onMessageRef.current?.(message);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => setStatus("disconnected");

      ws.onclose = () => {
        setStatus("disconnected");
        wsRef.current = null;
        reconnectRef.current = setTimeout(connect, 5000);
      };
    } catch {
      setStatus("disconnected");
      reconnectRef.current = setTimeout(connect, 5000);
    }
  }, [enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, lastMessage };
}

export { WS_URL };
