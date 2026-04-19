import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "data", "newsletters");

interface Newsletter {
  id: string;
  name: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  blocks: unknown[];
}

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function readAll(): Newsletter[] {
  ensureDir();
  return fs.readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf-8")));
}

function readOne(id: string): Newsletter | null {
  const p = path.join(DIR, `${id}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : null;
}

function write(nl: Newsletter) {
  ensureDir();
  fs.writeFileSync(path.join(DIR, `${nl.id}.json`), JSON.stringify(nl, null, 2));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const clientId = searchParams.get("clientId");

  if (id) {
    const nl = readOne(id);
    if (!nl) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(nl);
  }

  const all = readAll();
  return NextResponse.json(clientId ? all.filter((n) => n.clientId === clientId) : all);
}

export async function POST(req: Request) {
  const body = await req.json();
  const id = body.id || `nl-${Date.now()}`;
  const now = new Date().toISOString();
  const nl: Newsletter = {
    id,
    name: body.name || "Nový newsletter",
    clientId: body.clientId,
    createdAt: now,
    updatedAt: now,
    blocks: body.blocks ?? [],
  };
  write(nl);
  return NextResponse.json(nl);
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const existing = readOne(body.id);
  const nl: Newsletter = {
    ...(existing ?? {}),
    ...body,
    updatedAt: new Date().toISOString(),
  };
  write(nl);
  return NextResponse.json(nl);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const p = path.join(DIR, `${id}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  return NextResponse.json({ ok: true });
}
