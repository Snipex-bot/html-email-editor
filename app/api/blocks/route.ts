import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });

  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("client_id", clientId)
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { clientId, block } = await req.json();
  const { data, error } = await supabase
    .from("blocks")
    .insert({ ...block, id: block.id || `block-${Date.now()}`, client_id: clientId })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { clientId, block } = await req.json();
  const { data, error } = await supabase
    .from("blocks")
    .update({ name: block.name, type: block.type, description: block.description, html: block.html })
    .eq("id", block.id)
    .eq("client_id", clientId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const blockId = searchParams.get("blockId");
  if (!clientId || !blockId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("id", blockId)
    .eq("client_id", clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
