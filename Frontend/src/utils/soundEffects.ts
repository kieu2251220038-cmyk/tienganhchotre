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

// Native Web Speech Synthesis for clear English pronunciation
export const speakEnglish = (text: string, rate: number = 0.85): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      // Khắc phục lỗi paused của Chrome
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel(); // Dừng câu đọc dở trước đó

      const clean = text.trim();
      let textToSpeak = clean;
      // Nếu là chữ cái đơn, đọc tên chữ cái chuẩn (A -> "ay", B -> "bee", ...)
      if (clean.length === 1 && /^[a-zA-Z]$/.test(clean)) {
        textToSpeak = LETTER_SPOKEN_MAP[clean.toUpperCase()] || clean;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = rate; // Tốc độ vừa phải cho bé nghe rõ
      utterance.pitch = 1.05; // Cao độ tự nhiên, thân thiện với trẻ em

      // Chọn giọng tiếng Anh chuẩn nếu có
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const preferredVoice = voices.find(
            (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('David') || v.name.includes('Zira'))
          ) || voices.find((v) => v.lang.startsWith('en'));
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }
      } catch {}

      activeUtterance = utterance;

      utterance.onend = () => {
        activeUtterance = null;
        resolve();
      };
      utterance.onerror = () => {
        activeUtterance = null;
        resolve();
      };

      // Delay 40ms để tránh xung đột lệnh cancel() bất đồng bộ trên Chrome
      window.setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          if (activeUtterance) {
            window.speechSynthesis.speak(activeUtterance);
          }
        } catch {
          resolve();
        }
      }, 40);
    } catch {
      resolve();
    }
  });
};
