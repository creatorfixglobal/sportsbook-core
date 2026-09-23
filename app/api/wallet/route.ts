import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET() {
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({authenticated:false,balance_minor:0});
 await supabase.schema("sportsbook").rpc("ensure_wallet",{p_user_id:user.id});
 const {data,error}=await supabase.schema("sportsbook").from("wallets").select("balance_minor,updated_at").eq("user_id",user.id).single();
 if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({authenticated:true,balance_minor:data.balance_minor,updated_at:data.updated_at});
}