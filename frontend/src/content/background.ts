const BASE_URL = "http://localhost:8000/api";
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
      fetch("http://localhost:8000/api/search", {
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

async function sendToOffscreen(message: object, tries = 10) {
  for (let i = 0; i < tries; i++) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch {
      await new Promise((r) => setTimeout(r, 150)); // page still starting
    }
  }
  throw new Error("Offscreen page did not respond");
}


chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-search-card") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    // fails on pages with no content script (chrome://, Web Store), so ignore it
    chrome.tabs.sendMessage(tab.id, { type: "OPEN_CARD" }).catch(() => {});
  }
});


async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: "src/content/offscreen/offscreen.html",
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: "Speech recognition for the search box",
  });
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "MIC_START") {
    const tabId = sender.tab?.id;
    if (!tabId) return;
    ensureOffscreen()
      .then(() => sendToOffscreen({ type: "OFFSCREEN_MIC_START", tabId }))
      .catch((e) =>
        chrome.tabs
          .sendMessage(tabId, { type: "MIC_DONE", text: "", error: String(e?.message ?? e) })
          .catch(() => {})
      );
  }

  if (msg.type === "MIC_STOP") {
    chrome.runtime.sendMessage({ type: "OFFSCREEN_MIC_STOP" }).catch(() => {});
  }

  if (msg.type === "OFFSCREEN_MIC_STATUS") {
  chrome.tabs
    .sendMessage(msg.tabId, { type: "MIC_STATUS", status: msg.status })
    .catch(() => {});
}

  if (msg.type === "OFFSCREEN_MIC_DONE") {
    chrome.tabs
      .sendMessage(msg.tabId, { type: "MIC_DONE", text: msg.text, error: msg.error })
      .catch(() => {});
    if (msg.error === "not-allowed") {
      chrome.tabs.create({ url: chrome.runtime.getURL("src/content/permission/permission.html") });
    }
  }
});