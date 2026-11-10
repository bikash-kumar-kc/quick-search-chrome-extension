const KEY = "wordHistory";
const MAX_ENTRIES = 20;

export type WordEntry = {
  keywords: string[];
  references: string[];
  source: string[];
  counts: number;
  lastTime: number;
};

export const normalize = (w: string) => w.trim().toLowerCase();

export const isSingleWord = (t: string) =>
  /^[\p{L}][\p{L}'’-]*$/u.test(t.trim());

async function load(): Promise<WordEntry[]> {
  const data = await chrome.storage.local.get(KEY);
  return (data[KEY] as WordEntry[] | undefined) ?? [];
}

const save = (list: WordEntry[]) => chrome.storage.local.set({ [KEY]: list });

// Known word: bump counts, remember the new sentence. Returns null if the word is new.
export async function touchEntry(
  word: string,
  sentence: string,
  url: string,
): Promise<WordEntry | null> {
  const list = await load();
  const w = normalize(word);
  const entry = list.find((e) => e.keywords.includes(w));
  if (!entry) return null;

  entry.counts += 1;
  entry.lastTime = Date.now();
  if (sentence && !entry.references.includes(sentence)) {
    entry.references.push(sentence);
    entry.source.push(url);
  }
  await save(list);
  return entry;
}

// New word: store it, then evict if over the limit.
export async function addEntry(
  word: string,
  variants: string[],
  sentence: string,
  url: string,
) {
  const list = await load();
  const entry: WordEntry = {
    keywords: [...new Set([word, ...variants].map(normalize))],
    references: sentence ? [sentence] : [],
    source: sentence ? [url] : [],
    counts: 1,
    lastTime: Date.now(),
  };
  list.push(entry);

  if (list.length > MAX_ENTRIES) {
    // lowest counts → oldest lastTime → first found. The new entry is never evicted.
    const victim = list
      .filter((e) => e !== entry)
      .reduce((a, b) =>
        b.counts < a.counts ||
        (b.counts === a.counts && b.lastTime < a.lastTime)
          ? b
          : a,
      );
    list.splice(list.indexOf(victim), 1);
  }
  await save(list);
}
