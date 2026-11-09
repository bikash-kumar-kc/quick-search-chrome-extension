type Props = { x: number; y: number; onClick: () => void };

export function SearchPopup({ x, y, onClick }: Props) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{ left: x + 8, top: y + 8 }}
      className="fixed z-[2147483647] -translate-x-1/2 rounded-lg bg-[#191818] px-3 py-1.5 text-md font-medium tracking-tight text-white shadow-sm hover:shadow-md hover:bg-[#2d2b2b] transition-colors"
    >
      Quick Search
    </button>
  );
}
