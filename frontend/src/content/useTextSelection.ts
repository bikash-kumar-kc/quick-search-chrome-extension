// src/content/useTextSelection.ts
import { useEffect, useState } from "react";

const HOST_ID = "quick-search-root";

export type SelectionInfo = { text: string; x: number; y: number };

export function useTextSelection() {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);

  useEffect(() => {
    const isOurs = (e: Event) => (e.target as HTMLElement)?.id === HOST_ID;

    const onMouseUp = (e: MouseEvent) => {
      if (isOurs(e)) return;

      // wait a tick so the browser finalizes the selection
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (!sel || !text) return setSelection(null);
        const wordCount = text.split(/\s+/).length;
        if (wordCount > 10) return setSelection(null);

        const rect = sel.getRangeAt(0).getBoundingClientRect();
        setSelection({ text, x: rect.left + rect.width / 2, y: rect.bottom });
      }, 0);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!isOurs(e)) setSelection(null);
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  return selection;
}
