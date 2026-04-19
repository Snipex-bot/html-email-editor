import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BASE64_RE = /src="(data:image\/([^;]+);base64,([^"]+))"/g;

async function replaceBase64Images(html: string): Promise<string> {
  const matches = [...html.matchAll(BASE64_RE)];
  if (matches.length === 0) return html;

  let result = html;
  for (const [fullMatch, , mimeType, base64Data] of matches) {
    try {
      const binary = Buffer.from(base64Data, "base64");
      const ext = mimeType.replace("jpeg", "jpg");
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("images").upload(path, binary, {
        contentType: `image/${mimeType}`,
        upsert: false,
      });
      if (error) continue;
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      result = result.replace(fullMatch, `src="${data.publicUrl}"`);
    } catch {
      // keep original if upload fails
    }
  }
  return result;
}

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
  const html = await replaceBase64Images(block.html ?? "");
  const { data, error } = await supabase
    .from("blocks")
    .insert({ ...block, html, id: block.id || `block-${Date.now()}`, client_id: clientId })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { clientId, block } = await req.json();
  const html = await replaceBase64Images(block.html ?? "");
  const { data, error } = await supabase
    .from("blocks")
    .update({ name: block.name, type: block.type, description: block.description, html })
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
