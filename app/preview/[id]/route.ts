export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface ActiveBlock {
  instanceId: string;
  rawTemplate: string;
  variables: Record<string, string>;
}

function buildHtml(blocks: ActiveBlock[]): string {
  return blocks
    .map((b) => {
      let html = b.rawTemplate;
      for (const [k, v] of Object.entries(b.variables)) {
        html = html.replaceAll(`{{${k}}}`, v);
      }
      return html;
    })
    .join("\n");
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
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

  const blocks: ActiveBlock[] = Array.isArray(data.blocks) ? data.blocks : [];
  const body = buildHtml(blocks);

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${(data.name as string) ?? "Náhled"}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f4; font-family: Arial, sans-serif; }
  </style>
</head>
<body>
${body}
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}
