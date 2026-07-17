"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("demo@pulsefolio.app");
  const [password, setPassword] = useState("demo12345");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error ?? "Login failed");
    } else {
      router.replace("/dashboard/");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080C10] px-4 text-[#F2F4F5]">
      <div className="w-full max-w-md rounded-xl border border-[#222A35] bg-[#0D1218] p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandLogo variant="wordmark" size="lg" />
          <p className="text-sm text-[#89919E]">Sign in to your paper trading portfolio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#89919E]">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[#222A35] bg-[#080C10] px-4 py-3 text-sm outline-none ring-[#00D4AA]/40 transition focus:border-[#00D4AA] focus:ring-2"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#89919E]">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-[#222A35] bg-[#080C10] px-4 py-3 text-sm outline-none ring-[#00D4AA]/40 transition focus:border-[#00D4AA] focus:ring-2"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-[#89919E]">
          Demo account: demo@pulsefolio.app / demo12345
        </p>
      </div>
    </div>
  );
}
