import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event, error } = await supabase.schema("sportsbook").from("events")
    .select("id,name,status,is_live,starts_at,provider_event_id,live_score_home,live_score_away,live_period,live_clock,live_stats,home_participant_id,away_participant_id")
    .eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  let live = {
    is_live: Boolean(event.is_live),
    score: { home: Number(event.live_score_home ?? 0), away: Number(event.live_score_away ?? 0) },
    period: event.live_period ?? null,
    clock: event.live_clock ?? null,
    stats: event.live_stats ?? {},
    source: event.provider_event_id ? "provider-ready" : "internal"
  };

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (apiKey && event.provider_event_id) {
    try {
      const r = await fetch(`https://v3.football.api-sports.io/fixtures?id=${encodeURIComponent(event.provider_event_id)}`, {
        headers: { "x-apisports-key": apiKey },
        next: { revalidate: 15 }
      });
      if (r.ok) {
        const j = await r.json();
        const f = j.response?.[0];
        if (f) {
          live = {
            is_live: ["1H","HT","2H","ET","P","LIVE"].includes(String(f.fixture?.status?.short)),
            score: { home: Number(f.goals?.home ?? 0), away: Number(f.goals?.away ?? 0) },
            period: f.fixture?.status?.long ?? f.fixture?.status?.short ?? null,
            clock: f.fixture?.status?.elapsed != null ? `${f.fixture.status.elapsed}'` : null,
            stats: { venue: f.fixture?.venue?.name ?? null, status: f.fixture?.status ?? null },
            source: "api-football"
          };
        }
      }
    } catch {}
  }

  return NextResponse.json({ event: { id: event.id, name: event.name }, live }, {
    headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=20" }
  });
}
