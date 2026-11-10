import type { WordEntry } from "./wordStore";

const btn =
  "rounded-md bg-[#2d2b2b] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#3a3737]";

type Props = {
  entry: WordEntry;
  onGuess: () => void;
  onExact: () => void;
  onSearch: () => void;
};

export function RepeatPanel({ entry, onGuess, onExact, onSearch }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-[#242222] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-200">You've searched this word before.</p>
        <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
          Seen {entry.counts}×
        </span>
      </div>
      <p className="text-xs text-gray-400">Try to recall its meaning first.</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={onGuess} className={btn}>Guess it</button>
        <button onClick={onExact} className={btn}>Exact sentences</button>
        <button onClick={onSearch} className={btn}>Search normally</button>
      </div>
    </div>
  );
}

export function ReferenceList({ entry }: { entry: WordEntry }) {
  if (entry.references.length === 0) {
    return <p className="text-gray-600">No saved sentences yet.</p>;
  }
  return (
    <ul className="list-disc space-y-3 pl-4">
      {entry.references.map((sentence, i) => (
        <li key={i}>
          <p>{sentence}</p>
          <a
            href={entry.source[i]}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-xs text-blue-700 underline"
          >
            {entry.source[i]}
          </a>
        </li>
      ))}
    </ul>
  );
}