"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items=[["/","⌂","Home"],["/sports/football","◈","Sports"],["/live","●","Live"],["/betslip","▣","Bets"],["/account","◎","Account"]] as const;
export function BottomNav(){const path=usePathname();return <nav className="bottom-nav"><div className="bottom-nav-inner">{items.map(([href,icon,label])=>{const active=href==="/" ? path==="/" : path.startsWith(href);return <Link key={href} href={href} className={active?"bottom-item active":"bottom-item"}><span className="bottom-icon">{icon}</span><span>{label}</span></Link>})}</div></nav>}