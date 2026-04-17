import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "clients");

function blocksPath(clientId: string) {
  return path.join(DATA_DIR, clientId, "blocks.json");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
  const p = blocksPath(clientId);
  if (!fs.existsSync(p)) return NextResponse.json([]);
  return NextResponse.json(JSON.parse(fs.readFileSync(p, "utf-8")));
}

export async function POST(req: Request) {
  const { clientId, block } = await req.json();
  const p = blocksPath(clientId);
  const blocks = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : [];
  const newBlock = { ...block, id: block.id || `block-${Date.now()}` };
  blocks.push(newBlock);
  fs.writeFileSync(p, JSON.stringify(blocks, null, 2));
  return NextResponse.json(newBlock);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const blockId = searchParams.get("blockId");
  if (!clientId || !blockId) return NextResponse.json({ error: "Missing params" }, { status: 400 });
  const p = blocksPath(clientId);
  const blocks: { id: string }[] = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : [];
  fs.writeFileSync(p, JSON.stringify(blocks.filter((b) => b.id !== blockId), null, 2));
  return NextResponse.json({ ok: true });
}
