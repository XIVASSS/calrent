"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, KeyRound, Mail } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { FieldLabel } from "../ui/FieldLabel";
import { getSupabaseBrowser } from "../../lib/supabase/browser";
import { cn } from "../../lib/utils";

type Mode = "magic" | "password";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params?.get("redirect") ?? "/";
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Auth is not configured.");
      setLoading(false);
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess("Check your inbox — we just sent you a magic link to sign in.");
  };

  const onPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Auth is not configured.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.refresh();
    router.push(redirectTo);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-full border border-ink-100 bg-ink-50 p-1 text-xs">
        <button
          type="button"
          onClick={() => {
            setMode("magic");
            setError(null);
            setSuccess(null);
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 font-medium transition-colors",
            mode === "magic" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" /> Email me a link
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setError(null);
            setSuccess(null);
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 font-medium transition-colors",
            mode === "password" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
          )}
        >
          <KeyRound className="h-3.5 w-3.5" /> Use password
        </button>
      </div>

      {mode === "magic" ? (
        <form onSubmit={onMagicLink} className="space-y-4">
          <FieldLabel required>
            Email
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </FieldLabel>
          {error && <p className="text-sm text-brand">{error}</p>}
          {success && (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <Mail className="mb-0.5 mr-1 inline h-4 w-4" />
              {success}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send me a magic link"}
          </Button>
          <p className="text-center text-xs text-ink-500">
            No password needed. We&apos;ll email you a one-tap sign-in link.
          </p>
        </form>
      ) : (
        <form onSubmit={onPassword} className="space-y-4">
          <FieldLabel required>
            Email
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </FieldLabel>
          <FieldLabel required>
            Password
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="At least 6 characters"
            />
          </FieldLabel>
          {error && <p className="text-sm text-brand">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      )}
    </div>
  );
}
