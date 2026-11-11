const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

let rec: any = null;
let transcript = "";
let error = "";
let tabId = 0;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "OFFSCREEN_MIC_START") start(msg.tabId);
  if (msg.type === "OFFSCREEN_MIC_STOP") rec?.stop();
});

function start(id: number) {
  if (rec) return;
  tabId = id;
  transcript = "";
  error = "";

  rec = new SR();
  rec.lang = "en-US";
  rec.continuous = true;
  rec.interimResults = false;

  rec.onresult = (e: any) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) transcript += e.results[i][0].transcript + " ";
    }
  };

  rec.onerror = (e: any) => {
    error = e.error;
  };
  
  rec.onend = () => {
    rec = null;
    // always reports back, so the card's button can never get stuck in "recording"
    chrome.runtime.sendMessage({
      type: "OFFSCREEN_MIC_DONE",
      tabId,
      text: transcript.trim(),
      error,
    });
  };

  rec.start();
}