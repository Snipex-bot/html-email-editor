import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const clientId = searchParams.get("clientId");

  if (id) {
    const { data, error } = await supabase.from("newsletters").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(toApi(data));
  }

  const query = supabase.from("newsletters").select("*").order("updated_at", { ascending: false });
  const { data, error } = clientId ? await query.eq("client_id", clientId) : await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as Record<string, unknown>[]).map(toApi));
}

export async function POST(req: Request) {
  const body = await req.json();
  const row = {
    id: body.id || `nl-${Date.now()}`,
    name: body.name || "Nový newsletter",
    client_id: body.clientId,
    blocks: body.blocks ?? [],
  };
  const { data, error } = await supabase.from("newsletters").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toApi(data));
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabase
    .from("newsletters")
    .update({
      name: body.name,
      blocks: body.blocks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(toApi(data));
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await supabase.from("newsletters").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// map snake_case DB columns → camelCase API response
function toApi(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id,
    blocks: row.blocks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
