"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Login(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [mode,setMode]=useState<"login"|"signup">("login"); const [msg,setMsg]=useState(""); const [busy,setBusy]=useState(false);
 const router=useRouter();
 async function submit(e:React.FormEvent){
  e.preventDefault(); setBusy(true); setMsg("Processing...");
  const s=createClient();
  const r=mode==="login"?await s.auth.signInWithPassword({email,password}):await s.auth.signUp({email,password});
  if(r.error){setMsg(r.error.message);setBusy(false);return;}
  if(mode==="signup" && !r.data.session){setMsg("Account created. Please confirm your email, then sign in.");setBusy(false);return;}
  setMsg("Signed in. Loading your account...");
  await s.auth.getUser();
  router.replace("/");
  router.refresh();
 }
 return <main className="min-h-screen grid place-items-center p-5"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-7"><a href="/" className="text-sm text-slate-400">← Sportsbook</a><h1 className="mt-5 text-2xl font-bold">Account</h1><p className="mt-2 text-sm text-slate-400">Secure sportsbook account access.</p><input className="field mt-6" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/><input className="field mt-3" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}/><button disabled={busy} className="primary mt-4 w-full">{busy?"Please wait…":mode==="login"?"Sign in":"Create account"}</button><button type="button" disabled={busy} onClick={()=>setMode(mode==="login"?"signup":"login")} className="mt-4 w-full text-sm text-slate-300">{mode==="login"?"Create a new account":"Back to sign in"}</button>{msg&&<p className="mt-4 text-sm text-slate-300">{msg}</p>}</form></main>
}
