import { useState } from "react";
import { useTextSelection } from "./useTextSelection";
import { SearchCard } from "./SearchCard";
import { SearchPopup } from "./searchPopup";

export default function App() {
  const selection = useTextSelection();
  const [card, setCard] = useState<{ id: number; query: string } | null>(null);

  return (
    <>
      {selection && (
        <SearchPopup
          x={selection.x}
          y={selection.y}
          onClick={() => setCard({ id: Date.now(), query: selection.text })}
        />
      )}
      {card && (
        <SearchCard
          key={card.id}
          initialQuery={card.query}
          onClose={() => setCard(null)}
        />
      )}
    </>
  );
}
