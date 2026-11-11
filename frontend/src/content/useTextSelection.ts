import { useEffect, useState } from "react";

const HOST_ID = "quick-search-root";

export type SelectionInfo = {
  text: string;
  x: number;
  y: number;
  sentence: string;
};

export function getSentence(sel: Selection, text: string): string {
  const block = sel.anchorNode?.parentElement?.closest(
    "p, li, td, blockquote, h1, h2, h3, h4, h5, h6, div",
  );
  const full = (block?.textContent ?? "").replace(/\s+/g, " ");
  const i = full.indexOf(text);
  if (i === -1) return "";

  const before = Math.max(
    full.lastIndexOf(". ", i),
    full.lastIndexOf("? ", i),
    full.lastIndexOf("! ", i),
  );
  const ends = [". ", "? ", "! "]
    .map((p) => full.indexOf(p, i + text.length))
    .filter((n) => n !== -1);
  const end = ends.length ? Math.min(...ends) + 1 : full.length;

  return full
    .slice(before === -1 ? 0 : before + 2, end)
    .trim()
    .slice(0, 300);
}

export function useTextSelection() {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);

  // get sentence where the word exist.

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
        // setSelection({ text, x: rect.left + rect.width / 2, y: rect.bottom });
        setSelection({
          text,
          x: rect.left + rect.width / 2,
          y: rect.bottom,
          sentence: getSentence(sel, text),
        });
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
