"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft, Save, Search, CheckCircle2, XCircle,
  Loader2, Plus, Trash2, Globe, ChevronDown, FlaskConical,
} from "lucide-react";
import Link from "next/link";
import type { Client } from "./types";

const CANONICAL_FIELDS = [
  { key: "name",        label: "Název produktu",  defaultAttr: "text" },
  { key: "price",       label: "Cena",             defaultAttr: "text" },
  { key: "image",       label: "Obrázek (URL)",    defaultAttr: "src"  },
  { key: "description", label: "Popis",            defaultAttr: "text" },
  { key: "brand",       label: "Značka / výrobce", defaultAttr: "text" },
];

const ATTR_OPTIONS = ["text", "src", "href", "content", "data-src", "value"];

interface ScrapingField {
  key: string;
  selector: string;
  attr: string;
}

interface ScrapingConfig {
  fields: ScrapingField[];
}

type TestStatus = "idle" | "loading" | "ok" | "error";

function defaultConfig(): ScrapingConfig {
  return {
    fields: CANONICAL_FIELDS.map((f) => ({ key: f.key, selector: "", attr: f.defaultAttr })),
  };
}

export default function ScrapingAdmin() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [config, setConfig] = useState<ScrapingConfig>(defaultConfig());
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const [testUrl, setTestUrl] = useState("");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testResult, setTestResult] = useState<Record<string, string> | null>(null);
  const [testError, setTestError] = useState("");

  // load clients
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data: Client[]) => {
        setClients(data);
        if (data.length > 0) setActiveClientId(data[0].id);
      });
  }, []);

  // load client config when activeClientId changes
  useEffect(() => {
    if (!activeClientId) return;
    setLoadingConfig(true);
    setTestResult(null);
    setTestStatus("idle");
    fetch(`/api/clients/config?clientId=${activeClientId}`)
      .then((r) => r.json())
      .then((d: { scraping_config?: ScrapingConfig }) => {
        setConfig(d.scraping_config ?? defaultConfig());
        setLoadingConfig(false);
      })
      .catch(() => { setConfig(defaultConfig()); setLoadingConfig(false); });
  }, [activeClientId]);

  const currentClient = clients.find((c) => c.id === activeClientId);

  const setFieldProp = (key: string, prop: "selector" | "attr", value: string) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.key === key ? { ...f, [prop]: value } : f)),
    }));
    setSavedOk(false);
  };

  const addCustomField = () => {
    setConfig((prev) => ({
      ...prev,
      fields: [...prev.fields, { key: `custom_${Date.now()}`, selector: "", attr: "text" }],
    }));
  };

  const removeField = (key: string) => {
    setConfig((prev) => ({ ...prev, fields: prev.fields.filter((f) => f.key !== key) }));
  };

  const handleSave = useCallback(async () => {
    if (!activeClientId) return;
    setSaving(true);
    await fetch("/api/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activeClientId, scraping_config: config }),
    });
    setSaving(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
  }, [activeClientId, config]);

  const handleTest = useCallback(async () => {
    if (!testUrl.trim() || !activeClientId) return;
    setTestStatus("loading");
    setTestResult(null);
    setTestError("");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: testUrl.trim(), clientId: activeClientId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestStatus("error");
        setTestError(data.error ?? "Neznámá chyba");
      } else {
        setTestStatus("ok");
        setTestResult(data);
      }
    } catch (err) {
      setTestStatus("error");
      setTestError(String(err));
    }
  }, [testUrl, activeClientId]);

  return (
    <div className="min-h-full bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/nastaveni" className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs">
            <ArrowLeft size={13} /> Zpět
          </Link>
          <div className="w-px h-4 bg-gray-800" />
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-emerald-400" />
            <span className="text-sm font-semibold text-white">Scraping produktů</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Client selector */}
            <div className="relative">
              <button
                onClick={() => setClientOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white min-w-[140px]"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: currentClient?.color ?? "#6b7280" }} />
                <span className="truncate font-medium flex-1 text-left">{currentClient?.name ?? "Klient"}</span>
                <ChevronDown size={11} className={`text-gray-500 transition-transform ${clientOpen ? "rotate-180" : ""}`} />
              </button>
              {clientOpen && (
                <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-30 min-w-[160px] overflow-hidden">
                  {clients.map((c) => (
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
              onClick={handleSave}
              disabled={saving || !activeClientId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : savedOk ? <CheckCircle2 size={12} /> : <Save size={12} />}
              {saving ? "Ukládám…" : savedOk ? "Uloženo" : "Uložit"}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-10 pb-20 space-y-10">
        {/* ── Selectors ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-white">CSS selektory</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Definuj CSS selektory pro každé pole produktu. Systém nejprve zkusí JSON-LD a OpenGraph tagy
            — selektory mají nejvyšší prioritu a přepíší automaticky extrahovaná data.
          </p>

          {loadingConfig ? (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Loader2 size={14} className="animate-spin" /> Načítám konfigurace…
            </div>
          ) : (
            <div className="space-y-3">
              {config.fields.map((field) => {
                const canonical = CANONICAL_FIELDS.find((f) => f.key === field.key);
                const isCustom = !canonical;
                return (
                  <div key={field.key} className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-xl">
                    {/* Key label */}
                    <div className="w-36 flex-shrink-0">
                      {isCustom ? (
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => {
                            const newKey = e.target.value.toLowerCase().replace(/\s+/g, "_");
                            setConfig((prev) => ({
                              ...prev,
                              fields: prev.fields.map((f) => f.key === field.key ? { ...f, key: newKey } : f),
                            }));
                          }}
                          placeholder="nazev_pole"
                          className="w-full bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-white">{canonical.label}</p>
                          <p className="text-[10px] font-mono text-gray-600">{field.key}</p>
                        </div>
                      )}
                    </div>

                    {/* Selector */}
                    <input
                      type="text"
                      value={field.selector}
                      onChange={(e) => setFieldProp(field.key, "selector", e.target.value)}
                      placeholder="CSS selektor (např. h1.product-title)"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />

                    {/* Attr */}
                    <select
                      value={field.attr}
                      onChange={(e) => setFieldProp(field.key, "attr", e.target.value)}
                      className="w-28 bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {ATTR_OPTIONS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>

                    {/* Remove */}
                    {isCustom && (
                      <button
                        onClick={() => removeField(field.key)}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={addCustomField}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:text-white border border-dashed border-gray-700 hover:border-gray-500 rounded-xl transition-colors w-full justify-center"
              >
                <Plus size={12} /> Přidat vlastní pole
              </button>
            </div>
          )}
        </section>

        {/* ── Test ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={16} className="text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Test scrapingu</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Vlož URL produktu a otestuj, co systém extrahuje. Před testem ulož konfiguraci.
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="url"
              value={testUrl}
              onChange={(e) => { setTestUrl(e.target.value); setTestStatus("idle"); }}
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
              placeholder="https://www.eshop.cz/produkt/nazev-produktu"
              className="flex-1 bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
            />
            <button
              onClick={handleTest}
              disabled={testStatus === "loading" || !testUrl.trim() || !activeClientId}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all"
            >
              {testStatus === "loading"
                ? <><Loader2 size={14} className="animate-spin" /> Načítám…</>
                : <><Search size={14} /> Načíst produkt</>}
            </button>
          </div>

          {testStatus === "error" && (
            <div className="flex items-start gap-2 p-4 bg-red-950/40 border border-red-800/40 rounded-xl text-sm text-red-400">
              <XCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Chyba při načítání</p>
                <p className="text-xs text-red-500">{testError}</p>
              </div>
            </div>
          )}

          {testStatus === "ok" && testResult && (
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Extrahovaná data</span>
                <span className="ml-auto text-[10px] text-gray-600">{Object.keys(testResult).length} polí</span>
              </div>

              {Object.entries(testResult).filter(([k]) => k !== "url").map(([key, value]) => (
                <div key={key} className="flex gap-3">
                  <span className="text-[10px] font-mono text-gray-500 w-24 flex-shrink-0 pt-0.5">{key}</span>
                  {key === "image" ? (
                    <div className="flex-1 space-y-1">
                      <img src={value} alt="" className="h-20 w-full object-contain rounded border border-gray-700 bg-gray-800" />
                      <p className="text-[10px] text-gray-600 break-all">{value}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-white flex-1 break-words">{value}</p>
                  )}
                </div>
              ))}

              {testResult.url && (
                <div className="flex gap-3 border-t border-gray-800 pt-3">
                  <span className="text-[10px] font-mono text-gray-500 w-24 flex-shrink-0 pt-0.5">url</span>
                  <a href={testResult.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline break-all">{testResult.url}</a>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Help ──────────────────────────────────────────── */}
        <section className="p-5 bg-gray-900/50 border border-gray-800 rounded-2xl">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Jak to funguje</h3>
          <ol className="space-y-2 text-sm text-gray-500 list-decimal list-inside">
            <li>Systém nejprve hledá <span className="text-gray-300 font-mono text-xs">JSON-LD</span> data (schema.org/Product) — funguje automaticky pro Shopify, WooCommerce, Heureka…</li>
            <li>Fallback na <span className="text-gray-300 font-mono text-xs">OpenGraph</span> tagy (<code className="text-[11px]">og:title</code>, <code className="text-[11px]">og:image</code>…)</li>
            <li>CSS selektory definované zde mají <span className="text-white font-semibold">nejvyšší prioritu</span> — přepíší automaticky extrahovaná data.</li>
            <li>V editoru klikni na blok s typem <span className="text-orange-400">products</span>, vlož URL a stiskni <em>Načíst produkt</em>.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
