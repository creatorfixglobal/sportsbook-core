import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.schema("sportsbook").from("events")
    .select("id,name,starts_at,status,is_live,home_participant_id,away_participant_id,competitions(name,sports(name)),markets(id,name,status,selections(id,name,status,odds_quotes(decimal_odds,expires_at,captured_at)))")
    .eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ event: data }, { headers: { "Cache-Control": "no-store" } });
}
