"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

export default function PreviewPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const stored = localStorage.getItem(`preview:${id}`);
    if (stored) setHtml(stored);

    const onStorage = (e: StorageEvent) => {
      if (e.key === `preview:${id}` && e.newValue) setHtml(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id]);

  if (html === null) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f4f5f7", color: "#6b7280", fontFamily: "Arial, sans-serif", fontSize: 14 }}>
        Otevři newsletter v editoru a ulož jej pro zobrazení náhledu.
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      title="Email preview"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0, display: "block" }}
    />
  );
}
