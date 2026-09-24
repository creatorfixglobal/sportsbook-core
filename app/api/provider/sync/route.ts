import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listOdds, listSports, type OddsEvent, type OddsProviderSport } from "@/lib/providers/theoddsapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER = "theoddsapi";
const WINDOW_DAYS = 60;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "sport";
}

function marketName(key: string, point: number | null | undefined) {
  const base =
    key === "h2h" ? "Match Winner" :
    key === "spreads" ? "Spread" :
    key === "totals" ? "Total" :
    key;
  return point == null ? base : `${base} ${point > 0 ? "+" : ""}${point}`;
}

function selectionName(name: string, description?: string | null, point?: number | null) {
  const parts = [description, name];
  if (point != null) parts.push(String(point));
  return parts.filter(Boolean).join(" ");
}

async function findOrCreateSport(
  db: ReturnType<typeof createAdminClient>,
  providerSport: OddsProviderSport,
) {
  const slug = slugify(providerSport.key);
  const { data: existing } = await db
    .schema("sportsbook")
    .from("sports")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await db
    .schema("sportsbook")
    .from("sports")
    .insert({ name: providerSport.title || providerSport.key, slug })
    .select("id")
    .single();

  if (error) throw new Error(`sport insert failed: ${error.message}`);
  return data.id;
}

async function findOrCreateCompetition(
  db: ReturnType<typeof createAdminClient>,
  sportId: string,
  providerSport: OddsProviderSport,
) {
  const slug = slugify(providerSport.key);
  const { data: existing } = await db
    .schema("sportsbook")
    .from("competitions")
    .select("id")
    .eq("sport_id", sportId)
    .eq("slug", slug)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await db
    .schema("sportsbook")
    .from("competitions")
    .insert({
      sport_id: sportId,
      name: providerSport.title || providerSport.group || providerSport.key,
      slug,
      external_id: providerSport.key,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw new Error(`competition insert failed: ${error.message}`);
  return data.id;
}

async function findOrCreateParticipant(
  db: ReturnType<typeof createAdminClient>,
  sportId: string,
  name: string,
  externalId: string,
) {
  const { data: existing } = await db
    .schema("sportsbook")
    .from("participants")
    .select("id")
    .eq("sport_id", sportId)
    .eq("name", name)
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await db
    .schema("sportsbook")
    .from("participants")
    .insert({
      sport_id: sportId,
      name,
      external_id: externalId,
      participant_type: "team",
    })
    .select("id")
    .single();

  if (error) throw new Error(`participant insert failed: ${error.message}`);
  return data.id;
}

async function syncEvent(
  db: ReturnType<typeof createAdminClient>,
  providerSport: OddsProviderSport,
  sportId: string,
  competitionId: string,
  event: OddsEvent,
) {
  const homeId = await findOrCreateParticipant(
    db,
    sportId,
    event.home_team,
    `${providerSport.key}:home:${event.home_team}`,
  );
  const awayId = await findOrCreateParticipant(
    db,
    sportId,
    event.away_team,
    `${providerSport.key}:away:${event.away_team}`,
  );

  const startsAt = new Date(event.commence_time);
  const isLive = startsAt.getTime() <= Date.now();
  const eventName = `${event.home_team} vs ${event.away_team}`;

  const { data: existing } = await db
    .schema("sportsbook")
    .from("events")
    .select("id")
    .eq("provider", PROVIDER)
    .eq("provider_event_id", event.id)
    .maybeSingle();

  let eventId = existing?.id as string | undefined;

  const eventPayload = {
    competition_id: competitionId,
    home_participant_id: homeId,
    away_participant_id: awayId,
    name: eventName,
    external_id: event.id,
    starts_at: startsAt.toISOString(),
    status: isLive ? "live" : "scheduled",
    is_live: isLive,
    provider: PROVIDER,
    provider_event_id: event.id,
    updated_at: new Date().toISOString(),
  };

  if (eventId) {
    const { error } = await db
      .schema("sportsbook")
      .from("events")
      .update(eventPayload)
      .eq("id", eventId);
    if (error) throw new Error(`event update failed: ${error.message}`);
  } else {
    const { data, error } = await db
      .schema("sportsbook")
      .from("events")
      .insert(eventPayload)
      .select("id")
      .single();
    if (error) throw new Error(`event insert failed: ${error.message}`);
    eventId = data.id;
  }

  let marketCount = 0;
  let selectionCount = 0;
  let quoteCount = 0;

  for (const bookmaker of event.bookmakers ?? []) {
    for (const providerMarket of bookmaker.markets ?? []) {
      for (const outcome of providerMarket.outcomes ?? []) {
        const point = outcome.point ?? null;
        const marketKey = point == null
          ? providerMarket.key
          : `${providerMarket.key}:${point}`;
        const name = marketName(providerMarket.key, point);

        let marketId: string | undefined;
        const { data: existingMarket } = await db
          .schema("sportsbook")
          .from("markets")
          .select("id")
          .eq("event_id", eventId)
          .eq("market_key", marketKey)
          .maybeSingle();

        if (existingMarket?.id) {
          marketId = existingMarket.id;
        } else {
          const { data, error } = await db
            .schema("sportsbook")
            .from("markets")
            .insert({
              event_id: eventId,
              market_key: marketKey,
              name,
              status: "open",
              line: point,
            })
            .select("id")
            .single();
          if (error) throw new Error(`market insert failed: ${error.message}`);
          marketId = data.id;
          marketCount++;
        }

        const selectionKey = `${outcome.description ?? ""}|${outcome.name}|${point ?? ""}`;
        const selectionDisplayName = selectionName(outcome.name, outcome.description, point);

        let selectionId: string | undefined;
        const { data: existingSelection } = await db
          .schema("sportsbook")
          .from("selections")
          .select("id")
          .eq("market_id", marketId)
          .eq("selection_key", selectionKey)
          .maybeSingle();

        if (existingSelection?.id) {
          selectionId = existingSelection.id;
        } else {
          const { data, error } = await db
            .schema("sportsbook")
            .from("selections")
            .insert({
              market_id: marketId,
              selection_key: selectionKey,
              name: selectionDisplayName,
              status: "open",
            })
            .select("id")
            .single();
          if (error) throw new Error(`selection insert failed: ${error.message}`);
          selectionId = data.id;
          selectionCount++;
        }

        const updatedAt = providerMarket.last_update
          ? new Date(providerMarket.last_update)
          : new Date();
        const expiresAt = new Date(updatedAt.getTime() + 2 * 60 * 1000);

        const { error: quoteError } = await db
          .schema("sportsbook")
          .from("odds_quotes")
          .insert({
            selection_id: selectionId,
            decimal_odds: outcome.price,
            provider: PROVIDER,
            provider_quote_id: `${event.id}:${bookmaker.key}:${providerMarket.key}:${selectionKey}:${updatedAt.toISOString()}`,
            version: 1,
            captured_at: updatedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
          });

        if (quoteError) throw new Error(`odds quote insert failed: ${quoteError.message}`);
        quoteCount++;
      }
    }
  }

  return { eventCount: 1, marketCount, selectionCount, quoteCount };
}

export async function POST(request: NextRequest) {
  const expected = process.env.SPORTS_SYNC_SECRET;
  const provided = request.headers.get("x-sports-sync-secret");

  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = createAdminClient();
    const now = new Date();
    const to = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const providerSports = await listSports();
    const summary = {
      provider: PROVIDER,
      window: { from: now.toISOString(), to: to.toISOString() },
      sports: 0,
      events: 0,
      markets: 0,
      selections: 0,
      quotes: 0,
      errors: [] as string[],
    };

    for (const providerSport of providerSports) {
      if (providerSport.active === false) continue;

      try {
        const sportId = await findOrCreateSport(db, providerSport);
        const competitionId = await findOrCreateCompetition(db, sportId, providerSport);
        const events = await listOdds(providerSport.key, now.toISOString(), to.toISOString());

        summary.sports++;

        for (const event of events) {
          try {
            const counts = await syncEvent(db, providerSport, sportId, competitionId, event);

            await db
              .schema("sportsbook")
              .from("external_events")
              .upsert(
                {
                  provider: PROVIDER,
                  provider_event_id: event.id,
                  sport_key: providerSport.key,
                  event_name: `${event.home_team} vs ${event.away_team}`,
                  starts_at: event.commence_time,
                  raw: event,
                  synced_at: new Date().toISOString(),
                },
                { onConflict: "provider,provider_event_id" },
              );

            summary.events += counts.eventCount;
            summary.markets += counts.marketCount;
            summary.selections += counts.selectionCount;
            summary.quotes += counts.quoteCount;
          } catch (eventError) {
            summary.errors.push(
              `${providerSport.key}/${event.id}: ${eventError instanceof Error ? eventError.message : "unknown event error"}`,
            );
          }
        }
      } catch (sportError) {
        summary.errors.push(
          `${providerSport.key}: ${sportError instanceof Error ? sportError.message : "unknown sport error"}`,
        );
      }
    }

    return NextResponse.json(summary, { status: summary.errors.length ? 207 : 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Provider sync failed" },
      { status: 500 },
    );
  }
}
