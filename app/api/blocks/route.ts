import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "clients");

interface Block {
  id: string;
  name: string;
  type: string;
  description: string;
  html: string;
}

function blocksPath(clientId: string) {
  return path.join(DATA_DIR, clientId, "blocks.json");
}

function readBlocks(clientId: string): Block[] {
  const p = blocksPath(clientId);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : [];
}

function writeBlocks(clientId: string, blocks: Block[]) {
  fs.writeFileSync(blocksPath(clientId), JSON.stringify(blocks, null, 2));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
  return NextResponse.json(readBlocks(clientId));
}

export async function POST(req: Request) {
  const { clientId, block } = await req.json();
  if (!clientId || !block) return NextResponse.json({ error: "Missing data" }, { status: 400 });
  const blocks = readBlocks(clientId);
  const newBlock: Block = { ...block, id: block.id || `block-${Date.now()}` };
  blocks.push(newBlock);
  writeBlocks(clientId, blocks);
  return NextResponse.json(newBlock);
}

export async function PUT(req: Request) {
  const { clientId, block } = await req.json();
  if (!clientId || !block?.id) return NextResponse.json({ error: "Missing data" }, { status: 400 });
  const blocks = readBlocks(clientId);
  const idx = blocks.findIndex((b) => b.id === block.id);
  if (idx === -1) return NextResponse.json({ error: "Block not found" }, { status: 404 });
  blocks[idx] = block;
  writeBlocks(clientId, blocks);
  return NextResponse.json(block);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const blockId = searchParams.get("blockId");
  if (!clientId || !blockId) return NextResponse.json({ error: "Missing params" }, { status: 400 });
  const blocks = readBlocks(clientId);
  writeBlocks(clientId, blocks.filter((b) => b.id !== blockId));
  return NextResponse.json({ ok: true });
}
