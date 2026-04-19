"use client";

import { useState } from "react";
import { X, Wand2, ImagePlus } from "lucide-react";

const IMAGE_SUFFIXES = ["_image", "_img", "_foto", "_photo", "_src", "_thumbnail", "_picture"];
const IMAGE_EXACT = ["image", "img", "foto", "photo", "src"];

interface Props {
  html: string;
  onConfirm: (filledHtml: string) => void;
  onCancel: () => void;
}

function extractVariables(html: string): string[] {
  const matches = html.match(/\{\{([^}]+)\}\}/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(2, -2).trim())));
}

export default function VariableDialog({ html, onConfirm, onCancel }: Props) {
  const variables = extractVariables(html);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(variables.map((v) => [v, ""]))
  );

  const handleConfirm = () => {
    let filled = html;
    for (const [key, value] of Object.entries(values)) {
      filled = filled.replaceAll(`{{${key}}}`, value || `{{${key}}}`);
    }
    onConfirm(filled);
  };

  const labelFor = (v: string) =>
    v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (variables.length === 0) {
    onConfirm(html);
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Wand2 size={16} className="text-indigo-400" />
            <span className="font-semibold text-white text-sm">Vyplnit proměnné</span>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {variables.map((v) => {
            const vl = v.toLowerCase();
            const isImage = IMAGE_SUFFIXES.some(k => vl.includes(k)) || IMAGE_EXACT.includes(vl);
            const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = "";
              const fd = new FormData();
              fd.append("file", file);
              fetch("/api/upload", { method: "POST", body: fd })
                .then(res => res.ok ? res.json().then((d: { url: string }) => setValues(prev => ({ ...prev, [v]: d.url }))) : Promise.reject())
                .catch(() => {
                  const reader = new FileReader();
                  reader.onload = () => setValues(prev => ({ ...prev, [v]: reader.result as string }));
                  reader.readAsDataURL(file);
                });
            };
            return (
              <div key={v}>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                  {labelFor(v)}
                  <span className="ml-2 font-mono text-gray-600 font-normal">{`{{${v}}}`}</span>
                </label>
                {isImage ? (
                  <div className="space-y-1.5">
                    {values[v] && (
                      <img src={values[v]} alt="" className="w-full h-20 object-cover rounded border border-gray-700" />
                    )}
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs text-white cursor-pointer transition-colors flex-shrink-0">
                        <ImagePlus size={12} /> Vložit foto
                        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                      </label>
                      <input
                        type="url"
                        value={values[v]}
                        onChange={e => setValues(prev => ({ ...prev, [v]: e.target.value }))}
                        placeholder="nebo URL obrázku…"
                        className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={values[v]}
                    onChange={(e) => setValues((prev) => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`Hodnota pro ${labelFor(v)}…`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-gray-800 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            Zrušit
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
          >
            Vložit blok
          </button>
        </div>
      </div>
    </div>
  );
}
