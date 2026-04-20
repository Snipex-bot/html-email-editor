export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import JSZip from "jszip";
import { supabase } from "@/lib/supabase";
import { buildEmailHtml } from "@/lib/buildEmail";

interface ActiveBlock {
  instanceId: string;
  rawTemplate: string;
  variables: Record<string, string>;
}

function extractImageUrls(html: string): string[] {
  const re = /src="(https?:\/\/[^"]+)"/g;
  const urls: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (!urls.includes(m[1])) urls.push(m[1]);
  }
  return urls;
}

function urlToFilename(url: string, index: number): string {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split("/").pop() ?? `image-${index}`;
    // ensure it has an extension
    return /\.\w{2,5}$/.test(base) ? base : `${base}.jpg`;
  } catch {
    return `image-${index}.jpg`;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocks: ActiveBlock[] = Array.isArray(data.blocks) ? data.blocks : [];
  let html = buildEmailHtml((data.name as string) ?? "newsletter", blocks);

  // collect all external image URLs
  const imageUrls = extractImageUrls(html);
  const zip = new JSZip();
  const imgFolder = zip.folder("images")!;

  // download each image and rewrite src in HTML
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const filename = urlToFilename(url, i + 1);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        imgFolder.file(filename, buffer);
        // replace all occurrences of this URL in HTML
        html = html.split(`src="${url}"`).join(`src="images/${filename}"`);
      }
    } catch {
      // skip unreachable images, keep original URL
    }
  }

  zip.file("index.html", html);

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const slug = (data.name as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "newsletter";

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}.zip"`,
    },
  });
}
