import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(req:Request) {
 try {
  const body=await req.json();
  const selectionId=String(body.selectionId||"");
  const stake=Number(body.stakeMinor||0);
  const key=String(body.idempotencyKey||"");
  if(!selectionId||!Number.isSafeInteger(stake)||stake<=0||key.length<8)return NextResponse.json({error:"Invalid bet request"},{status:400});
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Authentication required"},{status:401});
  const {data,error}=await supabase.schema("sportsbook").rpc("place_bet",{p_user_id:user.id,p_selection_id:selectionId,p_stake_minor:stake,p_idempotency_key:key});
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({bet_id:data});
 } catch { return NextResponse.json({error:"Invalid JSON"},{status:400}); }
}