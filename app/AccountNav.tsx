"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AccountNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const nextEmail = data.user?.email ?? null;
      setEmail(nextEmail);
      if (data.user) {
        const r = await fetch("/api/wallet", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (active) setBalance(Number(j.balance_minor ?? 0));
        }
      } else {
        setBalance(null);
      }
      setReady(true);
    };

    void load();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "SIGNED_OUT") void load();
    });

    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!ready) return <div className="h-9 w-24 animate-pulse rounded-xl bg-white/10" />;
  if (!email) return <a href="/login" className="primary">Sign in</a>;

  return <div className="flex items-center gap-2">
    <a href="/wallet" className="rounded-xl border border-white/10 px-3 py-2 text-sm">Balance {balance === null ? "…" : balance.toLocaleString()}</a>
    <a href="/my-bets" className="hidden rounded-xl border border-white/10 px-3 py-2 text-sm md:inline-flex">My Bets</a>
    <a href="/account" className="primary">{email.split("@")[0]}</a>
  </div>;
}
