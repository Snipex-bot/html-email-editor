import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

function randomHex(len = 13) {
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, len);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const clientId = form.get("clientId") as string | null;
  if (!file) return NextResponse.json({ error: "Chybí soubor" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const originalName = file.name.replace(/[^a-z0-9._-]/gi, "_");

  // path pattern: {clientId}/{clientId}-{hash}.{ext}  (or uploads/{hash}.{ext} without client)
  const hash = randomHex(13);
  const folder = clientId ?? "uploads";
  const filename = clientId ? `${clientId}-${hash}.${ext}` : `${hash}.${ext}`;
  const path = `${folder}/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const size = buffer.byteLength;

  const { error: uploadError } = await supabase.storage.from("images").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
  const url = urlData.publicUrl;

  // store record in DB (only when clientId provided)
  if (clientId) {
    await supabase.from("images").insert({
      client_id: clientId,
      name: originalName,
      path,
      url,
      size,
    });
  }

  return NextResponse.json({ url, path });
}
