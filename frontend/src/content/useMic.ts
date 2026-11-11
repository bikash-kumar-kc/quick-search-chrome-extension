import { useEffect, useRef, useState } from "react";

export function useMic(onText: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState("");
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    const onMessage = (msg: { type: string; text?: string; error?: string }) => {
      if (msg.type !== "MIC_DONE") return;
      setRecording(false);

      if (msg.error === "not-allowed") {
        setMicError("Allow the microphone in the tab that just opened, then try again.");
      } else if (msg.error && !["no-speech", "aborted"].includes(msg.error)) {
        setMicError(`Mic error: ${msg.error}`);
      }
      if (msg.text) onTextRef.current(msg.text);
    };

    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  const toggle = async () => {
    if (!chrome.runtime?.id) {
      setMicError("Extension was reloaded. Please refresh this page.");
      return;
    }
    setMicError("");

    if (recording) {
      // stays "recording" until the result arrives, so the final text isn't lost
      await chrome.runtime.sendMessage({ type: "MIC_STOP" });
      return;
    }
    setRecording(true);
    await chrome.runtime.sendMessage({ type: "MIC_START" });
  };

  return { recording, micError, toggle };
}