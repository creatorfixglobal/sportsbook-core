"use client";
import { useEffect, useMemo, useState } from "react";

const footballGroups = ["Match Result","Double Chance","Goals","Both Teams to Score","Correct Score","Team Goals","Corners","Cards","Player Shots","Shots on Target","Goalscorers","Free Kicks","Throw Ins","Goal Kicks","Asian Handicap","First Half","Extra Time","In-Play"];
const cricketGroups = ["Match Winner","Innings Runs","Team Runs","Boundaries","4s / 6s","Odd / Even","Player Runs","Player Wickets","Next Over","Next 5 Balls","Series / Tournament"];

export default function EventPage({params}:{params:Promise<{id:string}>}){
 const [id,setId]=useState(""); const [event,setEvent]=useState<any>(null); const [live,setLive]=useState<any>(null); const [tab,setTab]=useState<"markets"|"live">("markets"); const [group,setGroup]=useState("");
 useEffect(()=>{void params.then(p=>setId(p.id))},[params]);
 useEffect(()=>{if(!id)return; fetch(`/api/events/${id}`,{cache:"no-store"}).then(r=>r.json()).then(j=>setEvent(j.event||j.events?.[0]||null)).catch(()=>{});},[id]);
 useEffect(()=>{if(!id)return; let alive=true; const load=()=>fetch(`/api/events/${id}/live`,{cache:"no-store"}).then(r=>r.json()).then(j=>{if(alive)setLive(j.live)}).catch(()=>{}); void load(); const t=window.setInterval(load,10000); return()=>{alive=false;window.clearInterval(t)};},[id]);
 const markets=event?.markets||[];
 const groups=useMemo(()=>{const sport=String(event?.competitions?.sports?.name||event?.sport||"").toLowerCase(); return sport.includes("cricket")?cricketGroups:footballGroups},[event]);
 if(!id) return <main className="min-h-screen p-5"><div className="mx-auto max-w-6xl">Loading…</div></main>;
 return <main className="min-h-screen bg-slate-950">
  <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><a href="/" className="font-bold">SPORTSBOOK</a><div className="flex gap-2"><a href="/betslip" className="rounded-xl border border-white/10 px-3 py-2 text-sm">Bet Slip</a><a href="/account" className="rounded-xl border border-white/10 px-3 py-2 text-sm">Account</a></div></div></header>
  <div className="mx-auto max-w-6xl px-5 py-5"><a href="/" className="text-sm text-slate-400">← Sports</a>
   {!event?<div className="panel mt-5">Loading event…</div>:<>
    <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[.04]">
     <div className="border-b border-white/10 p-5"><div className="text-xs uppercase tracking-widest text-slate-500">{event.name}</div><div className="mt-2 flex items-center justify-between"><div><div className="text-sm text-slate-400">{event.status}</div><h1 className="text-3xl font-black">{live?.score ? `${live.score.home} - ${live.score.away}` : "VS"}</h1></div><div className="text-right">{live?.is_live?<><div className="live">LIVE</div><div className="mt-2 text-sm text-slate-300">{live.clock||live.period||"In play"}</div></>:<div className="text-sm text-slate-400">{new Date(event.starts_at).toLocaleString()}</div>}</div></div></div>
     <div className="flex border-b border-white/10"><button onClick={()=>setTab("markets")} className={tab==="markets"?"flex-1 border-b-2 border-white px-4 py-3 text-sm font-bold":"flex-1 px-4 py-3 text-sm text-slate-400"}>Markets</button><button onClick={()=>setTab("live")} className={tab==="live"?"flex-1 border-b-2 border-white px-4 py-3 text-sm font-bold":"flex-1 px-4 py-3 text-sm text-slate-400"}>Match Live</button></div>
    </section>
    {tab==="live"?<section className="mt-4 grid gap-4 md:grid-cols-[1.3fr_.7fr]"><div className="panel min-h-72"><div className="flex items-center justify-between"><h2 className="font-bold">Live Match Center</h2><span className="text-xs text-slate-500">{live?.source}</span></div><div className="mt-10 text-center"><div className="text-6xl font-black">{live?.score?.home??0} : {live?.score?.away??0}</div><div className="mt-3 text-slate-400">{live?.period||"Waiting for live coverage"} {live?.clock&&`· ${live.clock}`}</div></div></div><div className="panel"><h2 className="font-bold">Live statistics</h2><pre className="mt-4 max-h-80 overflow-auto text-xs text-slate-400">{JSON.stringify(live?.stats||{},null,2)}</pre></div></section>
    :<section className="mt-4"><div className="flex gap-2 overflow-x-auto pb-3">{groups.map(g=><button key={g} onClick={()=>setGroup(group===g?"":g)} className={group===g?"tab tab-active":"tab"}>{g}</button>)}</div><div className="space-y-4">{markets.length?markets.map((m:any)=><div className="panel" key={m.id}><div className="flex items-center justify-between"><h2 className="font-bold">{m.name}</h2><span className="text-xs text-slate-500">{m.status}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{m.selections?.map((p:any)=><button className="odd" key={p.id}><span>{p.name}</span><b>{Number(p.odds_quotes?.[0]?.decimal_odds||0).toFixed(2)}</b></button>)}</div></div>):<div className="panel"><b>{group||"Markets"}</b><p className="mt-2 text-sm text-slate-400">This market family is ready in the architecture but no quote is currently supplied for this event.</p></div>}</div></section>}
   </>}
  </div>
 </main>;
}
