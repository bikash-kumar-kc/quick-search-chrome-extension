import { useEffect, useRef, useState } from "react";

export type MicStatus = "idle" | "recording" | "transcribing";

export function useMic(onText: (text: string) => void) {
  const [status, setStatus] = useState<MicStatus>("idle");
  const [micError, setMicError] = useState("");
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    const onMessage = (msg: { type: string; text?: string; error?: string; status?: MicStatus }) => {
      if (msg.type === "MIC_STATUS" && msg.status) setStatus(msg.status);

      if (msg.type === "MIC_DONE") {
        setStatus("idle");
        if (msg.error === "not-allowed") {
          setMicError("Allow the microphone in the tab that just opened, then try again.");
        } else if (msg.error && !["no-speech", "aborted"].includes(msg.error)) {
          setMicError(`Mic error: ${msg.error}`);
        }
        if (msg.text) onTextRef.current(msg.text);
      }
    };

    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  const toggle = async () => {
    if (!chrome.runtime?.id) {
      setMicError("Extension was reloaded. Please refresh this page.");
      return;
    }
    if (status === "transcribing") return;
    setMicError("");

    if (status === "recording") {
      await chrome.runtime.sendMessage({ type: "MIC_STOP" });
      return;
    }
    setStatus("recording");
    await chrome.runtime.sendMessage({ type: "MIC_START" });
  };

  return { status, micError, toggle };
}