export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { load } from "cheerio";
import { supabase } from "@/lib/supabase";

interface ScrapingField {
  key: string;
  selector: string;
  attr: string; // "text" | "src" | "href" | "content" | ...
}

interface ScrapingConfig {
  fields?: ScrapingField[];
}

export async function POST(req: Request) {
  const { url, clientId } = await req.json() as { url: string; clientId?: string };

  if (!url) return NextResponse.json({ error: "Chybí URL" }, { status: 400 });

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 });
    html = await res.text();
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  const $ = load(html);
  const result: Record<string, string> = {};

  // ── 1. JSON-LD schema.org/Product ──────────────────────────────
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() ?? "";
      const data = JSON.parse(raw);
      const candidates = Array.isArray(data) ? data : [data, ...(data["@graph"] ?? [])];
      const product = candidates.find(
        (d: Record<string, unknown>) => d["@type"] === "Product"
      );
      if (!product) return;

      if (!result.name && product.name) result.name = String(product.name);
      if (!result.description && product.description)
        result.description = String(product.description);

      const img = product.image;
      if (!result.image && img) {
        if (typeof img === "string") result.image = img;
        else if (Array.isArray(img)) result.image = String(img[0]);
        else if (typeof img === "object" && (img as Record<string, unknown>).url)
          result.image = String((img as Record<string, unknown>).url);
      }

      const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
      if (!result.price && offers?.price) {
        const currency = offers.priceCurrency ? ` ${offers.priceCurrency}` : "";
        result.price = `${offers.price}${currency}`;
      }
    } catch {
      // malformed JSON-LD — skip
    }
  });

  // ── 2. OpenGraph / meta fallback ───────────────────────────────
  if (!result.name)
    result.name = $('meta[property="og:title"]').attr("content") ?? $("title").text().trim() ?? "";
  if (!result.image)
    result.image = $('meta[property="og:image"]').attr("content") ?? "";
  if (!result.description)
    result.description =
      $('meta[property="og:description"]').attr("content") ??
      $('meta[name="description"]').attr("content") ??
      "";
  if (!result.price)
    result.price = $('meta[property="product:price:amount"]').attr("content") ?? "";

  // ── 3. Client CSS selectors (highest priority — override above) ─
  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("scraping_config")
      .eq("id", clientId)
      .single();

    const config = client?.scraping_config as ScrapingConfig | null;
    if (config?.fields) {
      for (const field of config.fields) {
        if (!field.selector?.trim()) continue;
        const el = $(field.selector).first();
        if (!el.length) continue;
        const val =
          field.attr === "text"
            ? el.text().trim()
            : el.attr(field.attr)?.trim() ?? "";
        if (val) result[field.key] = val;
      }
    }
  }

  // always include the scraped URL
  result.url = url;

  // strip empty fields
  for (const k of Object.keys(result)) {
    if (!result[k]) delete result[k];
  }

  return NextResponse.json(result);
}
