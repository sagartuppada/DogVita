"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, ArrowRight } from "lucide-react";
import { useSessionStore } from "@/store/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * v1 mock login — any email/password is accepted and signs in the seeded
 * admin operator. Phase 1 swaps this for Supabase Auth (email+SSO) with
 * a role claim; the form markup stays the same.
 */
export default function LoginPage() {
  const router = useRouter();
  const signIn = useSessionStore((s) => s.signIn);
  const [email, setEmail] = useState("maya@dogvita.com");
  const [password, setPassword] = useState("demo");
  const [busy, setBusy] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Mock: succeed regardless. Real auth will live here in Phase 1.
    setTimeout(() => {
      signIn();
      router.replace("/dashboard");
    }, 250);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xxl bg-primary text-white shadow-md">
            <PawPrint className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-cocoa">DogVita CRM</h1>
          <p className="mt-1 text-sm text-cocoa-secondary">
            Operator console
          </p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-cocoa">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-cocoa"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
            {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
          <p className="text-center text-xs text-cocoa-tertiary">
            Demo mode — any credentials work
          </p>
        </form>
      </div>
    </div>
  );
}
