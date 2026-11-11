import {
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
  useEffect,
  type MouseEvent,
} from "react";

export function useDrag(cardRef: RefObject<HTMLElement | null>) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [ready, setReady] = useState(false);

  const KEY = "cardOffset";
  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), max);

  const drag = useRef<{
    px: number;
    py: number;
    ox: number;
    oy: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("button")) return; // keep the close button clickable
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      px: e.clientX,
      py: e.clientY,
      ox: offset.x,
      oy: offset.y,
      // limits that keep the whole card inside the viewport
      minX: offset.x - rect.left,
      maxX: offset.x + (window.innerWidth - rect.right),
      minY: offset.y - rect.top,
      maxY: offset.y + (window.innerHeight - rect.bottom),
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const x = d.ox + e.clientX - d.px;
    const y = d.oy + e.clientY - d.py;
    setOffset({
      x: Math.min(Math.max(x, d.minX), d.maxX),
      y: Math.min(Math.max(y, d.minY), d.maxY),
    });
  };

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (drag.current) {
      chrome.storage?.local.set({ [KEY]: offset }).catch(() => {});
    }
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const reset = () => {
  setOffset({ x: 0, y: 0 });
  chrome.storage?.local.remove(KEY).catch(() => {});
};

  useEffect(() => {
  (async () => {
    try {
      const data = await chrome.storage.local.get(KEY);
      const saved = data[KEY] as { x: number; y: number } | undefined;
      const rect = cardRef.current?.getBoundingClientRect();
      if (saved && rect) {
        setOffset({
          x: clamp(saved.x, -rect.left, window.innerWidth - rect.right),
          y: clamp(saved.y, -rect.top, window.innerHeight - rect.bottom),
        });
      }
    } catch {
    }
    setReady(true); // show the card only after the position is applied
  })();
}, []);

  return {
  offset,
  ready,
  handleProps: {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onDoubleClick: (e: MouseEvent<HTMLElement>) => {
      if (!(e.target as HTMLElement).closest("button")) reset();
    },
  },
};
}
