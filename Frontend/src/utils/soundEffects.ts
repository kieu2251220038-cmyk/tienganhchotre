// Web Audio API Synthesized Sound Effects (No external files needed)
class SoundManager {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play "Ding Ding" sound for correct answer
  playCorrect() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Note 1: E5 (659Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Note 2: G#5 (830Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(830.61, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch {
      // Audio autoplay might be blocked
    }
  }

  // Play gentle "Oops" sound for wrong answer
  playWrong() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio autoplay might be blocked
    }
  }

  // Play celebratory victory fanfare
  playVictory() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const time = (this.ctx?.currentTime || 0) + idx * 0.14;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(time);
        osc.stop(time + 0.4);
      });
    } catch {
      // Audio autoplay might be blocked
    }
  }

  // Play click sound
  playClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio autoplay might be blocked
    }
  }
}

export const sounds = new SoundManager();

// Giữ tham chiếu utterance ở cấp module để tránh bị Garbage Collector của Chrome dọn dẹp làm mất tiếng
let activeUtterance: SpeechSynthesisUtterance | null = null;

// Bảng phiên âm cách đọc tên chữ cái chuẩn bản ngữ (tránh TTS đọc chữ 'A' thành 'uh')
const LETTER_SPOKEN_MAP: Record<string, string> = {
  A: 'ay',
  B: 'bee',
  C: 'see',
  D: 'dee',
  E: 'ee',
  F: 'ef',
  G: 'gee',
  H: 'aitch',
  I: 'eye',
  J: 'jay',
  K: 'kay',
  L: 'el',
  M: 'em',
  N: 'en',
  O: 'oh',
  P: 'pee',
  Q: 'cue',
  R: 'ar',
  S: 'ess',
  T: 'tee',
  U: 'you',
  V: 'vee',
  W: 'double you',
  X: 'ex',
  Y: 'why',
  Z: 'zee'
};

// Đăng ký nạp sẵn voice cho Chrome/Edge
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    try {
      window.speechSynthesis.getVoices();
    } catch {}
  };
}

// Phiên đọc dùng chung: hủy phiên cũ cũng hủy các lệnh đang chờ phát.
let speechRequestId = 0;
const pendingSpeechTimers = new Set<number>();

export const cancelSpeech = (): void => {
  speechRequestId += 1;
  if (typeof window !== 'undefined') {
    pendingSpeechTimers.forEach((timer) => window.clearTimeout(timer));
  }
  pendingSpeechTimers.clear();
  activeUtterance = null;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
};

const speakWithVoice = (
  text: string,
  language: 'en-US' | 'vi-VN',
  rate: number,
  requestId: number
): Promise<void> => new Promise((resolve) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || requestId !== speechRequestId) {
    resolve();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const clean = text.trim();
    let textToSpeak = clean;

    if (language === 'en-US' && clean.length === 1 && /^[a-zA-Z]$/.test(clean)) {
      textToSpeak = LETTER_SPOKEN_MAP[clean.toUpperCase()] || clean;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = 1.05;

    try {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = language === 'en-US'
        ? voices.find((voice) => voice.lang.startsWith('en') && (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Samantha') || voice.name.includes('Jenny') || voice.name.includes('David') || voice.name.includes('Zira')))
          || voices.find((voice) => voice.lang.startsWith('en'))
        : voices.find((voice) => voice.lang.toLowerCase().startsWith('vi'));
      if (preferredVoice) utterance.voice = preferredVoice;
    } catch {}

    activeUtterance = utterance;
    const finish = () => {
      if (activeUtterance === utterance) activeUtterance = null;
      resolve();
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    window.setTimeout(() => {
      if (requestId !== speechRequestId || activeUtterance !== utterance) {
        resolve();
        return;
      }
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch {
        finish();
      }
    }, 40);
  } catch {
    resolve();
  }
});

// Tốc độ 1.0 nhanh hơn mức cũ nhưng vẫn rõ cho trẻ nghe.
export const speakEnglish = (text: string, rate: number = 1.0): Promise<void> => {
  const requestId = ++speechRequestId;
  return speakWithVoice(text, 'en-US', rate, requestId);
};

export const speakVietnamese = (text: string, rate: number = 1.0): Promise<void> => {
  const requestId = ++speechRequestId;
  return speakWithVoice(text, 'vi-VN', rate, requestId);
};

// Đọc tuần tự tiếng Anh trước, tiếng Việt sau.
export const speakBilingual = async (english: string, vietnamese: string, rate: number = 1.0): Promise<void> => {
  const requestId = ++speechRequestId;
  await speakWithVoice(english, 'en-US', rate, requestId);
  if (requestId !== speechRequestId || !vietnamese.trim()) return;
  await speakWithVoice(vietnamese, 'vi-VN', rate, requestId);
};

export const scheduleBilingual = (
  english: string,
  vietnamese: string,
  delay = 0,
  rate = 1.0
): number | null => {
  if (typeof window === 'undefined') return null;
  const timer = window.setTimeout(() => {
    pendingSpeechTimers.delete(timer);
    void speakBilingual(english, vietnamese, rate);
  }, delay);
  pendingSpeechTimers.add(timer);
  return timer;
};
