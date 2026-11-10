import { useState } from "react";
import { RepeatPanel, ReferenceList } from "./RepeatPanel";
import {
  isSingleWord,
  touchEntry,
  addEntry,
  type WordEntry,
} from "./wordStore";
import { fetchGuess, fetchVariants } from "./wordApi";

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

  // const search = async () => {
  //   const q = query.trim();
  //   if (!q || status === "loading") return;

  //   setStatus("loading");
  //   try {
  //     const res = await chrome.runtime.sendMessage({
  //       type: "SEARCH",
  //       messageHistory:
  //         typeof messages === "undefined"
  //           ? [{ role: "user", content: q }]
  //           : [...messages, { role: "user", content: q }],
  //     });
  //     if (!res?.ok) throw new Error(res?.error ?? "No response");
  //     setAnswer(res.data.answer);
  //     updateMessage("user", q);
  //     updateMessage("assistant", res.data.answer);
  //     setStatus("done");
  //   } catch (e) {
  //     console.log(e);
  //     setError(JSON.stringify);
  //     setStatus("error");
  //   }
  // };

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

  return (
    <div
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onKeyPress={(e) => e.stopPropagation()}
      className="fixed right-4 top-1/2 z-[2147483647] flex max-h-[80vh] w-80 -translate-y-1/2 flex-col gap-3 rounded-lg  bg-[#191818]  p-4 text-gray-900 shadow-2xl transition-colors"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Quick Search</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded px-2 py-0.5 text-gray-500 hover:text-gray-50 hover:bg-red-700"
        >
          ✕
        </button>
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSearch();
          }
        }}
        rows={3}
        className="w-full resize-none rounded-md  p-2 text-md text-gray-200  bg-[#242222] outline-none focus:ring-1 focus:ring-gray-600"
      />

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
