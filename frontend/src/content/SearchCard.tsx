import { useState } from "react";

type Props = { initialQuery: string; onClose: () => void };
type Status = "idle" | "loading" | "done" | "error";

export function SearchCard({ initialQuery, onClose }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<Status>("done");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const search = async () => {
    const q = query.trim();
    if (!q || status === "loading") return;
    // if (!chrome.runtime?.id) {
    //   setError("Extension was reloaded. Please refresh this page.");
    //   setStatus("error");
    //   return;
    // }

    setStatus("loading");
    try {
      const res = await chrome.runtime.sendMessage({
        type: "SEARCH",
        query: q,
      });
      if (!res?.ok) throw new Error(res?.error ?? "No response");
      setAnswer(res.data.answer);
      setStatus("done");
    } catch (e) {
      console.log(e);
      setError(JSON.stringify);
      setStatus("error");
    }
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
            search();
          }
        }}
        rows={3}
        className="w-full resize-none rounded-md  p-2 text-md text-gray-200  bg-[#242222] outline-none focus:ring-1 focus:ring-gray-600"
      />

      <button
        onClick={search}
        disabled={status === "loading" || !query.trim()}
        className="rounded-lg bg-[#2d2b2b] hover:bg-[#201f1f] py-2 text-sm font-medium text-white transition-all disabled:opacity-50"
      >
        {status === "loading" ? "Searching…" : "Search"}
      </button>

      {status !== "idle" && (
        <div className="min-h-[3rem] overflow-auto rounded-md bg-gray-300 py-1 px-2 text-sm leading-relaxed text-wrap">
          {status === "loading" && <p className="text-gray-500">Thinking…</p>}
          {status === "done" && <p className="whitespace-pre-wrap">{answer}</p>}
          {status === "error" && (
            <p className="text-red-600">
              {error.trim() ? error : "Failed to Generate Response"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
