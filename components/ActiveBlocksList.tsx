"use client";

import { useState, useRef } from "react";
import { GripVertical, Trash2, ChevronDown, ChevronRight, Layers, ChevronUp, ImagePlus, Download, Loader2, XCircle } from "lucide-react";
import type { ActiveBlock } from "./types";
import RichTextField from "./RichTextField";

const TYPE_COLORS: Record<string, string> = {
  header:   "text-purple-400",
  hero:     "text-blue-400",
  content:  "text-green-400",
  products: "text-orange-400",
  footer:   "text-zinc-400",
  utility:  "text-gray-500",
};

interface Props {
  blocks: ActiveBlock[];
  clientId?: string;
  onChange: (instanceId: string, variables: Record<string, string>) => void;
  onDelete: (instanceId: string) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
}

export default function ActiveBlocksList({ blocks, clientId, onChange, onDelete, onReorder }: Props) {
  const dragIdx = useRef<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const onDragStart = (e: React.DragEvent, idx: number) => {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
    // Use a distinct key so palette drops are ignored here
    e.dataTransfer.setData("application/active-block-idx", String(idx));
  };

  const onDragOver = (e: React.DragEvent, idx: number) => {
    // Only react to reorder drags, not palette drags
    if (!e.dataTransfer.types.includes("application/active-block-idx")) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(idx);
  };

  const onDrop = (e: React.DragEvent, toIdx: number) => {
    if (!e.dataTransfer.types.includes("application/active-block-idx")) return;
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    const from = dragIdx.current;
    if (from === null || from === toIdx) return;
    onReorder(from, toIdx);
    dragIdx.current = null;
  };

  const onDragEnd = () => {
    dragIdx.current = null;
    setDropTarget(null);
  };

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 w-72 flex-shrink-0">
        <PanelHeader count={0} />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-6">
          <Layers size={28} className="text-gray-700" />
          <p className="text-xs text-gray-600 leading-relaxed">
            Klikni nebo přetáhni blok z horní lišty pro přidání do šablony
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 w-72 flex-shrink-0">
      <PanelHeader count={blocks.length} />
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {blocks.map((block, idx) => (
          <div key={block.instanceId}>
            {/* Drop zone indicator above */}
            {dropTarget === idx && dragIdx.current !== null && dragIdx.current !== idx && dragIdx.current !== idx - 1 && (
              <div className="h-0.5 bg-indigo-500 rounded-full mx-1 mb-1" />
            )}
            <BlockCard
              block={block}
              idx={idx}
              total={blocks.length}
              clientId={clientId}
              isDragOver={dropTarget === idx}
              onDragStart={(e) => onDragStart(e, idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDrop={(e) => onDrop(e, idx)}
              onDragEnd={onDragEnd}
              onChange={(vars) => onChange(block.instanceId, vars)}
              onDelete={() => onDelete(block.instanceId)}
              onMoveUp={() => idx > 0 && onReorder(idx, idx - 1)}
              onMoveDown={() => idx < blocks.length - 1 && onReorder(idx, idx + 1)}
            />
          </div>
        ))}
        {/* Drop zone at the end */}
        {dropTarget === blocks.length && (
          <div className="h-0.5 bg-indigo-500 rounded-full mx-1 mt-1" />
        )}
        <div
          className="h-8"
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("application/active-block-idx")) return;
            e.preventDefault();
            setDropTarget(blocks.length);
          }}
          onDrop={(e) => onDrop(e, blocks.length - 1)}
        />
      </div>
    </div>
  );
}

function PanelHeader({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between px-4 h-8 border-b border-gray-800 flex-shrink-0">
      <div className="flex items-center gap-1.5">
        <Layers size={12} className="text-indigo-400" />
        <span className="text-xs text-gray-400 font-medium">Aktivní bloky</span>
      </div>
      {count > 0 && (
        <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">{count}</span>
      )}
    </div>
  );
}

// maps canonical scrape keys → variable name substrings to match
const SCRAPE_KEY_MAP: Record<string, string[]> = {
  name:        ["name", "title", "nazev", "produkt", "jmeno"],
  price:       ["price", "cena", "kc", "czk"],
  image:       ["image", "img", "foto", "photo", "src", "picture", "thumbnail"],
  description: ["description", "desc", "popis", "text", "body"],
  brand:       ["brand", "znacka", "vyrobce"],
  url:         ["url", "link", "href"],
};

function applyScrapedData(
  vars: Record<string, string>,
  scraped: Record<string, string>
): Record<string, string> {
  const updated = { ...vars };
  for (const [scrapeKey, substrings] of Object.entries(SCRAPE_KEY_MAP)) {
    const scrapedVal = scraped[scrapeKey];
    if (!scrapedVal) continue;
    for (const varKey of Object.keys(updated)) {
      const lower = varKey.toLowerCase();
      if (substrings.some((s) => lower.includes(s))) {
        updated[varKey] = scrapedVal;
      }
    }
  }
  return updated;
}

function BlockCard({
  block, idx, total, clientId, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onChange, onDelete, onMoveUp, onMoveDown,
}: {
  block: ActiveBlock;
  idx: number;
  total: number;
  clientId?: string;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onChange: (vars: Record<string, string>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const varKeys = Object.keys(block.variables);

  const isProductBlock = block.type === "products";

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapeError("");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl.trim(), clientId }),
      });
      const data = await res.json();
      if (!res.ok) { setScrapeError(data.error ?? "Chyba"); }
      else { onChange(applyScrapedData(block.variables, data)); }
    } catch (err) {
      setScrapeError(String(err));
    } finally {
      setScraping(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`rounded-lg border transition-all ${
        isDragOver
          ? "border-indigo-500 bg-indigo-950/30 shadow-md shadow-indigo-900/20"
          : "border-gray-700/60 bg-gray-800/60 hover:border-gray-600"
      }`}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-1.5 px-2 py-2 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Drag handle */}
        <GripVertical
          size={13}
          className="text-gray-600 hover:text-gray-400 flex-shrink-0 cursor-grab active:cursor-grabbing"
          onClick={e => e.stopPropagation()}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-[9px] font-bold uppercase tracking-wider ${TYPE_COLORS[block.type] ?? "text-gray-500"}`}>
            {block.type}
          </p>
          <p className="text-xs font-medium text-gray-200 truncate">{block.name}</p>
        </div>

        {/* Up / Down */}
        <div className="flex flex-col gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onMoveUp}
            disabled={idx === 0}
            className="p-0.5 text-gray-600 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
            title="Posunout nahoru"
          >
            <ChevronUp size={12} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={idx === total - 1}
            className="p-0.5 text-gray-600 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
            title="Posunout dolů"
          >
            <ChevronDown size={12} />
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-1 text-gray-600 hover:text-red-400 transition-colors rounded flex-shrink-0"
        >
          <Trash2 size={11} />
        </button>

        {/* Expand toggle */}
        {expanded ? (
          <ChevronDown size={12} className="text-gray-600 flex-shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-gray-600 flex-shrink-0" />
        )}
      </div>

      {/* Variables */}
      {expanded && (
        <div className="border-t border-gray-700/50 px-2.5 pt-2 pb-2.5 space-y-2">
          {/* Scrape row — only for product blocks */}
          {isProductBlock && (
            <div className="pb-1.5 border-b border-gray-700/40 space-y-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-orange-400/70">Načíst z webu</p>
              <div className="flex gap-1">
                <input
                  type="url"
                  value={scrapeUrl}
                  onChange={e => { setScrapeUrl(e.target.value); setScrapeError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleScrape()}
                  placeholder="URL produktu…"
                  className="flex-1 min-w-0 bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-md px-2 py-1.5 text-xs text-white placeholder-gray-700 focus:outline-none transition-colors"
                />
                <button
                  onClick={handleScrape}
                  disabled={scraping || !scrapeUrl.trim()}
                  title="Načíst informace o produktu"
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-semibold bg-orange-600/80 hover:bg-orange-500 disabled:opacity-40 text-white transition-all flex-shrink-0"
                >
                  {scraping ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
                  {scraping ? "…" : "Načíst"}
                </button>
              </div>
              {scrapeError && (
                <div className="flex items-center gap-1 text-[9px] text-red-400">
                  <XCircle size={9} /> {scrapeError}
                </div>
              )}
            </div>
          )}

          {varKeys.length === 0 ? (
            <p className="text-[10px] text-gray-700">Žádné proměnné</p>
          ) : (
            <div className="space-y-2">
              {varKeys.map(key => (
                <VariableField
                  key={key}
                  label={key}
                  value={block.variables[key]}
                  rawTemplate={block.rawTemplate}
                  onChange={val => onChange({ ...block.variables, [key]: val })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const RICH_KEYS = ["text", "heading", "subheading", "body", "description", "quote", "name", "title", "subject"];
const IMAGE_SUFFIXES = ["_image", "_img", "_foto", "_photo", "_src", "_thumbnail", "_picture"];
const IMAGE_EXACT = ["image", "img", "foto", "photo", "src"];

function parseImgDims(template: string, varName: string): { w: string; h: string } | null {
  const tags = template.match(/<img[^>]+>/gi) ?? [];
  for (const tag of tags) {
    if (!tag.includes(`{{${varName}}}`)) continue;
    const w = /\bwidth=["']?(\d+)["']?/i.exec(tag)?.[1] ?? /width:\s*(\d+)px/i.exec(tag)?.[1];
    const h = /\bheight=["']?(\d+)["']?/i.exec(tag)?.[1] ?? /height:\s*(\d+)px/i.exec(tag)?.[1];
    if (w || h) return { w: w ?? "?", h: h ?? "?" };
  }
  return null;
}

function VariableField({ label, value, rawTemplate, onChange }: { label: string; value: string; rawTemplate?: string; onChange: (v: string) => void }) {
  const lower = label.toLowerCase();
  const isRich = RICH_KEYS.some(k => lower.includes(k));
  const isImage = IMAGE_SUFFIXES.some(k => lower.includes(k)) || IMAGE_EXACT.includes(lower);
  const isUrl = !isImage && (lower.includes("url") || lower.includes("link"));
  const displayLabel = label.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        onChange((await res.json()).url);
        setUploading(false);
        return;
      }
    } catch {}
    const reader = new FileReader();
    reader.onload = () => { onChange(reader.result as string); setUploading(false); };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-1 font-medium truncate" title={`{{${label}}}`}>
        {displayLabel}
      </label>
      {isRich ? (
        <RichTextField
          value={value}
          onChange={onChange}
          placeholder={`{{${label}}}`}
          rows={label.includes("body") || label.includes("text") ? 3 : 1}
        />
      ) : isImage ? (
        <div className="space-y-1.5">
          {rawTemplate && (() => {
            const dims = parseImgDims(rawTemplate, label);
            if (!dims) return null;
            return (
              <p className="text-[9px] text-gray-600 font-mono">
                {dims.w}×{dims.h} px
              </p>
            );
          })()}
          {value && (
            <img src={value} alt="" className="w-full h-16 object-cover rounded border border-gray-700" />
          )}
          <div className="flex gap-1">
            <label className={`flex items-center gap-1 px-2 py-1.5 rounded text-[10px] text-white cursor-pointer transition-colors flex-shrink-0 ${uploading ? "bg-indigo-700 opacity-60 pointer-events-none" : "bg-indigo-600 hover:bg-indigo-500"}`}>
              <ImagePlus size={10} /> {uploading ? "…" : "Vložit"}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
            </label>
            <input
              type="url"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="nebo URL..."
              className="flex-1 min-w-0 bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-md px-2 py-1.5 text-xs text-white placeholder-gray-700 focus:outline-none transition-colors"
            />
          </div>
        </div>
      ) : (
        <input
          type={isUrl ? "url" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`{{${label}}}`}
          className="w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-md px-2 py-1.5 text-xs text-white placeholder-gray-700 focus:outline-none transition-colors"
        />
      )}
    </div>
  );
}
