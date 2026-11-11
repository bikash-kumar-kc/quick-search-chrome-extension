import { useEffect, useState } from "react";
import { getSentence, useTextSelection } from "./useTextSelection";
import { SearchCard } from "./SearchCard";
import { SearchPopup } from "./searchPopup";

export default function App() {
  const selection = useTextSelection();
  const [card, setCard] = useState<{
    id: number;
    query: string;
    sentence: string;
  } | null>(null);
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

  useEffect(() => {
    const onMessage = (msg: { type: string }) => {
      if (msg.type !== "OPEN_CARD") return;

      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      setCard({
        id: Date.now(),
        query: text,
        sentence: sel && text ? getSentence(sel, text) : "",
      });
    };

    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  return (
    <>
      {selection && (
        <SearchPopup
          x={selection.x}
          y={selection.y}
          onClick={() =>
            setCard({
              id: Date.now(),
              query: selection.text,
              sentence: selection.sentence,
            })
          }
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
