import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface Block { rawTemplate: string; variables: Record<string, string>; }

function fill(template: string, vars: Record<string, string>): string {
  let r = template;
  for (const [k, v] of Object.entries(vars ?? {})) {
    r = r.split(`{{${k}}}`).join(v || `{{${k}}}`);
  }
  return r;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from("newsletters").select("*").eq("id", params.id).single();

  if (error || !data) return new Response("Newsletter nenalezen", { status: 404 });

  const blocks: Block[] = data.blocks ?? [];
  const body = blocks.map(b => fill(b.rawTemplate, b.variables)).join("\n\n");

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.name}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f5f7; font-family: Arial, Helvetica, sans-serif; }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
    img { border: 0; display: block; max-width: 100%; height: auto; }
    a { text-decoration: none; }
    @media only screen and (max-width: 600px) {
      table[width] { width: 100% !important; min-width: unset !important; }
      img { max-width: 100% !important; width: 100% !important; height: auto !important; }
      h1, h2, h3 { font-size: 20px !important; }
    }
  </style>
</head>
<body>${body}</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
