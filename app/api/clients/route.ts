import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "clients");

export async function GET() {
  const dirs = fs.readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const metaPath = path.join(DATA_DIR, d.name, "meta.json");
      const meta = fs.existsSync(metaPath)
        ? JSON.parse(fs.readFileSync(metaPath, "utf-8"))
        : { id: d.name, name: d.name, color: "#6b7280" };
      return meta;
    });
  return NextResponse.json(dirs);
}

export async function POST(req: Request) {
  const { id, name, color } = await req.json();
  const clientDir = path.join(DATA_DIR, id);
  if (fs.existsSync(clientDir)) {
    return NextResponse.json({ error: "Client already exists" }, { status: 409 });
  }
  fs.mkdirSync(clientDir, { recursive: true });
  fs.writeFileSync(path.join(clientDir, "meta.json"), JSON.stringify({ id, name, color }, null, 2));
  fs.writeFileSync(path.join(clientDir, "blocks.json"), "[]");
  return NextResponse.json({ id, name, color });
}
