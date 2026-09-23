"use client";
import { AccountNav } from "@/app/AccountNav";
import { useEffect,useMemo,useState } from "react";

type Selection={id:string;name:string;status:string;odds_quotes:{decimal_odds:number;expires_at:string|null}[]};
type Market={id:string;name:string;status:string;selections:Selection[]};
type Event={id:string;name:string;starts_at:string;status:string;is_live:boolean;home_participant_id?:string;away_participant_id?:string;competitions:{name:string;sports:{name:string}};markets:Market[]};

function readSlip():any[]{try{return JSON.parse(localStorage.getItem("sportsbook_betslip")||"[]")}catch{return[]}}

export default function HomeClient(){
 const [events,setEvents]=useState<Event[]>([]);const [sport,setSport]=useState("All");const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");const [slipCount,setSlipCount]=useState(0);
 useEffect(()=>{fetch("/api/events",{cache:"no-store"}).then(r=>r.json()).then(j=>setEvents(j.events||[])).catch(()=>setMessage("Unable to load markets")).finally(()=>setLoading(false));setSlipCount(readSlip().length)},[]);
 const sports=useMemo(()=>["All",...Array.from(new Set(events.map(e=>e.competitions?.sports?.name).filter(Boolean)))],[events]);
 const filtered=sport==="All"?events:events.filter(e=>e.competitions?.sports?.name===sport);
 function add(p:Selection,e:Event,m:Market){const q=p.odds_quotes?.[0];if(!q||p.status!=="open")return;let old=readSlip();old=old.filter(x=>x.eventId!==e.id);old.push({id:p.id,name:p.name,odds:Number(q.decimal_odds),event:e.name,eventId:e.id,marketId:m.id,market:m.name});localStorage.setItem("sportsbook_betslip",JSON.stringify(old));setSlipCount(old.length);setMessage("Selection added — bet slip updated");window.setTimeout(()=>setMessage(""),2200);}
 return <main className="min-h-screen">
  <header className="site-header"><div className="header-inner"><a href="/" className="brand">SPORTSBOOK<span> CORE</span></a><nav className="desktop-links"><a href="/sports/football">Sports</a><a href="/live">Live</a><a href="/my-bets">My Bets</a><a href="/account">Account</a></nav><div className="header-actions"><a href="/betslip" className="slip-pill">Bet Slip <b>{slipCount}</b></a><AccountNav compact /></div></div></header>
  <section className="hero hero-home"><div className="hero-glow"/><div className="hero-inner"><div className="hero-copy"><div className="eyebrow">LIVE SPORTS • MARKETS • MATCH CENTRE</div><h1>Every match.<br/><strong>Every market.</strong></h1><p>Follow live scores, explore markets and build your bet slip from one fast, responsive interface.</p><div className="hero-cta"><a href="/live" className="hero-button">Watch Live</a><a href="/sports/football" className="hero-button secondary">Browse Sports</a></div></div><div className="hero-card"><div className="hero-card-top"><span className="live">LIVE</span><span>Featured match</span></div><div className="hero-score"><div><small>HOME</small><b>—</b></div><span>VS</span><div><small>AWAY</small><b>—</b></div></div><div className="hero-note">Live match centre · stats · markets</div></div></div></section>
  <section className="home-content"><div className="section-head"><div><div className="eyebrow">MARKETS</div><h2>Today’s events</h2></div><a href="/sports/football" className="view-all">View all →</a></div>
  <div className="sport-rail">{sports.map(s=><button key={s} onClick={()=>setSport(s)} className={s===sport?"sport-chip active":"sport-chip"}>{s}</button>)}</div>
  {loading?<div className="market-grid"><div className="panel">Loading markets…</div></div>:filtered.length===0?<div className="panel">No markets available.</div>:<div className="market-grid">{filtered.map(e=><article className="event-card" key={e.id}>
   <div className="event-top"><div><div className="competition">{e.competitions?.sports?.name} <span>•</span> {e.competitions?.name}</div><a href={"/event/"+e.id} className="event-name">{e.name}</a></div>{e.is_live?<span className="live">LIVE</span>:<span className="event-time">{new Date(e.starts_at).toLocaleString()}</span>}</div>
   {e.markets.slice(0,3).map(m=><div key={m.id} className="market-block"><div className="market-title"><span>{m.name}</span><a href={"/event/"+e.id}>All markets →</a></div><div className="odds-grid">{m.selections.map(p=>{const q=p.odds_quotes?.[0];return <button disabled={!q||p.status!=="open"} onClick={()=>add(p,e,m)} key={p.id} className="odd"><span>{p.name}</span><b>{q?Number(q.decimal_odds).toFixed(2):"—"}</b></button>})}</div></div>)}
  </article>)}</div>}
  {message&&<div className="toast">{message} · <a href="/betslip" className="underline">Open bet slip</a></div>}</section></main>
}