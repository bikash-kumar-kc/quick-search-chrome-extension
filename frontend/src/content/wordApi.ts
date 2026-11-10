export async function fetchVariants(word: string): Promise<string[]> {
  try {
    const res = await chrome.runtime.sendMessage({ type: "VARIANTS", word });
    return res?.ok ? res.data.variants : [];
  } catch {
    return []; // a failed variants call must never block the main search
  }
}

export async function fetchGuess(word: string): Promise<string> {
  const res = await chrome.runtime.sendMessage({ type: "GUESS", word });
  if (!res?.ok) throw new Error(res?.error ?? "No response");
  return res.data.sentence;
}