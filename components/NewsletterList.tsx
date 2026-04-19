"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Mail, Trash2, Clock, ChevronRight,
  X, ChevronDown, Loader2,
} from "lucide-react";

interface Newsletter {
  id: string;
  name: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  blocks: unknown[];
}

interface Client {
  id: string;
  name: string;
  color: string;
}

const TZ = "Europe/Prague";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "právě teď";
  if (m < 60) return `před ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `před ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `před ${d} d`;
  return new Date(iso).toLocaleDateString("cs-CZ", { timeZone: TZ, day: "numeric", month: "short" });
}

export default function NewsletterList() {
  const router = useRouter();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/newsletters").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]).then(([nls, cls]) => {
      setNewsletters(nls);
      setClients(cls);
      if (cls.length > 0) setNewClientId(cls[0].id);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newClientId) return;
    setCreating(true);
    const res = await fetch("/api/newsletters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), clientId: newClientId }),
    });
    const nl = await res.json();
    setCreating(false);
    router.push(`/editor/${nl.id}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Smazat newsletter "${name}"?`)) return;
    await fetch(`/api/newsletters?id=${id}`, { method: "DELETE" });
    setNewsletters((prev) => prev.filter((n) => n.id !== id));
  };

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  const grouped = newsletters.reduce<Record<string, Newsletter[]>>((acc, n) => {
    (acc[n.clientId] = acc[n.clientId] ?? []).push(n);
    return acc;
  }, {});

  return (
    <div className="min-h-full bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs">
            <ArrowLeft size={13} /> Domů
          </Link>
          <div className="w-px h-4 bg-gray-800" />
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-indigo-400" />
            <span className="text-sm font-semibold text-white">HTML Email Editor</span>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow"
            >
              <Plus size={14} /> Nový newsletter
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-10 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">Newslettery</h1>
          <p className="text-gray-500 text-sm">Vyber newsletter pro editaci nebo vytvoř nový.</p>
        </div>

        {/* New newsletter form */}
        {showNew && (
          <div className="mb-8 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <span className="font-semibold text-white text-sm">Nový newsletter</span>
              <button onClick={() => setShowNew(false)} className="text-gray-600 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="p-5 flex flex-col sm:flex-row gap-3">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Název newsletteru…"
                className="flex-1 bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
              />
              <div className="relative">
                <select
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="appearance-none bg-gray-800 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors pr-8"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Vytvořit
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-600">
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}

        {!loading && newsletters.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center gap-3">
            <Mail size={36} className="text-gray-800" />
            <p className="text-gray-600 text-sm">Zatím žádné newslettery</p>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Plus size={13} /> Vytvořit první
            </button>
          </div>
        )}

        {/* Grouped by client */}
        <div className="space-y-8">
          {Object.entries(grouped).map(([clientId, nls]) => {
            const client = clientMap[clientId];
            return (
              <div key={clientId}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: client?.color ?? "#6b7280" }} />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    {client?.name ?? clientId}
                  </span>
                  <span className="text-xs text-gray-700 ml-1">({nls.length})</span>
                </div>
                <div className="space-y-2">
                  {nls
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map((nl) => (
                      <div key={nl.id} className="group flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl px-5 py-4 transition-all">
                        <Link href={`/editor/${nl.id}`} className="flex-1 flex items-center gap-4 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Mail size={16} className="text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white text-sm truncate">{nl.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <Clock size={10} /> {timeAgo(nl.updatedAt)}
                              </span>
                              <span className="text-xs text-gray-700">
                                {(nl.blocks as unknown[]).length} bloků
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-gray-700 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                        </Link>
                        <button
                          onClick={() => handleDelete(nl.id, nl.name)}
                          className="p-2 text-gray-700 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
