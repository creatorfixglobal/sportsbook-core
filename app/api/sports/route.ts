import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET() {
 const supabase=await createClient();
 const {data,error}=await supabase.schema("sportsbook").from("sports").select("id,name,slug,status").eq("status","active").order("name");
 if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({sports:data??[]});
}