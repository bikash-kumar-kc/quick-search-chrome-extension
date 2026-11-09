// src/content/SearchPopup.tsx
type Props = { x: number; y: number; onClick: () => void };

export function SearchPopup({ x, y, onClick }: Props) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()} // keeps the text selected
      onClick={onClick}
      style={{ left: x, top: y + 8 }}
      className="fixed z-[2147483647] -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg hover:bg-indigo-500"
    >
      Search
      <span className="text-red-600">hey</span>
    </button>
  );
}