"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Download, Copy, Check, RefreshCw, Code2, Eye,
  Mail, Minus, Plus, Save, Loader2, ChevronRight,
  Home, Pencil, X,
} from "lucide-react";
import BlockPalette from "./BlockPalette";
import ActiveBlocksList from "./ActiveBlocksList";
import VariableDialog from "./VariableDialog";
import type { LibraryBlock, ActiveBlock } from "./types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500 text-sm">
      Načítám editor…
    </div>
  ),
});

type ViewMode = "split" | "code" | "preview";

// ── helpers ─────────────────────────────────────────────────────

function extractVariables(html: string): Record<string, string> {
  const matches = html.match(/\{\{([^}]+)\}\}/g) ?? [];
  return Object.fromEntries(
    Array.from(new Set(matches.map((m) => m.slice(2, -2).trim()))).map((k) => [k, ""])
  );
}

function fillTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(`{{${key}}}`).join(value || `{{${key}}}`);
  }
  return result;
}

function buildHtml(blocks: ActiveBlock[]): string {
  const body = blocks.map((b) => fillTemplate(b.rawTemplate, b.variables)).join("\n\n");
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f5f7; font-family: Arial, Helvetica, sans-serif; }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
    img { border: 0; outline: none; display: block; }
    a { text-decoration: none; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

const EMPTY_HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:40px 20px;background:#f4f5f7;font-family:Arial,sans-serif;color:#999;font-size:14px;text-align:center;">Přidej bloky z horní lišty</body></html>`;

const DRAFT_KEY = (id: string) => `nl-draft-${id}`;

// ── component ────────────────────────────────────────────────────

interface Props {
  newsletterId: string;
}

export default function NewsletterEditor({ newsletterId }: Props) {
  const [activeBlocks, setActiveBlocks] = useState<ActiveBlock[]>([]);
  const [newsletterName, setNewsletterName] = useState("Načítám…");
  const [clientId, setClientId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [previewWidth, setPreviewWidth] = useState(600);
  const [previewContainerW, setPreviewContainerW] = useState(0);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [pendingBlock, setPendingBlock] = useState<LibraryBlock | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [loading, setLoading] = useState(true);

  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const html = activeBlocks.length > 0 ? buildHtml(activeBlocks) : EMPTY_HTML;

  // ── load newsletter ──────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/newsletters?id=${newsletterId}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setNewsletterName(data.name);
      setClientId(data.clientId);

      // Check for a newer localStorage draft
      try {
        const draft = localStorage.getItem(DRAFT_KEY(newsletterId));
        if (draft) {
          const parsed = JSON.parse(draft);
          const draftTime = new Date(parsed.savedAt).getTime();
          const serverTime = new Date(data.updatedAt).getTime();
          if (draftTime > serverTime) {
            setActiveBlocks(parsed.blocks);
            setHasDraft(true);
            setLoading(false);
            return;
          }
        }
      } catch {}

      setActiveBlocks(data.blocks ?? []);
      setLoading(false);
    })();
  }, [newsletterId]);

  // ── auto-save draft to localStorage ─────────────────────────

  useEffect(() => {
    if (loading) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY(newsletterId), JSON.stringify({
          blocks: activeBlocks,
          savedAt: new Date().toISOString(),
        }));
        setHasDraft(true);
      } catch {}
    }, 600);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [activeBlocks, newsletterId, loading]);

  // ── save to server ───────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true);
    await fetch("/api/newsletters", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: newsletterId, name: newsletterName, blocks: activeBlocks }),
    });
    localStorage.removeItem(DRAFT_KEY(newsletterId));
    setHasDraft(false);
    setSavedAt(new Date());
    setSaving(false);
  }, [newsletterId, newsletterName, activeBlocks]);

  // ── name edit ────────────────────────────────────────────────

  const startNameEdit = () => { setTempName(newsletterName); setEditingName(true); };
  const confirmNameEdit = () => { if (tempName.trim()) setNewsletterName(tempName.trim()); setEditingName(false); };

  // ── blocks ───────────────────────────────────────────────────

  const handleAddBlock = useCallback((block: LibraryBlock) => { setPendingBlock(block); }, []);

  const handleVariableConfirm = useCallback((filledHtml: string) => {
    if (!pendingBlock) return;
    const variables = extractVariables(pendingBlock.html);
    const filledVars: Record<string, string> = {};
    for (const key of Object.keys(variables)) {
      const parts = pendingBlock.html.split(`{{${key}}}`);
      if (parts.length >= 2) {
        const before = parts[0];
        const after = parts[1];
        const start = filledHtml.indexOf(before) + before.length;
        const endSearch = after.split("{{")[0];
        const end = endSearch ? filledHtml.indexOf(endSearch, start) : filledHtml.length;
        filledVars[key] = end > start ? filledHtml.slice(start, end) : "";
      } else {
        filledVars[key] = "";
      }
    }
    setActiveBlocks((prev) => [...prev, {
      instanceId: `${pendingBlock.id}-${Date.now()}`,
      blockId: pendingBlock.id,
      name: pendingBlock.name,
      type: pendingBlock.type,
      rawTemplate: pendingBlock.html,
      variables: filledVars,
    }]);
    setPendingBlock(null);
  }, [pendingBlock]);

  const handleUpdateBlock = useCallback((instanceId: string, variables: Record<string, string>) => {
    setActiveBlocks((prev) => prev.map((b) => b.instanceId === instanceId ? { ...b, variables } : b));
  }, []);

  const handleDeleteBlock = useCallback((instanceId: string) => {
    setActiveBlocks((prev) => prev.filter((b) => b.instanceId !== instanceId));
  }, []);

  const handleReorder = useCallback((from: number, to: number) => {
    setActiveBlocks((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  }, []);

  // ── drag from palette ────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/block")) {
      e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setIsDragOver(true);
    }
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const raw = e.dataTransfer.getData("application/block");
    if (raw) try { setPendingBlock(JSON.parse(raw)); } catch {}
  }, []);

  // ── resizer ──────────────────────────────────────────────────

  const onResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); isDragging.current = true;
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const mm = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSplitPct(Math.min(80, Math.max(20, ((e.clientX - rect.left) / rect.width) * 100)));
    };
    const mu = () => {
      if (isDragging.current) { isDragging.current = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; }
    };
    window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu);
    return () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
  }, []);

  // ── preview container ResizeObserver ─────────────────────────
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setPreviewContainerW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── toolbar ──────────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${newsletterName.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
  }, [html, newsletterName]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [html]);

  if (loading) {
    return (
      <div className="editor-root flex items-center justify-center bg-gray-950 text-gray-600">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="editor-root flex flex-col bg-gray-950">

      {/* ── TOOLBAR ─────────────────────────────────── */}
      <header className="flex items-center gap-2 px-4 h-12 border-b border-gray-800 bg-gray-900 flex-shrink-0">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs flex-shrink-0">
          <Link href="/" className="text-gray-600 hover:text-white transition-colors flex items-center gap-1">
            <Home size={11} /> <span className="hidden sm:inline">Domů</span>
          </Link>
          <ChevronRight size={10} className="text-gray-700" />
          <Link href="/editor" className="text-gray-500 hover:text-white transition-colors flex items-center gap-1">
            <Mail size={11} /> <span className="hidden sm:inline">Editor</span>
          </Link>
          <ChevronRight size={10} className="text-gray-700" />
          {/* Editable name */}
          {editingName ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") confirmNameEdit(); if (e.key === "Escape") setEditingName(false); }}
                onBlur={confirmNameEdit}
                className="bg-gray-800 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-48"
              />
              <button onClick={confirmNameEdit} className="text-green-400 hover:text-green-300"><Check size={11} /></button>
              <button onClick={() => setEditingName(false)} className="text-gray-600 hover:text-white"><X size={11} /></button>
            </div>
          ) : (
            <button onClick={startNameEdit} className="flex items-center gap-1 text-white hover:text-indigo-300 transition-colors group max-w-[180px]">
              <span className="truncate font-medium">{newsletterName}</span>
              <Pencil size={10} className="text-gray-600 group-hover:text-indigo-400 flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Draft indicator */}
        {hasDraft && !saving && (
          <span className="text-[10px] text-amber-500 bg-amber-900/30 border border-amber-700/40 px-2 py-0.5 rounded-full flex-shrink-0">
            Neuložené změny
          </span>
        )}
        {savedAt && !hasDraft && (
          <span className="text-[10px] text-green-500 bg-green-900/20 border border-green-700/30 px-2 py-0.5 rounded-full flex-shrink-0">
            Uloženo
          </span>
        )}

        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg p-1 ml-2">
          {(["code", "split", "preview"] as ViewMode[]).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === mode ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              {mode === "code" && <Code2 size={11} />}
              {mode === "split" && <span className="flex gap-0.5"><span className="w-1 h-3 bg-current rounded-sm" /><span className="w-1 h-3 bg-current rounded-sm" /></span>}
              {mode === "preview" && <Eye size={11} />}
              <span className="hidden lg:inline">{mode === "code" ? "Kód" : mode === "split" ? "Split" : "Náhled"}</span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <button onClick={handleCopy} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
          {copied ? <><Check size={11} className="text-green-400" /><span className="hidden md:inline text-green-400">Zkopírováno</span></> : <><Copy size={11} /><span className="hidden md:inline">Kopírovat</span></>}
        </button>
        <button onClick={handleDownload} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
          <Download size={11} />
          <span className="hidden md:inline">Stáhnout</span>
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white transition-all shadow"
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
          Uložit
        </button>
      </header>

      {/* ── BLOCK PALETTE ───────────────────────────── */}
      <BlockPalette onAddBlock={handleAddBlock} initialClientId={clientId ?? undefined} />

      {/* ── MAIN ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <ActiveBlocksList
          blocks={activeBlocks}
          onChange={handleUpdateBlock}
          onDelete={handleDeleteBlock}
          onReorder={handleReorder}
        />

        <div
          ref={containerRef}
          className="flex flex-1 overflow-hidden relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragOver && (
            <div className="absolute inset-0 z-20 bg-indigo-600/10 border-2 border-indigo-500 border-dashed pointer-events-none flex items-center justify-center">
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">Pustit pro přidání bloku</div>
            </div>
          )}

          {/* Code panel */}
          {(viewMode === "split" || viewMode === "code") && (
            <div className="flex flex-col overflow-hidden" style={{ width: viewMode === "split" ? `${splitPct}%` : "100%" }}>
              <div className="flex items-center justify-between px-4 h-8 bg-gray-900 border-b border-gray-800 flex-shrink-0">
                <span className="text-xs text-gray-500 font-mono">výstupní HTML</span>
                <span className="text-xs text-gray-600">{html.split("\n").length} řádků</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <MonacoEditor
                  height="100%"
                  defaultLanguage="html"
                  value={html}
                  theme="vs-dark"
                  options={{
                    readOnly: true, fontSize: 12,
                    fontFamily: "'Fira Code','JetBrains Mono',monospace",
                    minimap: { enabled: false }, wordWrap: "on",
                    scrollBeyondLastLine: false, padding: { top: 12, bottom: 12 },
                    renderLineHighlight: "gutter",
                  }}
                />
              </div>
            </div>
          )}

          {viewMode === "split" && (
            <div onMouseDown={onResizerMouseDown} className="w-1 bg-gray-800 hover:bg-indigo-500 transition-colors flex-shrink-0 cursor-col-resize" />
          )}

          {/* Preview panel */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div className="flex flex-col overflow-hidden bg-gray-200" style={{ width: viewMode === "split" ? `${100 - splitPct}%` : "100%" }}>
              {/* Preview toolbar */}
              <div className="flex items-center gap-2 px-3 h-8 bg-gray-900 border-b border-gray-800 flex-shrink-0">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 opacity-60" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500 opacity-60" />
                  <span className="w-2 h-2 rounded-full bg-green-500 opacity-60" />
                </div>
                <div className="flex items-center gap-1 ml-1">
                  <button onClick={() => setPreviewWidth(w => Math.max(320, w - 20))} className="text-gray-600 hover:text-white transition-colors"><Minus size={10} /></button>
                  <input
                    type="number"
                    value={previewWidth}
                    onChange={(e) => setPreviewWidth(Math.max(320, Math.min(1200, Number(e.target.value))))}
                    className="w-14 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-white text-center focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-gray-600">px</span>
                  <button onClick={() => setPreviewWidth(w => Math.min(1200, w + 20))} className="text-gray-600 hover:text-white transition-colors"><Plus size={10} /></button>
                </div>
                <div className="flex items-center gap-1 ml-1">
                  {[375, 600, 800].map(w => (
                    <button key={w} onClick={() => setPreviewWidth(w)}
                      className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${previewWidth === w ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-white"}`}
                    >{w}</button>
                  ))}
                </div>
              </div>
              {(() => {
                const pad = 32;
                const scale = previewContainerW > 0 && previewWidth > previewContainerW - pad
                  ? (previewContainerW - pad) / previewWidth
                  : 1;
                const iframeH = 800;
                const scaledH = Math.round(iframeH * scale);
                return (
                  <div ref={previewContainerRef} className="flex-1 overflow-hidden flex justify-center pt-4 pb-4 bg-gray-200">
                    <div style={{ width: previewWidth * scale, height: scaledH, flexShrink: 0 }}>
                      <div style={{ width: previewWidth, transformOrigin: "top left", transform: `scale(${scale})` }}>
                        <iframe srcDoc={html} title="Preview" sandbox="allow-same-origin"
                          style={{ width: "100%", height: iframeH, display: "block", border: 0 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── STATUS BAR ──────────────────────────────── */}
      <footer className="flex items-center justify-between px-4 h-6 bg-indigo-700 flex-shrink-0">
        <span className="text-xs text-indigo-200 opacity-80">
          {activeBlocks.length} {activeBlocks.length === 1 ? "blok" : activeBlocks.length < 5 ? "bloky" : "bloků"}
        </span>
        <span className="text-xs text-indigo-200 opacity-70">
          {savedAt ? `Uloženo ${savedAt.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}` : "Neuloženo"}
        </span>
      </footer>

      {pendingBlock && (
        <VariableDialog html={pendingBlock.html} onConfirm={handleVariableConfirm} onCancel={() => setPendingBlock(null)} />
      )}
    </div>
  );
}
