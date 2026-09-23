"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AccountNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setEmail(data.user?.email ?? null);
      if (data.user) {
        const r = await fetch("/api/wallet", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (active) setBalance(Number(j.balance_minor ?? 0));
        }
      } else setBalance(null);
    };
    load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => load());
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  if (!email) return <a href="/login" className="primary">Sign in</a>;
  return <div className="flex items-center gap-2">
    <a href="/wallet" className="rounded-xl border border-white/10 px-3 py-2 text-sm">Balance {balance === null ? "…" : balance.toLocaleString()}</a>
    <a href="/account" className="primary">{email.split("@")[0]}</a>
  </div>;
}
