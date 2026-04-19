import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
    return NextResponse.json({ error: "Supabase není nakonfigurován — chybí env proměnné" }, { status: 500 });
  }
  const { data, error } = await supabase.from("clients").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { id, name, color } = await req.json();
  const { data, error } = await supabase.from("clients").insert({ id, name, color }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
