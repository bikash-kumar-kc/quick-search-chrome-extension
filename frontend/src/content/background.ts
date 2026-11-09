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
      fetch(import.meta.env.VITE_EXTERNAL_API, {
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
