chrome.runtime.onMessage.addListener(
  (
    msg: { type: "SEARCH"; query: string },
    _sender,
    sendResponse: ({
      ok,
      data,
    }: {
      ok: boolean;
      data?: { answer: string };
      error?: string;
    }) => void
  ) => {
    if (msg.type === "SEARCH") {
      fetch(
        `http://localhost:8000/api/search?q=${encodeURIComponent(msg.query)}`
      )
        .then((res) => res.json())
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err) =>
          sendResponse({ ok: false, error: err.message })
        );

      return true;
    }
  }
);