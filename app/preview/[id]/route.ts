export const dynamic = "force-dynamic";

import { unstable_noStore as noStore } from "next/cache";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { buildEmailHtml } from "@/lib/buildEmail";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  noStore();
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return new NextResponse("<h1>Newsletter nenalezen</h1>", {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const html = buildEmailHtml(
    (data.name as string) ?? "Náhled",
    Array.isArray(data.blocks) ? data.blocks : []
  );

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
