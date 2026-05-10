let warmedUp = false;

export function warmUpTTS(): void {
  if (warmedUp) return;
  if (typeof speechSynthesis === 'undefined') return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  u.lang = 'de-DE';
  speechSynthesis.speak(u);
  warmedUp = true;
}

export function speak(text: string, rate = 0.9): void {
  if (typeof speechSynthesis === 'undefined') return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = rate;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
