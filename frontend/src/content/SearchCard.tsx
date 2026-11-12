import { useState } from "react";
import { useDrag } from "./useDrag";
import { RepeatPanel, ReferenceList } from "./RepeatPanel";
import {
  isSingleWord,
  touchEntry,
  addEntry,
  type WordEntry,
} from "./wordStore";
import { fetchGuess, fetchVariants } from "./wordApi";
import { SpeakButton } from "./SpeechButton";
import { useLayoutEffect, useRef } from "react"; // add to your existing react import
import { Mic, Square, Loader2 } from "lucide-react";
import { useMic } from "./useMic";

type Panel = "answer" | "guess" | "refs";

type Props = {
  initialQuery: string;
  onClose: () => void;
  updateMessage: (role: "user" | "assistant", content: string) => void;
  messages: { role: "user" | "assistant"; content: string }[] | undefined;
  sentence: string;
};
type Status = "idle" | "loading" | "done" | "error";

export function SearchCard({
  initialQuery,
  onClose,
  updateMessage,
  messages,
  sentence,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<Status>("idle");
  const [answer, setAnswer] = useState("");
  //@ts-ignore
  const [error, setError] = useState("");

  const [repeat, setRepeat] = useState<WordEntry | null>(null);
  const [panel, setPanel] = useState<Panel>("answer");
  const [guessText, setGuessText] = useState("");

  const taRef = useRef<HTMLTextAreaElement>(null);

  const { status: micStatus, micError, toggle } = useMic((t) => setQuery(t));

  const cardRef = useRef<HTMLDivElement>(null);

  const { offset, ready, handleProps } = useDrag(cardRef);

  // only keep the page sentence if the (possibly edited) query is actually in it
  const referenceFor = (w: string) =>
    sentence.toLowerCase().includes(w.toLowerCase()) ? sentence : "";

  const runSearch = async (q: string, saveNew = false) => {
    setStatus("loading");
    try {
      const [res, variants] = await Promise.all([
        chrome.runtime.sendMessage({
          type: "SEARCH",
          messageHistory:
            typeof messages === "undefined"
              ? [{ role: "user", content: q }]
              : [...messages, { role: "user", content: q }],
        }),
        saveNew ? fetchVariants(q) : Promise.resolve<string[]>([]),
      ]);
      if (!res?.ok) throw new Error(res?.error ?? "No response");

      setAnswer(res.data.answer);
      updateMessage("user", q);
      updateMessage("assistant", res.data.answer);
      if (saveNew) await addEntry(q, variants, referenceFor(q), location.href);

      setPanel("answer");
      setStatus("done");
    } catch (e) {
      console.log(e);
      setStatus("error");
    }
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || status === "loading") return;
    setRepeat(null);

    // phrase → normal flow, nothing stored
    if (!isSingleWord(q) || !chrome.runtime?.id) return runSearch(q);

    const found = await touchEntry(q, referenceFor(q), location.href);
    if (found) {
      setRepeat(found);
      setStatus("idle"); // hide the old result until the user picks an option
      return;
    }
    runSearch(q, true); // new word: meaning + variants, then store
  };

  const guess = async () => {
    setStatus("loading");
    try {
      setGuessText(await fetchGuess(query.trim()));
      setPanel("guess");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const showExact = () => {
    setPanel("refs");
    setStatus("done");
  };

  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [query]);

  return (
    <div
      ref={cardRef}
      style={{
        translate: `${offset.x}px ${offset.y}px`,
        visibility: ready ? "visible" : "hidden",
      }}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onKeyPress={(e) => e.stopPropagation()}
      className="fixed right-4 top-1/2 z-[2147483647] flex max-h-[80vh] w-80 -translate-y-1/2 flex-col gap-3 rounded-lg  bg-[#191818]  p-4 text-gray-900 shadow-2xl transition-colors"
    >
      <div
        {...handleProps}
        title="Drag to move, double-click to reset"
        className="flex cursor-grab touch-none select-none items-center justify-between active:cursor-grabbing "
      >
        <h2 className="text-lg font-semibold text-gray-200">Quick Search</h2>
        <div className="flex flex-wrap gap-3">
          <SpeakButton text={query.trim()} />
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded px-2 py-0.5 text-gray-500 hover:text-gray-50 hover:bg-red-700"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSearch();
            }
          }}
          rows={1}
          className="w-full resize-none overflow-y-auto rounded-md bg-[#242222] p-2 text-gray-200 outline-none focus:ring-1 focus:ring-gray-600"
          placeholder="Enter you word..."
        />
        <button
          onClick={toggle}
          disabled={micStatus === "transcribing"}
          aria-label={
            micStatus === "recording" ? "Stop recording" : "Start recording"
          }
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-70 ${
            micStatus === "recording"
              ? "animate-pulse bg-red-600 text-white"
              : "bg-[#2d2b2b] text-gray-300 hover:bg-[#3a3737]"
          }`}
        >
          {micStatus === "recording" ? (
            <Square size={16} />
          ) : micStatus === "transcribing" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Mic size={18} />
          )}
        </button>
      </div>
      {micError && <p className="text-xs text-red-400">{micError}</p>}

      {repeat && (
        <RepeatPanel
          entry={repeat}
          onGuess={guess}
          onExact={showExact}
          onSearch={() => runSearch(query.trim())}
        />
      )}

      <button
        onClick={handleSearch}
        disabled={status === "loading" || !query.trim()}
        className="rounded-lg bg-[#2d2b2b] hover:bg-[#201f1f] py-2 text-sm font-medium text-white transition-all disabled:opacity-50"
      >
        {status === "loading" ? "Searching…" : "Search"}
      </button>

      {status !== "idle" && (
        <div className="min-h-[3rem] overflow-auto rounded-md bg-gray-300 py-1 px-2 text-sm leading-relaxed text-wrap">
          {status === "loading" && <p className="text-gray-500">Thinking…</p>}
          {status === "error" && (
            <p className="text-red-600">Failed to generate the response.</p>
          )}
          {status === "done" && panel === "answer" && (
            <p className="whitespace-pre-wrap">{answer}</p>
          )}
          {status === "done" && panel === "guess" && (
            <p className="whitespace-pre-wrap">{guessText}</p>
          )}
          {status === "done" && panel === "refs" && repeat && (
            <ReferenceList entry={repeat} />
          )}
        </div>
      )}
    </div>
  );
}
