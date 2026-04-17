"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Trash2, ChevronDown, Users, Layers,
  GripVertical, AlertCircle, Loader2,
} from "lucide-react";

export interface Block {
  id: string;
  name: string;
  type: string;
  description: string;
  html: string;
}

export interface Client {
  id: string;
  name: string;
  color: string;
}

interface Props {
  onInsertBlock: (block: Block) => void;
}

const TYPE_COLORS: Record<string, string> = {
  header: "bg-purple-900/60 text-purple-300",
  hero: "bg-blue-900/60 text-blue-300",
  content: "bg-green-900/60 text-green-300",
  products: "bg-orange-900/60 text-orange-300",
  footer: "bg-gray-700/60 text-gray-300",
  utility: "bg-gray-800/60 text-gray-400",
};

export default function BlockLibrary({ onInsertBlock }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [clientOpen, setClientOpen] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data: Client[]) => {
        setClients(data);
        if (data.length > 0) setActiveClient(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!activeClient) return;
    setLoading(true);
    fetch(`/api/blocks?clientId=${activeClient}`)
      .then((r) => r.json())
      .then((data: Block[]) => { setBlocks(data); setLoading(false); });
  }, [activeClient]);

  const handleDelete = useCallback(async (blockId: string) => {
    if (!activeClient || !confirm("Smazat blok?")) return;
    await fetch(`/api/blocks?clientId=${activeClient}&blockId=${blockId}`, { method: "DELETE" });
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
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

  const onDragStart = (e: React.DragEvent, block: Block) => {
    e.dataTransfer.setData("application/block", JSON.stringify(block));
    e.dataTransfer.effectAllowed = "copy";
  };

  const currentClient = clients.find((c) => c.id === activeClient);

  const groupedBlocks = blocks.reduce<Record<string, Block[]>>((acc, b) => {
    (acc[b.type] = acc[b.type] ?? []).push(b);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 w-64 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-8 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Layers size={12} className="text-indigo-400" />
          <span className="text-xs text-gray-400 font-medium">Bloky</span>
        </div>
        <button
          onClick={() => setShowNewClient(true)}
          className="text-gray-600 hover:text-indigo-400 transition-colors"
          title="Přidat klienta"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Client selector */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <button
            onClick={() => setClientOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-sm text-white transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: currentClient?.color ?? "#6b7280" }}
              />
              <span className="truncate text-xs font-medium">
                {currentClient?.name ?? "Vybrat klienta"}
              </span>
            </div>
            <ChevronDown
              size={12}
              className={`flex-shrink-0 text-gray-500 transition-transform ${clientOpen ? "rotate-180" : ""}`}
            />
          </button>

          {clientOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setActiveClient(c.id); setClientOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-700 transition-colors text-left ${
                    c.id === activeClient ? "text-white" : "text-gray-400"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
              {clients.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-600">Žádní klienti</div>
              )}
            </div>
          )}
        </div>

        {/* New client form */}
        {showNewClient && (
          <div className="mt-2 flex gap-1.5">
            <input
              autoFocus
              type="text"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddClient(); if (e.key === "Escape") setShowNewClient(false); }}
              placeholder="Název klienta…"
              className="flex-1 bg-gray-800 border border-indigo-500 rounded-md px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none min-w-0"
            />
            <button
              onClick={handleAddClient}
              className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-md text-white transition-colors flex-shrink-0"
            >
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="mx-3 mb-2 px-2.5 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg flex-shrink-0">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Klikni nebo přetáhni blok do editoru
        </p>
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading && (
          <div className="flex items-center justify-center py-8 text-gray-600">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}

        {!loading && !activeClient && (
          <div className="flex flex-col items-center py-10 text-center gap-2">
            <Users size={24} className="text-gray-700" />
            <p className="text-xs text-gray-600">Vyber nebo přidej klienta</p>
          </div>
        )}

        {!loading && activeClient && blocks.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center gap-2">
            <AlertCircle size={20} className="text-gray-700" />
            <p className="text-xs text-gray-600">Žádné bloky</p>
          </div>
        )}

        {!loading && Object.entries(groupedBlocks).map(([type, typeBlocks]) => (
          <div key={type} className="mb-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${TYPE_COLORS[type] ?? "bg-gray-700/60 text-gray-400"}`}>
                {type}
              </span>
            </div>
            <div className="space-y-1.5">
              {typeBlocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  onInsert={() => onInsertBlock(block)}
                  onDelete={() => handleDelete(block.id)}
                  onDragStart={(e) => onDragStart(e, block)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockCard({
  block,
  onInsert,
  onDelete,
  onDragStart,
}: {
  block: Block;
  onInsert: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onInsert}
      className="group flex items-center gap-2 px-2.5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500/50 rounded-lg cursor-pointer transition-all select-none"
    >
      <GripVertical size={12} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-200 truncate leading-tight">{block.name}</p>
        {block.description && (
          <p className="text-[10px] text-gray-600 truncate leading-tight mt-0.5">{block.description}</p>
        )}
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}
