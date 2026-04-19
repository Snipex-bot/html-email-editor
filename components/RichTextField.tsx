"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bold, Italic, Underline, Link as LinkIcon, X, type LucideIcon } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function RichTextField({ value, onChange, placeholder = "", rows = 2 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const savedRange = useRef<Range | null>(null);
  // prevent re-syncing while user types
  const isInternalChange = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  const handleInput = useCallback(() => {
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML ?? "");
  }, [onChange]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const execFormat = (cmd: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const handleLinkOpen = () => {
    saveSelection();
    setLinkUrl("https://");
    setShowLinkInput(true);
  };

  const handleLinkInsert = () => {
    restoreSelection();
    if (linkUrl && linkUrl !== "https://") {
      document.execCommand("createLink", false, linkUrl);
      // make links open in new tab
      editorRef.current?.querySelectorAll("a").forEach((a) => {
        a.setAttribute("target", "_blank");
      });
    }
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML ?? "");
    setShowLinkInput(false);
  };

  const minHeight = `${rows * 1.6}rem`;

  return (
    <div className="group/rich relative">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 mb-1 opacity-40 group-focus-within/rich:opacity-100 transition-opacity">
        <ToolBtn icon={Bold} title="Tučné (Ctrl+B)" onClick={() => execFormat("bold")} />
        <ToolBtn icon={Italic} title="Kurzíva (Ctrl+I)" onClick={() => execFormat("italic")} />
        <ToolBtn icon={Underline} title="Podtržení (Ctrl+U)" onClick={() => execFormat("underline")} />
        <div className="w-px h-3.5 bg-gray-700 mx-0.5" />
        <ToolBtn icon={LinkIcon} title="Vložit odkaz" onClick={handleLinkOpen} />
        {showLinkInput && (
          <div className="flex items-center gap-1 ml-1 bg-gray-800 border border-indigo-500 rounded-md px-2 py-0.5">
            <input
              autoFocus
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLinkInsert();
                if (e.key === "Escape") setShowLinkInput(false);
              }}
              className="bg-transparent text-[10px] text-white w-32 focus:outline-none placeholder-gray-600"
              placeholder="https://example.com"
            />
            <button onClick={handleLinkInsert} className="text-indigo-400 hover:text-white text-[10px] font-bold">OK</button>
            <button onClick={() => setShowLinkInput(false)} className="text-gray-600 hover:text-white">
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none transition-colors leading-relaxed"
        style={{ minHeight, wordBreak: "break-word" }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #374151;
          pointer-events: none;
        }
        [contenteditable] a { color: #818cf8; text-decoration: underline; }
        [contenteditable] strong, [contenteditable] b { font-weight: bold; }
        [contenteditable] em, [contenteditable] i { font-style: italic; }
        [contenteditable] u { text-decoration: underline; }
      `}</style>
    </div>
  );
}

function ToolBtn({ icon: Icon, title, onClick }: { icon: LucideIcon, title: string, onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
    >
      <Icon size={11} />
    </button>
  );
}
