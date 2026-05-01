"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { FieldLabel } from "../ui/FieldLabel";
import { getSupabaseBrowser } from "../../lib/supabase/browser";

export function SignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Auth is not configured.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Update profile with phone & name (handle_new_user trigger created the row).
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("id", data.user.id);
    }
    if (data.session) {
      router.refresh();
      router.push("/");
    } else {
      setPendingVerification(true);
    }
    setLoading(false);
  };

  if (pendingVerification) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-5 text-sm text-ink-700">
        We sent a confirmation link to <span className="font-semibold">{email}</span>. Click it to verify your account, then sign in.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FieldLabel required>
        Full name
        <Input
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          placeholder="Riya Banerjee"
        />
      </FieldLabel>
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
      <FieldLabel hint="Used for private contact reveal only">
        Mobile number
        <Input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          placeholder="+91 98xxxxxxxx"
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
        />
      </FieldLabel>
      {error && <p className="text-sm text-brand">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
