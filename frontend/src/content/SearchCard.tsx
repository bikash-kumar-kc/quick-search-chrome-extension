import { useState } from "react";

type Props = { initialQuery: string; onClose: () => void };
type Status = "idle" | "loading" | "done" | "error";

export function SearchCard({ initialQuery, onClose }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<Status>("idle");
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
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <div
      // stop the website's keyboard shortcuts from firing while typing here
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onKeyPress={(e) => e.stopPropagation()}
      className="fixed right-4 top-1/2 z-[2147483647] flex max-h-[80vh] w-80 -translate-y-1/2 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Quick Search</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
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
        className="w-full resize-none rounded-lg border border-gray-300 p-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
      />

      <button
        onClick={search}
        disabled={status === "loading" || !query.trim()}
        className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {status === "loading" ? "Searching…" : "Search"}
      </button>

      {status !== "idle" && (
        <div className="min-h-[3rem] overflow-y-auto rounded-lg bg-gray-50 p-3 text-sm leading-relaxed">
          {status === "loading" && <p className="text-gray-500">Thinking…</p>}
          {status === "done" && <p className="whitespace-pre-wrap">{answer}</p>}
          {status === "error" && <p className="text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
