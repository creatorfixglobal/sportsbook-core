"use client";
import { AccountNav } from "@/app/AccountNav";
import { useEffect,useMemo,useState } from "react";

type Selection={id:string;name:string;status:string;odds_quotes:{decimal_odds:number;expires_at:string|null}[]};
type Event={id:string;name:string;starts_at:string;status:string;is_live:boolean;home_participant_id?:string;away_participant_id?:string;competitions:{name:string;sports:{name:string}};markets:{id:string;name:string;status:string;selections:Selection[]}[]};

function readSlip():any[]{try{return JSON.parse(localStorage.getItem("sportsbook_betslip")||"[]")}catch{return[]}}

export default function HomeClient(){
 const [events,setEvents]=useState<Event[]>([]);const [sport,setSport]=useState("All");const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");const [slipCount,setSlipCount]=useState(0);
 useEffect(()=>{fetch("/api/events",{cache:"no-store"}).then(r=>r.json()).then(j=>setEvents(j.events||[])).catch(()=>setMessage("Unable to load markets")).finally(()=>setLoading(false));setSlipCount(readSlip().length)},[]);
 const sports=useMemo(()=>["All",...Array.from(new Set(events.map(e=>e.competitions?.sports?.name).filter(Boolean)))],[events]);
 const filtered=sport==="All"?events:events.filter(e=>e.competitions?.sports?.name===sport);
 function add(p:Selection,e:Event){const q=p.odds_quotes?.[0];if(!q||p.status!=="open")return;let old=readSlip();old=old.filter(x=>x.eventId!==e.id);old.push({id:p.id,name:p.name,odds:Number(q.decimal_odds),event:e.name,eventId:e.id,marketId:e.markets?.[0]?.id});localStorage.setItem("sportsbook_betslip",JSON.stringify(old));setSlipCount(old.length);setMessage("Selection added — bet slip updated");window.setTimeout(()=>setMessage(""),2200);}
 return <main className="min-h-screen">
  <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><a href="/" className="text-xl font-black tracking-tight">SPORTSBOOK</a><nav className="hidden gap-5 text-sm text-slate-300 md:flex"><a href="/my-bets">My Bets</a><a href="/betslip">Bet Slip</a><a href="/admin">Admin</a></nav><div className="flex items-center gap-2"><a href="/betslip" className="hidden rounded-xl border border-white/10 px-3 py-2 text-sm md:inline-flex">Slip {slipCount}</a><AccountNav /></div></div></header>
  <section className="hero"><div className="mx-auto max-w-7xl px-5 py-10 md:py-16"><div className="max-w-3xl"><div className="eyebrow">SPORTS • LIVE • MARKETS</div><h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">Follow the match. Find the market.</h1><p className="mt-5 text-base text-slate-400 md:text-lg">Explore fixtures, live match centres and available odds in one responsive sportsbook interface.</p></div></div></section>
  <section className="mx-auto max-w-7xl px-5 pb-12"><div className="flex gap-2 overflow-x-auto py-5">{sports.map(s=><button key={s} onClick={()=>setSport(s)} className={s===sport?"tab tab-active":"tab"}>{s}</button>)}</div>
  {loading?<div className="panel">Loading markets…</div>:filtered.length===0?<div className="panel">No markets available.</div>:<div className="space-y-4">{filtered.map(e=><article className="panel overflow-hidden" key={e.id}>
   <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><div><div className="text-xs uppercase tracking-widest text-slate-500">{e.competitions?.sports?.name} • {e.competitions?.name}</div><a href={"/event/"+e.id} className="mt-1 block text-lg font-bold hover:underline">{e.name}</a></div><div className="text-right text-sm">{e.is_live?<span className="live">LIVE</span>:<span className="text-slate-400">{new Date(e.starts_at).toLocaleString()}</span>}</div></div>
   {e.markets.slice(0,3).map(m=><div key={m.id} className="pt-4"><div className="mb-2 flex items-center justify-between"><div className="text-sm font-semibold text-slate-300">{m.name}</div><a href={"/event/"+e.id} className="text-xs text-slate-500 hover:text-white">All markets →</a></div><div className="grid gap-2 sm:grid-cols-2">{m.selections.map(p=>{const q=p.odds_quotes?.[0];return <button disabled={!q||p.status!=="open"} onClick={()=>add(p,e)} key={p.id} className="odd disabled:cursor-not-allowed disabled:opacity-40"><span>{p.name}</span><b>{q?Number(q.decimal_odds).toFixed(2):"—"}</b></button>})}</div></div>)}
  </article>)}</div>}
  {message&&<div className="toast">{message} · <a href="/betslip" className="underline">Open bet slip</a></div>}</section></main>
}