import { useState } from "react";
import { useTextSelection } from "./useTextSelection";
import { SearchCard } from "./SearchCard";
import { SearchPopup } from "./searchPopup";

export default function App() {
  const selection = useTextSelection();
  const [card, setCard] = useState<{ id: number; query: string; sentence: string } | null>(null);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[] | undefined
  >(undefined);

  const handleMessageChange = (role: "user" | "assistant", content: string) => {
    if (role === "user" || role === "assistant" || content?.trim()) {
      if (!messages) {
        setMessages(() => [{ role, content }]);
      } else {
        //@ts-ignore
        setMessages((prevs) => [...prevs, { role, content }]);
      }
    }
  };

  const clearMessage = () => setMessages(undefined);

  return (
    <>
      {selection && (
        <SearchPopup
          x={selection.x}
          y={selection.y}
          onClick={() => setCard({ id: Date.now(), query: selection.text, sentence: selection.sentence })}
        />
      )}
      {card && (
        <SearchCard
          key={card.id}
          initialQuery={card.query}
          onClose={() => {
            setCard(null);
            clearMessage();
          }}
          updateMessage={handleMessageChange}
          messages={messages}
          sentence={card.sentence}
        />
      )}
    </>
  );
}
