"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  Code2,
  Eye,
  Monitor,
  Smartphone,
  Mail,
} from "lucide-react";

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
  <style>
    body {
      margin: 0; padding: 0;
      font-family: -apple-system, Arial, sans-serif;
      background: #f4f5f7;
    }
    .wrapper {
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 48px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      color: rgba(255,255,255,0.8);
      margin: 0;
      font-size: 15px;
    }
    .content {
      padding: 40px 40px 32px;
    }
    .content h2 {
      color: #111827;
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 16px;
    }
    .content p {
      color: #6b7280;
      line-height: 1.7;
      margin: 0 0 16px;
      font-size: 15px;
    }
    .button-wrapper {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background: #6366f1;
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: 0.2px;
    }
    .divider {
      height: 1px;
      background: #f3f4f6;
      margin: 8px 0;
    }
    .features {
      display: table;
      width: 100%;
      padding: 0 40px 32px;
    }
    .feature {
      display: table-cell;
      width: 33.33%;
      text-align: center;
      padding: 0 8px;
    }
    .feature-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }
    .feature h3 {
      color: #111827;
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px;
    }
    .feature p {
      color: #9ca3af;
      font-size: 13px;
      margin: 0;
      line-height: 1.5;
    }
    .footer {
      background: #f9fafb;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #9ca3af;
      font-size: 12px;
      margin: 0 0 4px;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <!-- HEADER -->
      <div class="header">
        <h1>✨ Váš Newsletter</h1>
        <p>Duben 2024 · Nejnovější novinky pro vás</p>
      </div>

      <!-- CONTENT -->
      <div class="content">
        <h2>Vítejte v novém vydání!</h2>
        <p>
          Děkujeme, že jste součástí naší komunity. Každý měsíc pro vás
          připravujeme to nejlepší — tipy, novinky a inspiraci přímo do vaší schránky.
        </p>
        <p>
          Tento měsíc jsme pro vás připravili spoustu zajímavého obsahu,
          který vám pomůže v práci i osobním životě. Neváhejte se podělit
          s přáteli!
        </p>
        <div class="button-wrapper">
          <a href="#" class="button">Přečíst celý článek →</a>
        </div>
      </div>

      <div class="divider"></div>

      <!-- FEATURES -->
      <div class="features">
        <div class="feature">
          <div class="feature-icon">🚀</div>
          <h3>Novinky</h3>
          <p>Přehled toho nejdůležitějšího</p>
        </div>
        <div class="feature">
          <div class="feature-icon">💡</div>
          <h3>Tipy</h3>
          <p>Praktické rady do každého dne</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🎁</div>
          <h3>Nabídky</h3>
          <p>Exkluzivní slevy jen pro vás</p>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <p>© 2024 Vaše Firma s.r.o. · Všechna práva vyhrazena.</p>
        <p>
          <a href="#">Odhlásit odběr</a> ·
          <a href="#">Zobrazit v prohlížeči</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;

type ViewMode = "split" | "code" | "preview";
type DeviceMode = "desktop" | "mobile";

export default function EmailEditor() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [copied, setCopied] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (confirm("Opravdu chcete obnovit výchozí šablonu? Vaše změny budou ztraceny.")) {
      setHtml(DEFAULT_HTML);
    }
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
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

  const lineCount = html.split("\n").length;
  const charCount = html.length;

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* ── TOOLBAR ── */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Mail size={14} className="text-white" />
          </div>
          <span className="font-semibold text-white text-sm tracking-tight hidden sm:block">
            HTML Email Editor
          </span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "code"
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Code2 size={13} />
            <span className="hidden sm:inline">Kód</span>
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "split"
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="flex gap-0.5">
              <span className="w-1.5 h-3 bg-current rounded-sm opacity-80" />
              <span className="w-1.5 h-3 bg-current rounded-sm opacity-80" />
            </span>
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "preview"
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Eye size={13} />
            <span className="hidden sm:inline">Náhled</span>
          </button>
        </div>

        {/* Device toggle — only in preview/split */}
        {viewMode !== "code" && (
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setDeviceMode("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                deviceMode === "desktop"
                  ? "bg-gray-600 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Desktop náhled"
            >
              <Monitor size={13} />
            </button>
            <button
              onClick={() => setDeviceMode("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                deviceMode === "mobile"
                  ? "bg-gray-600 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Mobilní náhled"
            >
              <Smartphone size={13} />
            </button>
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          title="Obnovit výchozí šablonu"
        >
          <RefreshCw size={13} />
          <span className="hidden md:inline">Reset</span>
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        >
          {copied ? (
            <>
              <Check size={13} className="text-green-400" />
              <span className="hidden md:inline text-green-400">Zkopírováno!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span className="hidden md:inline">Kopírovat</span>
            </>
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

      {/* ── PANELS ── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden relative">
        {/* Editor panel */}
        {(viewMode === "split" || viewMode === "code") && (
          <div
            className="flex flex-col overflow-hidden"
            style={{ width: viewMode === "split" ? `${splitPct}%` : "100%" }}
          >
            <div className="flex items-center justify-between px-4 h-8 bg-gray-900 border-b border-gray-800 flex-shrink-0">
              <span className="text-xs text-gray-500 font-mono">index.html</span>
              <span className="text-xs text-gray-600">
                {lineCount} řádků · {charCount} znaků
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <MonacoEditor
                height="100%"
                defaultLanguage="html"
                value={html}
                onChange={(v) => setHtml(v ?? "")}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace",
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
            onMouseDown={onMouseDown}
            className="resizer w-1 bg-gray-800 hover:bg-indigo-500 transition-colors flex-shrink-0 relative group"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
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
                  className="w-full h-full border-0 bg-white"
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

      {/* ── STATUS BAR ── */}
      <footer className="flex items-center justify-between px-4 h-6 bg-indigo-700 flex-shrink-0">
        <span className="text-xs text-indigo-200 opacity-80">HTML Email Editor</span>
        <span className="text-xs text-indigo-200 opacity-70">
          Live preview · UTF-8
        </span>
      </footer>
    </div>
  );
}
