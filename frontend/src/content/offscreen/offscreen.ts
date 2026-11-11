const API_BASE = "http://localhost:8000/api"; // same as background.ts
const MAX_MS = 30_000;
const FALLBACK_ERRORS = ["network", "service-not-allowed", "language-not-supported"];

const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

type Session = {
  tabId: number;
  stream: MediaStream;
  recorder: MediaRecorder;
  chunks: Blob[];
  sr: any | null;
  srText: string;
  srError: string;
  stopRequested: boolean;
  useUpload: boolean; // true → transcribe the recording on the server
  timer: number;
};

let s: Session | null = null;
let srBroken = false; // remembered after the first speech-service failure

const send = (m: object) => chrome.runtime.sendMessage(m).catch(() => {});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "OFFSCREEN_MIC_START") start(msg.tabId);
  if (msg.type === "OFFSCREEN_MIC_STOP") requestStop();
});

async function start(tabId: number) {
  if (s) return;

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    send({ type: "OFFSCREEN_MIC_DONE", tabId, text: "", error: "not-allowed" });
    return;
  }

  const session: Session = {
    tabId,
    stream,
    recorder: new MediaRecorder(stream),
    chunks: [],
    sr: null,
    srText: "",
    srError: "",
    stopRequested: false,
    useUpload: false,
    timer: 0,
  };
  s = session;

  session.recorder.ondataavailable = (e) => {
    if (e.data.size) session.chunks.push(e.data);
  };

  session.recorder.onstop = () => {
    if (session.useUpload) upload(session);
  };

  session.recorder.start();

  session.timer = window.setTimeout(requestStop, MAX_MS);

  if (SR && !srBroken) startSpeech(session);

  else session.useUpload = true; // no usable speech service: record only

}

function startSpeech(session: Session) {
  const rec = new SR();
  session.sr = rec;
  rec.lang = "en-US";
  rec.continuous = true;
  rec.interimResults = false;

  rec.onresult = (e: any) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) session.srText += e.results[i][0].transcript + " ";
    }
  };

  rec.onerror = (e: any) => {
    session.srError = e.error;
  };
  rec.onend = () => {
    session.sr = null;

    if (FALLBACK_ERRORS.includes(session.srError)) {
      srBroken = true;
      session.useUpload = true; // keep recording, transcribe on the server
      if (session.stopRequested) stopRecorder(session);
      return;
    }
    // service worked (or the user was silent): use its text, discard the audio
    done(session, session.srText.trim(), session.srError);
  };

  try {
    rec.start();
  } catch {
    srBroken = true;
    session.sr = null;
    session.useUpload = true;
  }
}

function requestStop() {
  if (!s) return;
  s.stopRequested = true;
  if (s.sr) s.sr.stop(); // speech mode: onend decides what happens next
  else stopRecorder(s);
}

function stopRecorder(session: Session) {
  if (session.recorder.state !== "inactive") session.recorder.stop(); // → onstop → upload
}

async function upload(session: Session) {
  send({ type: "OFFSCREEN_MIC_STATUS", tabId: session.tabId, status: "transcribing" });
  try {
    const blob = new Blob(session.chunks, { type: session.recorder.mimeType });
    if (blob.size < 1000) return done(session, ""); // nothing was recorded

    const form = new FormData();
    form.append("audio", blob, "speech.webm");

    const res = await fetch(`${API_BASE}/transcribe`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const json = await res.json();
    done(session, String(json.data?.text ?? json.text ?? "").trim());
  } catch (e: any) {
    done(session, "", String(e?.message ?? "upload-failed"));
  }
}

function done(session: Session, text: string, error = "") {
  if (s !== session) return; // already finished
  clearTimeout(session.timer);
  session.useUpload = false;
  if (session.recorder.state !== "inactive") session.recorder.stop();
  session.stream.getTracks().forEach((t) => t.stop());
  s = null;
  send({ type: "OFFSCREEN_MIC_DONE", tabId: session.tabId, text, error });
}