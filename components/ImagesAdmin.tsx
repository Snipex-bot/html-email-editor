"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowLeft, ChevronDown, Trash2, Upload, Loader2, Copy, Check, ImageOff } from "lucide-react";
import Link from "next/link";
import type { Client } from "./types";

interface ImageRecord {
  id: string;
  client_id: string;
  name: string;
  path: string;
  url: string;
  size: number;
  created_at: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ImagesAdmin() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then((data: Client[]) => {
        setClients(data);
        if (data.length > 0) setActiveClientId(data[0].id);
      });
  }, []);

  const loadImages = useCallback((clientId: string) => {
    setLoading(true);
    fetch(`/api/images?clientId=${clientId}`)
      .then(r => r.json())
      .then((data: ImageRecord[]) => { setImages(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeClientId) loadImages(activeClientId);
  }, [activeClientId, loadImages]);

  const currentClient = clients.find(c => c.id === activeClientId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !activeClientId) return;
    e.target.value = "";
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("clientId", activeClientId);
      await fetch("/api/upload", { method: "POST", body: fd });
    }
    setUploading(false);
    loadImages(activeClientId);
  };

  const handleDelete = async (img: ImageRecord) => {
    if (!confirm(`Smazat obrázek "${img.name}"?`)) return;
    await fetch(`/api/images?id=${img.id}`, { method: "DELETE" });
    setImages(prev => prev.filter(i => i.id !== img.id));
  };

  const handleCopy = (img: ImageRecord) => {
    navigator.clipboard.writeText(img.url);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-full bg-gray-950">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/nastaveni" className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs">
            <ArrowLeft size={13} /> Zpět
          </Link>
          <div className="w-px h-4 bg-gray-800" />
          <span className="text-sm font-semibold text-white">Galerie obrázků</span>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setClientOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white min-w-[140px]"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: currentClient?.color ?? "#6b7280" }} />
                <span className="truncate font-medium flex-1 text-left">{currentClient?.name ?? "Klient"}</span>
                <ChevronDown size={11} className={`text-gray-500 transition-transform ${clientOpen ? "rotate-180" : ""}`} />
              </button>
              {clientOpen && (
                <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-30 min-w-[160px] overflow-hidden">
                  {clients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setActiveClientId(c.id); setClientOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-700 text-left ${c.id === activeClientId ? "text-white" : "text-gray-400"}`}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || !activeClientId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {uploading ? "Nahrávám…" : "Nahrát"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-600">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <ImageOff size={32} className="text-gray-700" />
            <p className="text-sm text-gray-600">Žádné obrázky pro tohoto klienta</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
            >
              <Upload size={13} /> Nahrát první obrázek
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-600 mb-6">{images.length} obrázků</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map(img => (
                <div key={img.id} className="group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all">
                  <div className="aspect-square bg-gray-800 overflow-hidden">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-gray-400 truncate" title={img.name}>{img.name}</p>
                    <p className="text-[9px] text-gray-600 font-mono truncate" title={img.url}>
                      {img.path}
                    </p>
                    <p className="text-[9px] text-gray-700">{formatSize(img.size)}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleCopy(img)}
                      title="Kopírovat URL"
                      className="p-2 bg-gray-800 hover:bg-indigo-600 rounded-lg text-white transition-colors"
                    >
                      {copiedId === img.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleDelete(img)}
                      title="Smazat"
                      className="p-2 bg-gray-800 hover:bg-red-600 rounded-lg text-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
