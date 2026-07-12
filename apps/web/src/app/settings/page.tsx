"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsView } from "@/components/observatory/SettingsView";
import { PageBanner } from "@/components/ui/PageBanner";
import { api } from "@/lib/api";
import type { SettingsData } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then(({ data, error }) => {
      if (!data) {
        setLoadError(error ?? "API unavailable");
        return;
      }
      setSettings(data);
      setLoadError(null);
    });
  }, []);

  const update = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    api.updateSettings({ [key]: value });
  };

  return (
    <AppShell title="Settings" variant="observatory">
      {settings ? (
        <SettingsView settings={settings} onUpdate={update} />
      ) : (
        <PageBanner kind="demo">{loadError ?? "Connecting to live settings API…"}</PageBanner>
      )}
    </AppShell>
  );
}
