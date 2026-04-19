"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, Plus, Loader2, GripVertical } from "lucide-react";
import type { LibraryBlock, Client } from "./types";

const TYPE_COLORS: Record<string, string> = {
  header:   "bg-purple-900/70 text-purple-300 border-purple-700/50",
  hero:     "bg-blue-900/70 text-blue-300 border-blue-700/50",
  content:  "bg-green-900/70 text-green-300 border-green-700/50",
  products: "bg-orange-900/70 text-orange-300 border-orange-700/50",
  footer:   "bg-zinc-800/70 text-zinc-300 border-zinc-600/50",
  utility:  "bg-gray-800/70 text-gray-400 border-gray-600/50",
};

interface Props {
  onAddBlock: (block: LibraryBlock) => void;
  initialClientId?: string;
}

export default function BlockPalette({ onAddBlock, initialClientId }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<LibraryBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data: Client[]) => {
        setClients(data);
        const preferred = initialClientId && data.find((c: Client) => c.id === initialClientId);
        setActiveClient(preferred ? preferred.id : data[0]?.id ?? null);
      });
  }, []);

  useEffect(() => {
    if (!activeClient) return;
    setLoading(true);
    fetch(`/api/blocks?clientId=${activeClient}`)
      .then((r) => r.json())
      .then((data: LibraryBlock[]) => { setBlocks(data); setLoading(false); });
  }, [activeClient]);

  const handleAddClient = async () => {
    if (!newClientName.trim()) return;
    const id = newClientName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: newClientName.trim(), color: "#6366f1" }),
    });
    if (res.ok) {
      const client = await res.json();
      setClients((prev) => [...prev, client]);
      setActiveClient(client.id);
    }
    setNewClientName("");
    setShowNewClient(false);
  };

  const onDragStart = (e: React.DragEvent, block: LibraryBlock) => {
    e.dataTransfer.setData("application/block", JSON.stringify(block));
    e.dataTransfer.effectAllowed = "copy";
  };

  const currentClient = clients.find((c) => c.id === activeClient);

  // horizontal scroll with wheel
  const onWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 h-16 bg-gray-900 border-b border-gray-800 flex-shrink-0">
      {/* Client selector */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setClientOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-xs text-white transition-colors min-w-[130px]"
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: currentClient?.color ?? "#6b7280" }}
          />
          <span className="truncate font-medium">{currentClient?.name ?? "Klient"}</span>
          <ChevronDown size={11} className={`flex-shrink-0 text-gray-500 transition-transform ml-auto ${clientOpen ? "rotate-180" : ""}`} />
        </button>

        {clientOpen && (
          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-30 min-w-[160px] overflow-hidden">
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => { setActiveClient(c.id); setClientOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-700 transition-colors text-left ${c.id === activeClient ? "text-white" : "text-gray-400"}`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                {c.name}
              </button>
            ))}
            <div className="border-t border-gray-700">
              {showNewClient ? (
                <div className="flex gap-1 p-2">
                  <input
                    autoFocus
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddClient(); if (e.key === "Escape") setShowNewClient(false); }}
                    placeholder="Název klienta…"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 min-w-0"
                  />
                  <button onClick={handleAddClient} className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors">
                    <Plus size={11} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewClient(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <Plus size={11} /> Přidat klienta
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-8 bg-gray-800 flex-shrink-0" />

      {/* Blocks row */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-600 text-xs">
          <Loader2 size={13} className="animate-spin" />
          Načítám…
        </div>
      ) : blocks.length === 0 ? (
        <span className="text-xs text-gray-600">Žádné bloky pro tohoto klienta</span>
      ) : (
        <div
          ref={scrollRef}
          onWheel={onWheel}
          className="flex items-center gap-2 overflow-x-auto flex-1 scrollbar-hide pb-0.5"
          style={{ scrollbarWidth: "none" }}
        >
          {blocks.map((block) => (
            <button
              key={block.id}
              draggable
              onDragStart={(e) => onDragStart(e, block)}
              onClick={() => onAddBlock(block)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium flex-shrink-0 transition-opacity active:opacity-70 ${TYPE_COLORS[block.type] ?? "bg-gray-800 text-gray-300 border-gray-600"}`}
              title={block.description}
            >
              <GripVertical size={10} className="opacity-50" />
              {block.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
