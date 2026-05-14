"use client";

import { Button, Input } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    // Hard navigation guarantees the auth cookies are flushed to disk before
    // the dashboard server-renders. router.push has a known race with
    // @supabase/ssr cookie writes that intermittently lands users back on /sign-in.
    window.location.assign(redirect);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@school.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        isRequired
        variant="bordered"
      />
      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        isRequired
        variant="bordered"
        endContent={
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-default-500 hover:text-default-700"
            aria-label="Toggle password"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />
      <Button
        type="submit"
        color="primary"
        size="lg"
        className="w-full font-semibold"
        isLoading={loading}
        startContent={!loading && <LogIn size={18} />}
      >
        Sign In
      </Button>
      <div className="text-center text-sm text-default-500">
        <Link href="/" className="hover:underline">← Back to home</Link>
      </div>
      <div className="text-center text-xs text-default-400 pt-2 border-t border-default-100">
        Don&apos;t have an account? Ask your administrator to create one for you.
      </div>
    </form>
  );
}
