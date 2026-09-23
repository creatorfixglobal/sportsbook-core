import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("id,name,starts_at,status,is_live,home_participant_id,away_participant_id,competitions(name,sports(name)),markets(id,name,status,selections(id,name,status,odds_quotes(decimal_odds,expires_at,captured_at)))").schema("sportsbook").order("starts_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] }, { headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=30" } });
}