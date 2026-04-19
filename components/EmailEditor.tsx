"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Download, Copy, Check, RefreshCw, Code2, Eye,
  Mail, Minus, Plus,
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

const EMPTY_HTML = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Email</title>
  <style>
    body { margin: 0; padding: 40px 20px; background: #f4f5f7; font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <!-- Přidej bloky z horní lišty -->
</body>
</html>`;

// ── main component ───────────────────────────────────────────────

export default function EmailEditor() {
  const [activeBlocks, setActiveBlocks] = useState<ActiveBlock[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [previewWidth, setPreviewWidth] = useState<number>(600);
  const [pendingBlock, setPendingBlock] = useState<LibraryBlock | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const html = activeBlocks.length > 0 ? buildHtml(activeBlocks) : EMPTY_HTML;

  // ── block operations ─────────────────────────────────────────

  const handleAddBlock = useCallback((block: LibraryBlock) => {
    setPendingBlock(block);
  }, []);

  const handleVariableConfirm = useCallback(
    (filledHtml: string) => {
      if (!pendingBlock) return;
      const variables = extractVariables(pendingBlock.html);
      // back-fill confirmed values from filledHtml
      const confirmedVars = { ...variables };
      for (const key of Object.keys(confirmedVars)) {
        const re = new RegExp(`\\{\\{${key}\\}\\}`);
        if (!re.test(filledHtml)) {
          const idx = filledHtml.indexOf(">");
          // extract by diffing template vs filled
        }
      }
      // simpler: re-extract from filled by comparing with template
      const rawTpl = pendingBlock.html;
      const filledVars: Record<string, string> = {};
      for (const key of Object.keys(variables)) {
        const parts = rawTpl.split(`{{${key}}}`);
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

      const newBlock: ActiveBlock = {
        instanceId: `${pendingBlock.id}-${Date.now()}`,
        blockId: pendingBlock.id,
        name: pendingBlock.name,
        type: pendingBlock.type,
        rawTemplate: pendingBlock.html,
        variables: filledVars,
      };
      setActiveBlocks((prev) => [...prev, newBlock]);
      setPendingBlock(null);
    },
    [pendingBlock]
  );

  const handleUpdateBlock = useCallback(
    (instanceId: string, variables: Record<string, string>) => {
      setActiveBlocks((prev) =>
        prev.map((b) => (b.instanceId === instanceId ? { ...b, variables } : b))
      );
    },
    []
  );

  const handleDeleteBlock = useCallback((instanceId: string) => {
    setActiveBlocks((prev) => prev.filter((b) => b.instanceId !== instanceId));
  }, []);

  const handleReorder = useCallback((fromIdx: number, toIdx: number) => {
    setActiveBlocks((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  }, []);

  const handleReset = useCallback(() => {
    if (confirm("Smazat všechny bloky a začít znovu?")) setActiveBlocks([]);
  }, []);

  // ── drag & drop from palette ──────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/block")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData("application/block");
    if (!raw) return;
    try { setPendingBlock(JSON.parse(raw)); } catch {}
  }, []);

  // ── resizer ───────────────────────────────────────────────────

  const onResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.min(80, Math.max(20, ((e.clientX - rect.left) / rect.width) * 100));
      setSplitPct(pct);
    };
    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // ── toolbar ───────────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email-template.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [html]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  return (
    <div className="editor-root flex flex-col bg-gray-950">

      {/* ── TOOLBAR ─────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 h-12 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Mail size={12} className="text-white" />
          </div>
          <span className="font-semibold text-white text-sm hidden sm:block">HTML Email Editor</span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg p-1">
          {(["code", "split", "preview"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === mode ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {mode === "code" && <Code2 size={12} />}
              {mode === "split" && <span className="flex gap-0.5"><span className="w-1 h-3 bg-current rounded-sm" /><span className="w-1 h-3 bg-current rounded-sm" /></span>}
              {mode === "preview" && <Eye size={12} />}
              <span className="hidden sm:inline">{mode === "code" ? "Kód" : mode === "split" ? "Split" : "Náhled"}</span>
            </button>
          ))}
        </div>


        <div className="flex-1" />

        <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-all" title="Resetovat">
          <RefreshCw size={12} />
          <span className="hidden md:inline">Reset</span>
        </button>
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
          {copied ? <><Check size={12} className="text-green-400" /><span className="hidden md:inline text-green-400">Zkopírováno!</span></> : <><Copy size={12} /><span className="hidden md:inline">Kopírovat</span></>}
        </button>
        <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
          <Download size={12} />
          <span>Stáhnout</span>
        </button>
      </header>

      {/* ── BLOCK PALETTE (horizontal) ───────────────────────── */}
      <BlockPalette onAddBlock={handleAddBlock} />

      {/* ── MAIN AREA ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Active blocks panel */}
        <ActiveBlocksList
          blocks={activeBlocks}
          onChange={handleUpdateBlock}
          onDelete={handleDeleteBlock}
          onReorder={handleReorder}
        />

        {/* Editor + Preview */}
        <div
          ref={containerRef}
          className="flex flex-1 overflow-hidden relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragOver && (
            <div className="absolute inset-0 z-20 bg-indigo-600/10 border-2 border-indigo-500 border-dashed pointer-events-none flex items-center justify-center">
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
                Pustit pro přidání bloku
              </div>
            </div>
          )}

          {/* Code panel */}
          {(viewMode === "split" || viewMode === "code") && (
            <div className="flex flex-col overflow-hidden" style={{ width: viewMode === "split" ? `${splitPct}%` : "100%" }}>
              <div className="flex items-center justify-between px-4 h-8 bg-gray-900 border-b border-gray-800 flex-shrink-0">
                <span className="text-xs text-gray-500 font-mono">vygenerovaný HTML</span>
                <span className="text-xs text-gray-600">{html.split("\n").length} řádků</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <MonacoEditor
                  height="100%"
                  defaultLanguage="html"
                  value={html}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    fontSize: 12,
                    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                    minimap: { enabled: false },
                    wordWrap: "on",
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 12, bottom: 12 },
                    renderLineHighlight: "gutter",
                    bracketPairColorization: { enabled: true },
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
            <div className="flex flex-col overflow-hidden bg-gray-100" style={{ width: viewMode === "split" ? `${100 - splitPct}%` : "100%" }}>
              {/* Preview header */}
              <div className="flex items-center gap-2 px-3 h-8 bg-gray-900 border-b border-gray-800 flex-shrink-0">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 opacity-60" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500 opacity-60" />
                  <span className="w-2 h-2 rounded-full bg-green-500 opacity-60" />
                </div>
                {/* Width control */}
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => setPreviewWidth(w => Math.max(320, w - 20))}
                    className="text-gray-600 hover:text-white transition-colors"
                  ><Minus size={10} /></button>
                  <input
                    type="number"
                    value={previewWidth}
                    onChange={e => setPreviewWidth(Math.max(320, Math.min(1200, Number(e.target.value))))}
                    className="w-14 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-white text-center focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-gray-600">px</span>
                  <button
                    onClick={() => setPreviewWidth(w => Math.min(1200, w + 20))}
                    className="text-gray-600 hover:text-white transition-colors"
                  ><Plus size={10} /></button>
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1 ml-1">
                  {[375, 600, 800].map(w => (
                    <button
                      key={w}
                      onClick={() => setPreviewWidth(w)}
                      className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${previewWidth === w ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-white"}`}
                    >{w}</button>
                  ))}
                </div>
                <div className="flex-1" />
                <span className="text-[10px] text-gray-600">{previewWidth}px</span>
              </div>

              {/* Preview area */}
              <div className="flex-1 overflow-auto flex items-start justify-center bg-gray-200 pt-4 pb-4">
                <div
                  className="bg-white shadow-xl flex-shrink-0"
                  style={{ width: previewWidth, minHeight: "100%" }}
                >
                  <iframe
                    srcDoc={html}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                    style={{ width: "100%", height: "800px", display: "block", border: 0 }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STATUS BAR ──────────────────────────────────────── */}
      <footer className="flex items-center justify-between px-4 h-6 bg-indigo-700 flex-shrink-0">
        <span className="text-xs text-indigo-200 opacity-80">
          {activeBlocks.length} {activeBlocks.length === 1 ? "blok" : activeBlocks.length < 5 ? "bloky" : "bloků"}
        </span>
        <span className="text-xs text-indigo-200 opacity-70">Live preview · UTF-8</span>
      </footer>

      {/* Variable dialog */}
      {pendingBlock && (
        <VariableDialog
          html={pendingBlock.html}
          onConfirm={handleVariableConfirm}
          onCancel={() => setPendingBlock(null)}
        />
      )}
    </div>
  );
}
