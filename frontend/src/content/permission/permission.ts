const status = document.getElementById("status")!;

document.getElementById("allow")!.addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    status.textContent = "Done. Close this tab and use the mic button.";
  } catch {
    status.textContent = "Blocked. Allow the microphone from the lock icon in the address bar, then retry.";
  }
});