"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Check, ChevronDown,
  Layers, Code2, Mail, Eye, EyeOff,
} from "lucide-react";
import type { LibraryBlock, Client } from "./types";

const BLOCK_TYPES = ["header", "hero", "content", "products", "footer", "utility"];

const TYPE_COLORS: Record<string, string> = {
  header:   "bg-purple-900/50 text-purple-300 border-purple-700/40",
  hero:     "bg-blue-900/50 text-blue-300 border-blue-700/40",
  content:  "bg-green-900/50 text-green-300 border-green-700/40",
  products: "bg-orange-900/50 text-orange-300 border-orange-700/40",
  footer:   "bg-zinc-800/50 text-zinc-300 border-zinc-600/40",
  utility:  "bg-gray-800/50 text-gray-400 border-gray-600/40",
};

const EMPTY_FORM = { id: "", name: "", type: "content", description: "", html: "" };

export default function AdminBlocksManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<LibraryBlock[]>([]);
  const [editingBlock, setEditingBlock] = useState<LibraryBlock | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [previewBlock, setPreviewBlock] = useState<LibraryBlock | null>(null);
  const [clientDropdown, setClientDropdown] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    fetch("/api/clients", { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: Client[]) => {
        clearTimeout(timer);
        setClients(data);
        if (data.length > 0) setActiveClient(data[0].id);
        setLoading(false);
      })
      .catch(e => {
        clearTimeout(timer);
        setLoadError(e.name === "AbortError" ? "Časový limit překročen — zkontroluj Supabase připojení" : e.message);
        setLoading(false);
      });
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, []);

  useEffect(() => {
    if (!activeClient) return;
    fetch(`/api/blocks?clientId=${activeClient}`)
      .then(r => r.json())
      .then(setBlocks);
  }, [activeClient]);

  const openAdd = () => {
    setEditingBlock(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (block: LibraryBlock) => {
    setEditingBlock(block);
    setForm({ ...block });
    setShowForm(true);
  };

  const handleSave = useCallback(async () => {
    if (!activeClient || !form.name || !form.html) return;
    setSaving(true);
    const isEdit = !!editingBlock;
    const blockData = isEdit
      ? { ...form, id: editingBlock.id }
      : { ...form, id: form.id || `block-${Date.now()}` };

    await fetch("/api/blocks", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: activeClient, block: blockData }),
    });

    const updated: LibraryBlock[] = await fetch(`/api/blocks?clientId=${activeClient}`).then(r => r.json());
    setBlocks(updated);
    setSaving(false);
    setShowForm(false);
    setEditingBlock(null);
  }, [activeClient, form, editingBlock]);

  const handleDelete = useCallback(async (blockId: string) => {
    if (!activeClient || !confirm("Smazat blok? Tato akce je nevratná.")) return;
    await fetch(`/api/blocks?clientId=${activeClient}&blockId=${blockId}`, { method: "DELETE" });
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  }, [activeClient]);

  const currentClient = clients.find(c => c.id === activeClient);

  return (
    <div className="min-h-full bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/nastaveni" className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs">
            <ArrowLeft size={13} /> Admin
          </Link>
          <div className="w-px h-4 bg-gray-800" />
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-indigo-400" />
            <span className="text-sm font-semibold text-white">Správa bloků</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/editor"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all"
            >
              <Mail size={12} /> Otevřít editor
            </Link>
          </div>
        </div>
      </nav>

      {loadError && (
        <div className="max-w-6xl mx-auto px-6 pt-8">
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-sm text-red-300">
            <strong>Chyba při načítání:</strong> {loadError}
            <p className="text-xs text-red-400 mt-1 opacity-70">Zkontroluj Supabase env proměnné a připojení.</p>
          </div>
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-600">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      )}
      {!loading && <div className="max-w-6xl mx-auto px-6 py-8 flex gap-6">

        {/* ── LEFT: client list ── */}
        <div className="w-56 flex-shrink-0">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Klienti</p>
          <div className="space-y-1">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveClient(c.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                  c.id === activeClient
                    ? "bg-indigo-600 text-white font-medium"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: block list + form ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white">
                {currentClient?.name ?? "Vyberte klienta"}
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">{blocks.length} bloků</p>
            </div>
            {activeClient && (
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow"
              >
                <Plus size={14} /> Přidat blok
              </button>
            )}
          </div>

          {/* Block form (add / edit) */}
          {showForm && (
            <div className="mb-6 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Code2 size={14} className="text-indigo-400" />
                  <span className="text-sm font-semibold text-white">
                    {editingBlock ? "Upravit blok" : "Nový blok"}
                  </span>
                </div>
                <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-white transition-colors">
                  <X size={15} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">Název</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Název bloku"
                      className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">Typ</label>
                    <div className="relative">
                      <select
                        value={form.type}
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full appearance-none bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors pr-8"
                      >
                        {BLOCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Popis</label>
                  <input
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Krátký popis bloku"
                    className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-gray-500 font-medium">
                      HTML kód
                      <span className="ml-2 text-gray-700 font-normal">— používej <code className="text-indigo-400">{`{{promenna}}`}</code> pro dynamické hodnoty</span>
                    </label>
                  </div>
                  <textarea
                    value={form.html}
                    onChange={e => setForm(f => ({ ...f, html: e.target.value }))}
                    placeholder="<table>...</table>"
                    rows={12}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-700 focus:outline-none transition-colors font-mono resize-y"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
                    Zrušit
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.name || !form.html}
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all"
                  >
                    <Check size={13} />
                    {saving ? "Ukládám…" : "Uložit blok"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Block cards */}
          {blocks.length === 0 && !showForm && activeClient && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Layers size={36} className="text-gray-800 mb-3" />
              <p className="text-gray-600 text-sm mb-4">Žádné bloky</p>
              <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all">
                <Plus size={13} /> Přidat první blok
              </button>
            </div>
          )}

          <div className="space-y-3">
            {blocks.map(block => (
              <div
                key={block.id}
                className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${
                  previewBlock?.id === block.id ? "border-indigo-500/50" : "border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${TYPE_COLORS[block.type] ?? "bg-gray-800 text-gray-400 border-gray-600"}`}>
                    {block.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{block.name}</p>
                    {block.description && (
                      <p className="text-xs text-gray-600 truncate">{block.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setPreviewBlock(previewBlock?.id === block.id ? null : block)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
                      title="Náhled HTML"
                    >
                      {previewBlock?.id === block.id ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      onClick={() => openEdit(block)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(block.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* HTML preview */}
                {previewBlock?.id === block.id && (
                  <div className="border-t border-gray-800 bg-gray-950">
                    <pre className="text-xs text-gray-400 font-mono p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {block.html}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>}
    </div>
  );
}
