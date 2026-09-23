import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function quote(selection:any){
  const q = selection.odds_quotes?.[0];
  if (!q || q.expires_at && new Date(q.expires_at) <= new Date()) return null;
  return Number(q.decimal_odds || 0);
}

export default async function SportPage({params}:{params:Promise<{sport:string}>}){
  const {sport}=await params;
  const s=await createClient();
  const {data: sportRow}=await s.schema("sportsbook").from("sports").select("id,name,slug").eq("slug",sport).maybeSingle();
  const {data: events=[]}=sportRow
    ? await s.schema("sportsbook").from("events").select("id,name,starts_at,status,is_live,competitions(name),markets(id,name,status,selections(id,name,status,odds_quotes(decimal_odds,expires_at,captured_at)))").eq("sport_id",sportRow.id).in("status",["scheduled","live"]).order("starts_at")
    : {data:[] as any[]};

  return <main className="min-h-screen px-4 pb-28 pt-5 sm:px-6"><div className="mx-auto max-w-6xl">
    <div className="flex items-center justify-between gap-3"><Link href="/" className="text-sm font-semibold text-slate-400 hover:text-white">← All sports</Link><span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1 text-[10px] font-black tracking-[.18em] text-slate-500">SPORTSBOOK</span></div>
    <div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] font-black tracking-[.3em] text-emerald-400/80">SPORT</div><h1 className="mt-1 text-3xl font-black tracking-tight">{sportRow?.name||sport}</h1><p className="mt-2 text-sm text-slate-500">{events.length} upcoming/live event{events.length===1?"":"s"}</p></div><Link href="/live" className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-2 text-sm font-bold hover:bg-white/[.06]">Live now</Link></div>
    {events.length===0 ? <div className="panel mt-7"><div className="text-lg font-bold">No events available</div><p className="mt-2 text-sm text-slate-500">Events for this sport will appear here when published.</p></div> :
    <div className="mt-7 space-y-4">{events.map((e:any)=><article key={e.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#081114] shadow-[0_12px_40px_rgba(0,0,0,.2)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5"><div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-[.18em] text-slate-600">{e.competitions?.name||"Competition"}</div><h2 className="mt-1 truncate text-sm font-extrabold sm:text-base">{e.name}</h2></div><div className="shrink-0 text-right">{e.is_live ? <span className="live">LIVE</span> : <div className="text-xs font-semibold text-slate-500">{new Date(e.starts_at).toLocaleString()}</div>}</div></div>
      <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">{(e.markets||[]).filter((m:any)=>m.status==="open"||m.status==="suspended").slice(0,6).map((m:any)=><div key={m.id} className="rounded-xl border border-white/8 bg-black/15 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-400">{m.name}</span><span className="text-[9px] font-black uppercase tracking-wider text-slate-600">{m.status}</span></div><div className="mt-2 space-y-1.5">{(m.selections||[]).slice(0,6).map((p:any)=>{const odds=quote(p);return <Link key={p.id} href={"/event/"+e.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/7 bg-white/[.025] px-3 py-2 text-xs hover:border-emerald-400/30 hover:bg-white/[.05]"><span className="truncate text-slate-300">{p.name}</span><b className="shrink-0 text-emerald-300">{odds ? odds.toFixed(2) : "—"}</b></Link>})}</div></div>)}</div>
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 sm:px-5"><span className="text-xs text-slate-600">Markets update from the server</span><Link href={"/event/"+e.id} className="text-xs font-black text-emerald-400 hover:text-emerald-300">View all markets →</Link></div>
    </article>)}</div>}
  </div></main>
}