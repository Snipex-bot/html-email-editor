import Link from "next/link";
import { Mail, Settings, ArrowRight, Layers, Sparkles, Lock } from "lucide-react";

const tools = [
  {
    href: "/editor",
    icon: Mail,
    label: "HTML Email Editor",
    description: "Vizuální editor HTML e-mailových šablon s knihovnou bloků a živým náhledem.",
    color: "from-indigo-500 to-purple-600",
    badge: "Dostupné",
    badgeColor: "bg-green-900/50 text-green-400 border-green-700/50",
    available: true,
  },
  {
    href: null,
    icon: Sparkles,
    label: "AI Generátor",
    description: "Generuj e-mailové šablony pomocí AI na základě zadaného briefu.",
    color: "from-amber-500 to-orange-600",
    badge: "Brzy",
    badgeColor: "bg-gray-800 text-gray-500 border-gray-700",
    available: false,
  },
  {
    href: null,
    icon: Layers,
    label: "Šablony",
    description: "Předdefinované šablony pro různé typy kampaní — newsletter, promo, transakční.",
    color: "from-teal-500 to-cyan-600",
    badge: "Brzy",
    badgeColor: "bg-gray-800 text-gray-500 border-gray-700",
    available: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-full bg-gray-950">
      {/* Top nav */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Mail size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">Email Tools</span>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-all border border-gray-700 hover:border-gray-600"
          >
            <Settings size={13} />
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-900/40 border border-indigo-700/50 text-xs text-indigo-300 mb-6">
          <Sparkles size={11} />
          Sada nástrojů pro tvorbu e-mailů
        </div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
          Email Tools
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
          Profesionální nástroje pro tvorbu, správu a odesílání HTML e-mailů.
          Vše na jednom místě.
        </p>
      </div>

      {/* Tools grid */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const card = (
              <div
                className={`group relative flex flex-col gap-4 p-6 rounded-2xl border transition-all duration-200 ${
                  tool.available
                    ? "bg-gray-900 border-gray-800 hover:border-indigo-500/50 hover:bg-gray-900/80 hover:shadow-xl hover:shadow-indigo-900/20 cursor-pointer"
                    : "bg-gray-900/40 border-gray-800/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white mb-1.5">{tool.label}</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
                </div>
                {tool.available && (
                  <div className="flex items-center gap-1 text-xs text-indigo-400 font-medium mt-auto group-hover:gap-2 transition-all">
                    Otevřít <ArrowRight size={12} />
                  </div>
                )}
                {!tool.available && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-auto">
                    <Lock size={11} /> Připravujeme
                  </div>
                )}
              </div>
            );
            return tool.available && tool.href ? (
              <Link key={tool.label} href={tool.href}>{card}</Link>
            ) : (
              <div key={tool.label}>{card}</div>
            );
          })}
        </div>

        {/* Admin card */}
        <div className="mt-6">
          <Link href="/admin">
            <div className="group flex items-center justify-between p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-600 hover:bg-gray-900/80 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center">
                  <Settings size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Admin sekce</p>
                  <p className="text-xs text-gray-500">Správa klientů, bloků a nastavení nástrojů</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
