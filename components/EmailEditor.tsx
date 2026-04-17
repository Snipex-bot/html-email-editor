"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type * as Monaco from "monaco-editor";
import {
  Download, Copy, Check, RefreshCw, Code2, Eye,
  Monitor, Smartphone, Mail, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import BlockLibrary, { type Block } from "./BlockLibrary";
import VariableDialog from "./VariableDialog";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500 text-sm">
      Načítám editor…
    </div>
  ),
});

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;">

  <!-- Přetáhni nebo klikni na blok v levém panelu pro přidání obsahu -->

</body>
</html>`;

type ViewMode = "split" | "code" | "preview";
type DeviceMode = "desktop" | "mobile";

function insertBeforeClosingBody(html: string, snippet: string): string {
  const idx = html.lastIndexOf("</body>");
  if (idx === -1) return html + "\n" + snippet;
  return html.slice(0, idx) + snippet + "\n" + html.slice(idx);
}

export default function EmailEditor() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [copied, setCopied] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingBlock, setPendingBlock] = useState<Block | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── insert logic ──────────────────────────────────────────────
  const insertHtml = useCallback((snippet: string) => {
    const editor = editorRef.current;
    if (editor) {
      const model = editor.getModel();
      const pos = editor.getPosition();
      if (model && pos) {
        const full = model.getValue();
        const bodyClose = full.lastIndexOf("</body>");
        if (bodyClose !== -1) {
          const docPos = model.getPositionAt(bodyClose);
          editor.executeEdits("block-insert", [{
            range: {
              startLineNumber: docPos.lineNumber,
              startColumn: 1,
              endLineNumber: docPos.lineNumber,
              endColumn: 1,
            },
            text: snippet + "\n",
          }]);
          return;
        }
        editor.executeEdits("block-insert", [{
          range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column },
          text: snippet + "\n",
        }]);
        return;
      }
    }
    setHtml((prev) => insertBeforeClosingBody(prev, snippet));
  }, []);

  const handleBlockInsert = useCallback((block: Block) => {
    setPendingBlock(block);
  }, []);

  const handleVariableConfirm = useCallback((filledHtml: string) => {
    setPendingBlock(null);
    insertHtml(filledHtml);
  }, [insertHtml]);

  // ── drag & drop onto editor/preview area ─────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/block")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData("application/block");
    if (!raw) return;
    try {
      const block: Block = JSON.parse(raw);
      setPendingBlock(block);
    } catch {}
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

  // ── toolbar actions ───────────────────────────────────────────
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

  const handleReset = useCallback(() => {
    if (confirm("Obnovit výchozí šablonu? Vaše změny budou ztraceny.")) {
      setHtml(DEFAULT_HTML);
    }
  }, []);

  const lineCount = html.split("\n").length;

  return (
    <div className="flex flex-col h-screen bg-gray-950">

      {/* ── TOOLBAR ───────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="text-gray-500 hover:text-white transition-colors"
          title={sidebarOpen ? "Skrýt bloky" : "Zobrazit bloky"}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Mail size={14} className="text-white" />
          </div>
          <span className="font-semibold text-white text-sm tracking-tight hidden sm:block">
            HTML Email Editor
          </span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {(["code", "split", "preview"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === mode ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              {mode === "code" && <Code2 size={13} />}
              {mode === "split" && (
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-3 bg-current rounded-sm opacity-80" />
                  <span className="w-1.5 h-3 bg-current rounded-sm opacity-80" />
                </span>
              )}
              {mode === "preview" && <Eye size={13} />}
              <span className="hidden sm:inline capitalize">
                {mode === "code" ? "Kód" : mode === "split" ? "Split" : "Náhled"}
              </span>
            </button>
          ))}
        </div>

        {/* Device toggle */}
        {viewMode !== "code" && (
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setDeviceMode("desktop")}
              className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                deviceMode === "desktop" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"
              }`}
              title="Desktop"
            >
              <Monitor size={13} />
            </button>
            <button
              onClick={() => setDeviceMode("mobile")}
              className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                deviceMode === "mobile" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-white"
              }`}
              title="Mobil"
            >
              <Smartphone size={13} />
            </button>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          title="Reset šablony"
        >
          <RefreshCw size={13} />
          <span className="hidden md:inline">Reset</span>
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        >
          {copied ? (
            <><Check size={13} className="text-green-400" /><span className="hidden md:inline text-green-400">Zkopírováno!</span></>
          ) : (
            <><Copy size={13} /><span className="hidden md:inline">Kopírovat</span></>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow"
        >
          <Download size={13} />
          <span>Stáhnout HTML</span>
        </button>
      </header>

      {/* ── BODY ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && <BlockLibrary onInsertBlock={handleBlockInsert} />}

        {/* Editor + Preview */}
        <div
          ref={containerRef}
          className="flex flex-1 overflow-hidden relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drop overlay */}
          {isDragOver && (
            <div className="absolute inset-0 z-20 bg-indigo-600/10 border-2 border-indigo-500 border-dashed rounded pointer-events-none flex items-center justify-center">
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
                Pustit pro vložení bloku
              </div>
            </div>
          )}

          {/* Editor panel */}
          {(viewMode === "split" || viewMode === "code") && (
            <div
              className="flex flex-col overflow-hidden"
              style={{ width: viewMode === "split" ? `${splitPct}%` : "100%" }}
            >
              <div className="flex items-center justify-between px-4 h-8 bg-gray-900 border-b border-gray-800 flex-shrink-0">
                <span className="text-xs text-gray-500 font-mono">index.html</span>
                <span className="text-xs text-gray-600">{lineCount} řádků</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <MonacoEditor
                  height="100%"
                  defaultLanguage="html"
                  value={html}
                  onChange={(v) => setHtml(v ?? "")}
                  theme="vs-dark"
                  onMount={(editor) => { editorRef.current = editor; }}
                  options={{
                    fontSize: 13,
                    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                    fontLigatures: true,
                    minimap: { enabled: false },
                    wordWrap: "on",
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    smoothScrolling: true,
                    cursorSmoothCaretAnimation: "on",
                    tabSize: 2,
                    formatOnPaste: true,
                    renderLineHighlight: "gutter",
                    bracketPairColorization: { enabled: true },
                  }}
                />
              </div>
            </div>
          )}

          {/* Resizer */}
          {viewMode === "split" && (
            <div
              onMouseDown={onResizerMouseDown}
              className="w-1 bg-gray-800 hover:bg-indigo-500 transition-colors flex-shrink-0 cursor-col-resize"
            />
          )}

          {/* Preview panel */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div
              className="flex flex-col overflow-hidden bg-gray-100"
              style={{ width: viewMode === "split" ? `${100 - splitPct}%` : "100%" }}
            >
              <div className="flex items-center gap-2 px-4 h-8 bg-gray-900 border-b border-gray-800 flex-shrink-0">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-70" />
                </div>
                <span className="text-xs text-gray-500 flex-1 text-center">
                  {deviceMode === "mobile" ? "Mobilní náhled (375px)" : "Desktop náhled"}
                </span>
              </div>

              <div
                className={`flex-1 overflow-auto ${
                  deviceMode === "mobile"
                    ? "flex items-start justify-center pt-8 pb-8 bg-gray-200"
                    : "bg-gray-100"
                }`}
              >
                <div
                  className={
                    deviceMode === "mobile"
                      ? "w-[375px] rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 bg-white"
                      : "w-full h-full"
                  }
                  style={deviceMode === "mobile" ? { minHeight: 600 } : {}}
                >
                  <iframe
                    srcDoc={html}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                    className="w-full border-0 bg-white"
                    style={
                      deviceMode === "mobile"
                        ? { height: 700, display: "block" }
                        : { height: "100%", display: "block" }
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STATUS BAR ────────────────────────────────────────── */}
      <footer className="flex items-center justify-between px-4 h-6 bg-indigo-700 flex-shrink-0">
        <span className="text-xs text-indigo-200 opacity-80">HTML Email Editor</span>
        <span className="text-xs text-indigo-200 opacity-70">Live preview · UTF-8</span>
      </footer>

      {/* ── VARIABLE DIALOG ───────────────────────────────────── */}
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
