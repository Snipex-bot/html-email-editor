export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });

  const { data, error } = await supabase.storage
    .from("images")
    .list(`uploads/${clientId}`, { limit: 200, sortBy: { column: "created_at", order: "desc" } });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const files = (data ?? [])
    .filter(f => f.name !== ".emptyFolderPlaceholder")
    .map(f => ({
      name: f.name,
      size: f.metadata?.size ?? 0,
      created_at: f.created_at,
      url: supabase.storage.from("images").getPublicUrl(`uploads/${clientId}/${f.name}`).data.publicUrl,
    }));

  return NextResponse.json(files);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const name = searchParams.get("name");
  if (!clientId || !name) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { error } = await supabase.storage
    .from("images")
    .remove([`uploads/${clientId}/${name}`]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
