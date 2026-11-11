import { Volume2 } from "lucide-react";

export function speak(text: string, lang = "en-US") {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel(); // stop anything already playing
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

export function SpeakButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => speak(text)}
      aria-label="Pronounce"
      className="rounded px-2 py-0.5 text-gray-400 hover:bg-[#2d2b2b] hover:text-gray-50"
    >
      <Volume2 size={16} />
    </button>
  );
}
