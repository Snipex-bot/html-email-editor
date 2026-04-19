export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BASE64_RE = /src="(data:image\/([^;]+);base64,([^"]+))"/g;

async function uploadBase64(base64Data: string, mimeType: string): Promise<string> {
  const binary = Buffer.from(base64Data, "base64");
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from("images").upload(path, binary, {
    contentType: `image/${mimeType}`,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(req: Request) {
  const { clientId } = await req.json() as { clientId?: string };

  const query = supabase.from("blocks").select("*");
  const { data: blocks, error } = clientId
    ? await query.eq("client_id", clientId)
    : await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let totalReplaced = 0;
  const results: { blockId: string; replaced: number }[] = [];

  for (const block of blocks ?? []) {
    const html: string = block.html ?? "";
    let replaced = 0;
    const urlCache = new Map<string, string>();

    let newHtml = html;
    const re = new RegExp(BASE64_RE.source, "g");
    let match: RegExpExecArray | null;

    while ((match = re.exec(html)) !== null) {
      const [fullMatch, , mimeType, base64Data] = match;
      try {
        let url = urlCache.get(base64Data.slice(0, 32));
        if (!url) {
          url = await uploadBase64(base64Data, mimeType);
          urlCache.set(base64Data.slice(0, 32), url);
        }
        newHtml = newHtml.replace(fullMatch, `src="${url}"`);
        replaced++;
      } catch {
        // skip this image, keep original
      }
    }

    if (replaced > 0) {
      await supabase.from("blocks").update({ html: newHtml }).eq("id", block.id);
      results.push({ blockId: block.id, replaced });
      totalReplaced += replaced;
    }
  }

  return NextResponse.json({ ok: true, totalReplaced, blocks: results });
}
