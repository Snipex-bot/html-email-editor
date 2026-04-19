import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BLOCKS = [
  {
    id: "acme-banner-hero",
    client_id: "acme-store",
    name: "Banner s obrázkem",
    type: "hero",
    description: "Velký banner s foto, nadpisem a CTA tlačítkem",
    html: `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:0 20px;"><table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;"><tr><td style="padding:0;"><img src="{{banner_image}}" alt="Banner" width="600" style="display:block;width:100%;max-width:600px;height:280px;object-fit:cover;" /></td></tr><tr><td style="background:#1e1b4b;padding:36px 40px;text-align:center;"><h2 style="color:#ffffff;font-family:Arial,sans-serif;font-size:28px;font-weight:bold;margin:0 0 12px;">{{banner_title}}</h2><p style="color:#c7d2fe;font-family:Arial,sans-serif;font-size:16px;margin:0 0 28px;line-height:1.6;">{{banner_subtitle}}</p><a href="{{banner_cta_url}}" style="display:inline-block;background:#6366f1;color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;padding:14px 36px;border-radius:8px;text-decoration:none;">{{banner_cta_text}}</a></td></tr></table></td></tr></table>`,
  },
  {
    id: "acme-product-card",
    client_id: "acme-store",
    name: "Karta produktu",
    type: "products",
    description: "Produkt s fotkou, názvem, cenou a tlačítkem",
    html: `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:10px 20px;"><table width="280" cellpadding="0" cellspacing="0" border="0" style="max-width:280px;width:100%;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;background:#ffffff;"><tr><td style="padding:0;"><img src="{{product_image}}" alt="produkt" width="280" style="display:block;width:100%;height:200px;object-fit:cover;" /></td></tr><tr><td style="padding:20px 20px 24px;"><p style="font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#111827;margin:0 0 6px;">{{product_name}}</p><p style="font-family:Arial,sans-serif;font-size:13px;color:#6b7280;margin:0 0 12px;line-height:1.5;">{{product_description}}</p><p style="font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#6366f1;margin:0 0 16px;">{{product_price}}</p><a href="{{product_url}}" style="display:inline-block;background:#6366f1;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:10px 24px;border-radius:6px;text-decoration:none;">Koupit nyní</a></td></tr></table></td></tr></table>`,
  },
  {
    id: "nova-banner-hero",
    client_id: "nova-gym",
    name: "Banner s obrázkem",
    type: "hero",
    description: "Velký banner s foto, nadpisem a CTA tlačítkem",
    html: `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:0 20px;"><table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;"><tr><td style="padding:0;"><img src="{{banner_image}}" alt="Banner" width="600" style="display:block;width:100%;max-width:600px;height:280px;object-fit:cover;" /></td></tr><tr><td style="background:#052e16;padding:36px 40px;text-align:center;"><h2 style="color:#ffffff;font-family:Arial,sans-serif;font-size:28px;font-weight:bold;margin:0 0 12px;">{{banner_title}}</h2><p style="color:#bbf7d0;font-family:Arial,sans-serif;font-size:16px;margin:0 0 28px;line-height:1.6;">{{banner_subtitle}}</p><a href="{{banner_cta_url}}" style="display:inline-block;background:#16a34a;color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;padding:14px 36px;border-radius:8px;text-decoration:none;">{{banner_cta_text}}</a></td></tr></table></td></tr></table>`,
  },
  {
    id: "nova-course-card",
    client_id: "nova-gym",
    name: "Karta kurzu",
    type: "products",
    description: "Kurz s fotkou, názvem, cenou a přihlášením",
    html: `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:10px 20px;"><table width="280" cellpadding="0" cellspacing="0" border="0" style="max-width:280px;width:100%;border-radius:10px;overflow:hidden;border:1px solid #d1fae5;background:#f0fdf4;"><tr><td style="padding:0;"><img src="{{product_image}}" alt="kurz" width="280" style="display:block;width:100%;height:200px;object-fit:cover;" /></td></tr><tr><td style="padding:20px 20px 24px;"><p style="font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#14532d;margin:0 0 6px;">{{product_name}}</p><p style="font-family:Arial,sans-serif;font-size:13px;color:#4b7a5a;margin:0 0 12px;line-height:1.5;">{{product_description}}</p><p style="font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#16a34a;margin:0 0 16px;">{{product_price}}</p><a href="{{product_url}}" style="display:inline-block;background:#16a34a;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:10px 24px;border-radius:6px;text-decoration:none;">Přihlásit se</a></td></tr></table></td></tr></table>`,
  },
];

export const dynamic = "force-dynamic";

export async function GET() {
  const results = [];
  for (const block of BLOCKS) {
    const { error } = await supabase.from("blocks").upsert(block, { onConflict: "id,client_id" });
    results.push({ id: block.id, ok: !error, error: error?.message });
  }
  return NextResponse.json(results);
}
