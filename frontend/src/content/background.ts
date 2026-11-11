const BASE_URL = "https://quick-search-chrome-extension.onrender.com/api";
const EXTRA_ROUTES: Record<string, string> = {
  VARIANTS: "/variants",
  GUESS: "/guess",
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const path = EXTRA_ROUTES[msg.type];
  if (!path) return; // not ours, your SEARCH listener handles it

  fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word: msg.word }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      return res.json();
    })
    .then((data) => sendResponse({ ok: true, data }))
    .catch((err) => sendResponse({ ok: false, error: err.message }));

  return true;
});

chrome.runtime.onMessage.addListener(
  (
    msg: {
      type: "SEARCH";
      messageHistory: { role: "user" | "assistant"; content: string }[];
    },
    _sender,
    sendResponse: ({
      ok,
      data,
    }: {
      ok: boolean;
      data?: { answer: string };
      error?: string;
    }) => void,
  ) => {
    if (msg.type === "SEARCH") {
      fetch("https://quick-search-chrome-extension.onrender.com/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageHistory: msg.messageHistory }),
      })
        .then((res) => res.json())
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
    }

    return true;
  },
);


chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-search-card") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    // fails on pages with no content script (chrome://, Web Store), so ignore it
    chrome.tabs.sendMessage(tab.id, { type: "OPEN_CARD" }).catch(() => {});
  }
});
