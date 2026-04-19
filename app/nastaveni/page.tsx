"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Layers, Mail, Settings, Globe } from "lucide-react";

const adminModules = [
  {
    href: "/nastaveni/blocks",
    icon: Layers,
    label: "Správa bloků",
    description: "Nahrávej, upravuj a mazej HTML bloky pro jednotlivé klienty. Bloky se zobrazují v HTML Email Editoru.",
    color: "from-indigo-500 to-purple-600",
    tool: "HTML Email Editor",
    toolHref: "/editor",
  },
  {
    href: "/nastaveni/scraping",
    icon: Globe,
    label: "Scraping produktů",
    description: "Nakonfiguruj CSS selektory pro automatické načítání produktových informací z e-shopů. Každý klient má vlastní konfiguraci.",
    color: "from-emerald-500 to-teal-600",
    tool: "HTML Email Editor",
    toolHref: "/editor",
  },
];

export default function AdminPage() {
  return (
    <div className="min-h-full bg-gray-950">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs">
            <ArrowLeft size={13} />
            Zpět
          </Link>
          <div className="w-px h-4 bg-gray-800" />
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-white">Admin</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-14 pb-20">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white mb-2">Admin sekce</h1>
          <p className="text-gray-500 text-sm">Správa obsahu a nastavení nástrojů.</p>
        </div>

        <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Moduly</h2>
        <div className="grid gap-4">
          {adminModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.href} href={mod.href}>
                <div className="group flex items-start gap-5 p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-indigo-500/40 hover:bg-gray-900/80 hover:shadow-xl hover:shadow-indigo-900/10 transition-all cursor-pointer">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-white">{mod.label}</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">{mod.description}</p>
                    <div className="flex items-center gap-1.5">
                      <Mail size={11} className="text-indigo-400" />
                      <span className="text-xs text-indigo-400">Používá: </span>
                      <Link
                        href={mod.toolHref}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {mod.tool}
                      </Link>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-700 group-hover:text-indigo-400 flex-shrink-0 mt-1 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
