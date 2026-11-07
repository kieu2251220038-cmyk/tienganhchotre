import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { sounds, speakEnglish } from '../../utils/soundEffects';
import { authService } from '../../services/authService';
import { progressService, type LessonRewardResult } from '../../services/progressService';
import { courseService } from '../../services/courseService';
import voiceService from '../../services/voiceService';
import openaiWhisperService from '../../services/openaiWhisperService';
import speakingSummaryService from '../../services/speakingSummaryService';
import type { PronunciationAttempt, SpeakingSummary } from '../../services/speakingSummaryService';
import FireworksCelebration from '../../components/FireworksCelebration';
import RewardPopup from '../../components/RewardPopup';

const PRONUNCIATION_PASS_SCORE = 70;

interface WordItem {
  id: number;
  word: string;
  meaning_vi: string;
  phonetic: string;
  emoji: string;
}

const AGE5_SENTENCES: Record<string, string> = {
  Father: 'This is my father.',
  Mother: 'This is my mother.',
  Sister: 'This is my sister.',
  Brother: 'This is my brother.',
  Head: 'This is my head.',
  Eyes: 'I have two eyes.',
  Nose: 'This is my nose.',
  Mouth: 'This is my mouth.',
  Hands: 'These are my hands.',
  Happy: 'I am happy.',
  Sad: 'I am sad.',
  Angry: 'I am angry.',
  Tired: 'I am tired.'
};

const AGE5_EMOJIS: Record<string, string> = {
  Father: '👨', Mother: '👩', Sister: '👧', Brother: '👦',
  Head: '🙂', Eyes: '👀', Nose: '👃', Mouth: '👄', Hands: '🙌',
  Happy: '😀', Sad: '😢', Angry: '😠', Tired: '😴'
};

const AGE6_SENTENCES: Record<string, string> = {
  Hello: 'Hello, my name is Anna.',
  Goodbye: 'Goodbye, see you soon.',
  'Good morning': 'Good morning, teacher.',
  'Good afternoon': 'Good afternoon, teacher.',
  Name: 'My name is Anna.',
  Age: 'I am six years old.',
  Six: 'I am six years old.',
  Friend: 'This is my friend.',
  Pencil: 'This is my pencil.',
  Notebook: 'I have a blue notebook.',
  Ruler: 'This is my ruler.',
  Eraser: 'This is my eraser.',
  What: 'What is this?',
  Color: 'What color is it?',
  This: 'This is a book.',
  That: 'That is a school bag.'
};

const AGE6_EMOJIS: Record<string, string> = {
  Hello: '👋', Goodbye: '👋', 'Good morning': '🌞', 'Good afternoon': '🌤️',
  Name: '🙋', Age: '🎂', Six: '6️⃣', Friend: '🧒',
  Pencil: '✏️', Notebook: '📓', Ruler: '📏', Eraser: '🧽',
  What: '❓', Color: '🎨', This: '📘', That: '🎒'
};

const AGE7_SENTENCES: Record<string, string> = {
  'Wake up': 'I wake up at seven.',
  'Brush teeth': 'I brush my teeth every morning.',
  'Eat breakfast': 'I eat breakfast in the morning.',
  'Go to school': 'I go to school every day.',
  Sunny: 'It is sunny today.',
  Rainy: 'It is rainy today.',
  Cloudy: 'It is cloudy today.',
  Windy: 'It is windy today.',
  Milk: 'I would like some milk.',
  Bread: 'I eat bread for breakfast.',
  Rice: 'I like rice.',
  Egg: 'I would like an egg.'
};

const AGE7_MEANINGS: Record<string, string> = {
  'Wake up': 'Tôi thức dậy lúc bảy giờ.',
  'Brush teeth': 'Tôi đánh răng mỗi buổi sáng.',
  'Eat breakfast': 'Tôi ăn sáng vào buổi sáng.',
  'Go to school': 'Tôi đi học mỗi ngày.',
  Sunny: 'Hôm nay trời có nắng.',
  Rainy: 'Hôm nay trời có mưa.',
  Cloudy: 'Hôm nay trời nhiều mây.',
  Windy: 'Hôm nay trời có gió.',
  Milk: 'Tôi muốn uống một ít sữa.',
  Bread: 'Tôi ăn bánh mì vào bữa sáng.',
  Rice: 'Tôi thích cơm.',
  Egg: 'Tôi muốn một quả trứng.'
};

const AGE7_EMOJIS: Record<string, string> = {
  'Wake up': '⏰', 'Brush teeth': '🪥', 'Eat breakfast': '🍳', 'Go to school': '🎒',
  Sunny: '☀️', Rainy: '🌧️', Cloudy: '☁️', Windy: '🌬️',
  Milk: '🥛', Bread: '🍞', Rice: '🍚', Egg: '🥚'
};

const AGE8_SENTENCES: Record<string, string> = {
  Teacher: 'A teacher helps children learn.',
  Doctor: 'A doctor helps sick people.',
  Farmer: 'A farmer grows food.',
  Pilot: 'A pilot flies an airplane.',
  Tree: 'The tree is tall and green.',
  River: 'The river flows through the forest.',
  Mountain: 'The mountain is high.',
  Forest: 'Many animals live in the forest.'
};

const AGE8_MEANINGS: Record<string, string> = {
  Teacher: 'Giáo viên giúp trẻ em học tập.',
  Doctor: 'Bác sĩ giúp những người bị bệnh.',
  Farmer: 'Nông dân trồng lương thực.',
  Pilot: 'Phi công lái máy bay.',
  Tree: 'Cây cao và xanh.',
  River: 'Dòng sông chảy qua khu rừng.',
  Mountain: 'Ngọn núi rất cao.',
  Forest: 'Nhiều loài động vật sống trong rừng.'
};

const AGE8_EMOJIS: Record<string, string> = {
  Teacher: '👩‍🏫', Doctor: '🧑‍⚕️', Farmer: '🧑‍🌾', Pilot: '🧑‍✈️',
  Tree: '🌳', River: '🏞️', Mountain: '⛰️', Forest: '🌲'
};

export default function SpeakingAI() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAge3 = searchParams.get('age') === '3';
  const isAge4 = searchParams.get('age') === '4';
  const isAge5 = searchParams.get('age') === '5';
  const isAge6 = searchParams.get('age') === '6';
  const isAge7 = searchParams.get('age') === '7';
  const isAge8 = searchParams.get('age') === '8';
  const lessonId = Number(searchParams.get('lessonId')) || 0;
  const topicId = Number(searchParams.get('topicId')) || 0;
  const [topicLessonItems, setTopicLessonItems] = useState<WordItem[]>([]);
  const lessonItems = topicLessonItems;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakingSample, setIsSpeakingSample] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [whisperEnabled, setWhisperEnabled] = useState(false);
  const [openAiWhisperEnabled, setOpenAiWhisperEnabled] = useState(false);
  const pronunciationAttemptsRef = useRef<PronunciationAttempt[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SpeakingSummary | null>(null);
  const [reward, setReward] = useState<LessonRewardResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    pronunciationAttemptsRef.current = [];
    setSessionSummary(null);
  }, [lessonId, topicId]);

  useEffect(() => {
    voiceService.getStatus().then((status) => {
      setWhisperEnabled(status.enabled);
    }).catch(() => {
      setWhisperEnabled(false);
    });

    openaiWhisperService.getStatus().then((status) => {
      setOpenAiWhisperEnabled(status.enabled);
    }).catch(() => {
      setOpenAiWhisperEnabled(false);
    });
  }, []);

  useEffect(() => () => {
    if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    setTopicLessonItems([]);
    setCurrentIndex(0);
    if ((!isAge3 && !isAge4 && !isAge5 && !isAge6 && !isAge7 && !isAge8) || !topicId) return;

    courseService.getVocabulariesByTopic(topicId).then((vocabularies) => {
      const topicItems = vocabularies
        .map((vocabulary) => {
          const rawWord = vocabulary.word.trim();
          if (isAge3 && !/^[A-Z]$/i.test(rawWord)) return null;
          const label = rawWord.charAt(0).toUpperCase() + rawWord.slice(1);
          return {
            id: vocabulary.id,
            word: isAge5
              ? AGE5_SENTENCES[label] || `I like ${rawWord.toLowerCase()}.`
              : isAge6
              ? AGE6_SENTENCES[label] || `This is my ${rawWord.toLowerCase()}.`
              : isAge7
              ? AGE7_SENTENCES[label] || `I like ${rawWord.toLowerCase()}.`
              : isAge8
              ? AGE8_SENTENCES[label] || `The ${rawWord.toLowerCase()} is important.`
              : rawWord.toUpperCase(),
            meaning_vi: isAge3
              ? `Chữ ${rawWord.toUpperCase()}`
              : isAge7
              ? AGE7_MEANINGS[label] || vocabulary.meaning_vi
              : isAge8
              ? AGE8_MEANINGS[label] || vocabulary.meaning_vi
              : vocabulary.meaning_vi,
            phonetic: vocabulary.phonetic || '',
            emoji: isAge5
              ? AGE5_EMOJIS[label] || '🌟'
              : isAge6
              ? AGE6_EMOJIS[label] || '💬'
              : isAge7
              ? AGE7_EMOJIS[label] || '📖'
              : isAge8
              ? AGE8_EMOJIS[label] || '🌍'
              : rawWord.toUpperCase()
          };
        })
        .filter((item): item is WordItem => item !== null);

      if (topicItems.length > 0) {
        setTopicLessonItems(topicItems);
      }
    }).catch(() => {
      // Không dùng dữ liệu mẫu nếu Backend chưa có từ vựng cho chủ đề.
    });
  }, [isAge3, isAge4, isAge5, isAge6, isAge7, isAge8, topicId]);

  const currentItem = lessonItems[currentIndex] || lessonItems[0];
  if (!currentItem) {
    return (
      <div className="card-kid" style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎙️</div>
        <h2 style={{ color: '#1E293B', marginBottom: '10px' }}>Chưa có nội dung bài nói</h2>
        <p style={{ color: '#64748B', lineHeight: 1.6 }}>
          Vui lòng tạo từ vựng trong đúng chủ đề và mở bài nói từ Lộ trình học.
        </p>
        <button type="button" onClick={() => navigate('/dashboard')} className="btn-kid btn-primary" style={{ marginTop: '16px', padding: '12px 24px' }}>
          Về Lộ Trình Học
        </button>
      </div>
    );
  }
  const targetLabel = isAge3
    ? `chữ ${currentItem.word}`
    : isAge4
    ? `từ "${currentItem.word}"`
    : isAge5 || isAge6 || isAge7 || isAge8
    ? `câu "${currentItem.word}"`
    : `từ ${currentItem.word}`;

  const handleListenSample = () => {
    sounds.playClick();
    setIsSpeakingSample(true);
    speakEnglish(currentItem.word).finally(() => {
      setIsSpeakingSample(false);
    });
  };

  const calculateSimilarity = (target: string, spoken: string): number => {
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/[đĐ]/g, 'd')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const levenshteinDistance = (left: string, right: string): number => {
      const matrix = Array.from({ length: left.length + 1 }, (_, row) => {
        const values = new Array<number>(right.length + 1).fill(0);
        values[0] = row;
        return values;
      });

      for (let column = 0; column <= right.length; column++) matrix[0][column] = column;
      for (let row = 1; row <= left.length; row++) {
        for (let column = 1; column <= right.length; column++) {
          matrix[row][column] = left[row - 1] === right[column - 1]
            ? matrix[row - 1][column - 1]
            : Math.min(
              matrix[row - 1][column - 1] + 1,
              matrix[row][column - 1] + 1,
              matrix[row - 1][column] + 1
            );
        }
      }

      return matrix[left.length][right.length];
    };

    const similarity = (left: string, right: string): number => {
      if (!left || !right) return 0;
      const distance = levenshteinDistance(left, right);
      return Math.round((1 - distance / Math.max(left.length, right.length)) * 100);
    };

    const targetText = normalize(target);
    const spokenText = normalize(spoken);
    if (!spokenText) return 0;

    // Chương trình 3 tuổi học tên chữ cái. Các bí danh này xử lý cả cách
    // đọc chuẩn và những mẫu Chrome/Edge thường chuyển nhầm thành văn bản.
    if (targetText.length === 1 && /^[a-z]$/.test(targetText)) {
      const letterNames: Record<string, string[]> = {
        a: ['a', 'ay'],
        b: ['b', 'bee', 'be', 'bi'],
        c: ['c', 'see', 'sea', 'si'],
        d: ['d', 'dee', 'di'],
        e: ['e', 'ee'],
        f: ['f', 'ef', 'eff'],
        g: ['g', 'gee', 'ji'],
        h: ['h', 'aitch'],
        i: ['i', 'eye'],
        j: ['j', 'jay'],
        k: ['k', 'kay'],
        l: ['l', 'el', 'ell'],
        m: ['m', 'em'],
        n: ['n', 'en'],
        o: ['o', 'oh'],
        p: ['p', 'pee', 'pi'],
        q: ['q', 'cue', 'queue', 'kyu'],
        r: ['r', 'are', 'ar'],
        s: ['s', 'ess', 'es'],
        t: ['t', 'tee', 'ti'],
        u: ['u', 'you', 'yu'],
        v: ['v', 'vee', 'vi'],
        w: ['w', 'double you', 'double u'],
        x: ['x', 'ex', 'eks'],
        y: ['y', 'why', 'wai'],
        z: ['z', 'zee', 'zed']
      };

      const aliases = (letterNames[targetText] || [targetText]).map(normalize).filter(Boolean);
      const compactSpoken = spokenText.replace(/\s+/g, '');
      const repeatedLetterMatch = compactSpoken.match(/^([a-z])\1+$/);
      const acceptedAliases = [
        ...aliases,
        `letter ${targetText}`,
        `the letter ${targetText}`,
        ...aliases.map((alias) => `${alias} ${alias}`)
      ];

      if (repeatedLetterMatch && (aliases.includes(repeatedLetterMatch[1]) || repeatedLetterMatch[1] === targetText)) return 100;
      if (acceptedAliases.includes(spokenText)) return 100;
      return 0;
    }

    if (targetText === spokenText) return 100;

    const targetWords = targetText.split(' ');
    const spokenWords = spokenText.split(' ');
    const wordAliases: Record<string, string[]> = {
      a: ['a', 'uh'],
      an: ['an', 'a', 'un'],
      are: ['are', 'r'],
      be: ['be', 'bee', 'b'],
      c: ['c', 'see', 'sea'],
      four: ['four', 'for'],
      i: ['i', 'eye', 'ai'],
      is: ['is', 'iz'],
      my: ['my', 'mai'],
      one: ['one', 'won'],
      see: ['see', 'sea', 'c'],
      seven: ['seven', 'sevin'],
      six: ['six', 'siks'],
      that: ['that', 'dat'],
      the: ['the', 'thuh'],
      to: ['to', 'two', 'too'],
      two: ['two', 'to', 'too'],
      what: ['what', 'wut'],
      why: ['why', 'y'],
      you: ['you', 'u']
    };

    const isWordMatch = (targetWord: string, spokenWord: string): boolean => {
      if (targetWord === spokenWord) return true;
      if ((wordAliases[targetWord] || []).includes(spokenWord)) return true;
      if (targetWord.length < 4 || spokenWord.length < 4) return false;
      return similarity(targetWord, spokenWord) >= 72;
    };

    const matchedWords = targetWords.filter((targetWord) =>
      spokenWords.some((spokenWord) => isWordMatch(targetWord, spokenWord))
    );
    const coverage = matchedWords.length / Math.max(targetWords.length, 1);
    const precision = matchedWords.length / Math.max(spokenWords.length, 1);
    const wordScore = Math.round((coverage * 70) + (precision * 30));

    // Với một từ ngắn, dùng khoảng cách ký tự để bắt lỗi đánh máy của trình duyệt;
    // với câu dài, điểm dựa trên số từ đúng để không chấm sai cả câu vì dấu câu.
    const characterScore = targetWords.length === 1 ? similarity(targetText, spokenText) : 0;
    return Math.max(wordScore, characterScore);
  };

  const getPronunciationFeedback = (target: string, transcript: string, label: string): string => {
    const normalizedTarget = target.trim().toLowerCase();
    const normalizedTranscript = transcript
      .toLowerCase()
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (normalizedTarget === 'd') {
      if (/^(e|ee|eee|i|yee)$/.test(normalizedTranscript)) {
        return 'Bé đã phát âm được phần “ee” nhưng đang thiếu âm đầu /d/. Hãy đọc chậm: /d/ + “ee” = “dee” (đii).';
      }
      if (/^(b|be|bee|bi|bye)$/.test(normalizedTranscript)) {
        return 'Bé đang bật âm /b/ thay vì /d/. Hãy đặt đầu lưỡi chạm nhẹ phía sau răng trên, bật “d”, rồi kéo dài “ee”: “dee”.';
      }
      if (/^(m|me|mee|em)$/.test(normalizedTranscript)) {
        return 'Whisper nghe nhầm âm /d/ thành /m/. Hãy bật đầu lưỡi nhẹ như âm “d”, không khép môi như âm “m”, rồi đọc “dee” hoặc “di”.';
      }
    }

    return `Đọc chưa đúng. Bé đang học ${label} nhưng hệ thống nghe được “${transcript}”. Bé hãy nói lại nhé! 💪`;
  };

  const savePronunciationAttempt = (attemptScore: number, recognized: string): void => {
    const attempt: PronunciationAttempt = {
      index: currentIndex,
      word: currentItem.word,
      recognized: recognized.trim(),
      score: Math.max(0, Math.min(100, Math.round(attemptScore))),
      correct: attemptScore >= PRONUNCIATION_PASS_SCORE
    };
    const nextAttempts = [
      ...pronunciationAttemptsRef.current.filter((item) => item.index !== currentIndex),
      attempt
    ].sort((left, right) => left.index - right.index);
    pronunciationAttemptsRef.current = nextAttempts;
  };

  const createSpeakingSummary = (): SpeakingSummary => {
    const attempts = lessonItems.map((item, index) => pronunciationAttemptsRef.current.find((entry) => entry.index === index) || {
      index,
      word: item.word,
      recognized: '',
      score: 0,
      correct: false
    });
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const user = authService.getCurrentUser();
    const summary: SpeakingSummary = {
      userId: user?.id || 0,
      lessonId,
      topicId,
      completedAt: new Date().toISOString(),
      totalWords: attempts.length,
      averageScore: attempts.length > 0 ? Math.round(totalScore / attempts.length) : 0,
      correctCount: attempts.filter((attempt) => attempt.correct).length,
      incorrectCount: attempts.filter((attempt) => !attempt.correct).length,
      attempts
    };
    void speakingSummaryService.save(summary).catch((error) => {
      console.error('Không thể lưu tổng kết luyện nói lên Backend:', error);
    });
    return summary;
  };

  const applyTranscriptResult = (
    transcript: string,
    stopRecording: () => void,
    phonemeScore: number | null = null
  ) => {
    const cleanTranscript = transcript.trim();
    if (!cleanTranscript) return;

    // Luôn hiển thị đúng transcript trình duyệt trả về, không tự đổi thành đáp án mẫu.
    setRecognizedText(cleanTranscript);
    const textScore = calculateSimilarity(currentItem.word, cleanTranscript);
    const matchScore = typeof phonemeScore === 'number'
      ? Math.min(textScore, Math.round(phonemeScore))
      : textScore;
    setScore(matchScore);
    savePronunciationAttempt(matchScore, cleanTranscript);

    if (matchScore >= PRONUNCIATION_PASS_SCORE) {
      sounds.playVictory();
      setCelebrationKey((key) => key + 1);
      setShowCelebration(true);
      setAiFeedback('Tuyệt đỉnh! Giọng của bé chuẩn như người bản ngữ! ⭐');
      stopRecording();
    } else {
      sounds.playWrong();
      if (currentItem.word.trim().toLowerCase() === 'd') {
        setAiFeedback(getPronunciationFeedback(currentItem.word, cleanTranscript, targetLabel));
        return;
      }
      setAiFeedback(`Đọc chưa đúng. Bé đang học ${targetLabel} nhưng trình duyệt nghe được "${cleanTranscript}". Bé hãy nói lại nhé! 💪`);
    }
  };

  const startWhisperRecording = (stream: MediaStream) => {
    const supportedMimeTypes = ['audio/webm;codecs=opus', 'audio/webm'];
    const mimeType = supportedMimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    audioChunksRef.current = [];
    mediaRecorderRef.current = recorder;
    mediaStreamRef.current = stream;

    recorder.onstart = () => {
      setIsRecording(true);
      setRecognizedText('Đang ghi âm, bé hãy đọc thật rõ...');
      setScore(null);
      setAiFeedback('');
    };

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    recorder.onerror = () => {
      setIsRecording(false);
      mediaRecorderRef.current = null;
      stream.getTracks().forEach((track) => track.stop());
      setScore(0);
      savePronunciationAttempt(0, '');
      setRecognizedText('');
      setAiFeedback('Không ghi được âm thanh. Bé hãy kiểm tra micro rồi thử lại nhé!');
      sounds.playWrong();
    };

    recorder.onstop = async () => {
      if (recordingTimerRef.current !== null) {
        window.clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      stream.getTracks().forEach((track) => track.stop());

      const chunks = audioChunksRef.current;
      audioChunksRef.current = [];
      const audioBlob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
      setIsRecording(false);

      if (audioBlob.size === 0) {
        setScore(0);
        savePronunciationAttempt(0, '');
        setRecognizedText('');
        setAiFeedback('Không có âm thanh được ghi lại. Bé hãy nói sau khi micro bắt đầu nghe nhé!');
        sounds.playWrong();
        return;
      }

      setRecognizedText(openAiWhisperEnabled
        ? 'OpenAI Whisper API đang nhận diện...'
        : 'Whisper cục bộ đang nhận diện...');
      try {
        let result: Awaited<ReturnType<typeof voiceService.transcribe>>;
        if (openAiWhisperEnabled) {
          try {
            result = await openaiWhisperService.transcribe(audioBlob, currentItem.word);
          } catch (cloudError: unknown) {
            if (!whisperEnabled) throw cloudError;
            setRecognizedText('OpenAI Whisper API lỗi, đang thử Whisper cục bộ...');
            result = await voiceService.transcribe(audioBlob, currentItem.word);
          }
        } else {
          result = await voiceService.transcribe(audioBlob, currentItem.word);
        }
        if (result.text.trim()) {
          applyTranscriptResult(result.text, () => undefined, result.phonemeScore ?? null);
        } else {
          setScore(0);
          savePronunciationAttempt(0, '');
          setRecognizedText('');
          setAiFeedback('Whisper cục bộ không nghe rõ âm thanh. Bé hãy nói to, chậm và thử lại nhé!');
          sounds.playWrong();
        }
      } catch (error: unknown) {
        setScore(0);
        savePronunciationAttempt(0, '');
        setRecognizedText('');
        const message = error instanceof Error ? error.message : 'Whisper cục bộ không thể xử lý âm thanh.';
        setAiFeedback(message);
        sounds.playWrong();
      }
    };

    // Ghi một WebM hoàn chỉnh để PyAV/faster-whisper đọc được ổn định trên Chrome/Edge.
    // Backend đã có lượt thử lại không dùng VAD cho các âm đơn rất ngắn.
    recorder.start();
    const wordCount = currentItem.word.trim().split(/\s+/).filter(Boolean).length;
    const recordingDuration = wordCount === 1 ? 3000 : 5000;
    recordingTimerRef.current = window.setTimeout(() => {
      if (mediaRecorderRef.current === recorder && recorder.state === 'recording') recorder.stop();
    }, recordingDuration);
  };

  const handleToggleRecord = async () => {
    sounds.playClick();

    if (isRecording) {
      if (recordingTimerRef.current !== null) {
        window.clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    if (!openAiWhisperEnabled && !whisperEnabled) {
      setScore(0);
      setRecognizedText('');
      setAiFeedback('Chưa có bộ nhận diện giọng nói. Hãy cấu hình OpenAI Whisper API hoặc Whisper cục bộ trong Backend/.env nhé.');
      sounds.playWrong();
      return;
    }

    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setScore(0);
      setRecognizedText('');
      setAiFeedback('Trình duyệt chưa hỗ trợ ghi âm. Bé hãy dùng Chrome hoặc Edge trên localhost/HTTPS nhé.');
      sounds.playWrong();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          // Giữ lại phụ âm đầu ngắn /d/; bộ lọc của trình duyệt đôi khi làm mất âm này.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      startWhisperRecording(stream);
    } catch (error: unknown) {
      const errorName = error instanceof DOMException ? error.name : '';
      setScore(0);
      setRecognizedText('');
      setAiFeedback(
        errorName === 'NotAllowedError'
          ? 'Micro đang bị chặn. Bé hãy chọn Cho phép (Allow) trên thanh địa chỉ trình duyệt.'
          : errorName === 'NotFoundError'
          ? 'Không tìm thấy micro. Bé hãy kiểm tra micro của máy tính.'
          : 'Không mở được micro. Bé hãy đóng ứng dụng khác đang dùng micro rồi thử lại.'
      );
      sounds.playWrong();
    }
  };

  const handleNextWord = async () => {
    sounds.playClick();
    // Không chặn bé sang từ tiếp theo khi phát âm sai; điểm và phản hồi vẫn được lưu trên màn hình.
    if (currentIndex < lessonItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setRecognizedText('');
      setScore(null);
      setAiFeedback('');
    } else if (!sessionSummary) {
      const summary = createSpeakingSummary();
      setSessionSummary(summary);
      if (summary.userId > 0) {
        try {
          const result = await progressService.completeLesson(summary.userId, lessonId, summary.averageScore);
          if (result) setReward(result);
        } catch (error) {
          console.error('Không thể lưu hoàn thành bài nói:', error);
        }
      }
    } else {
      navigate(isAge3 || isAge4 || isAge5 || isAge6 || isAge7 || isAge8 ? '/dashboard' : '/rewards');
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <FireworksCelebration
        visible={showCelebration}
        eventKey={celebrationKey}
        onDone={() => setShowCelebration(false)}
      />
      {reward && (
        <RewardPopup
          reward={reward}
          lessonTitle="Hoàn thành Luyện Nói AI"
          onContinue={() => { setReward(null); navigate('/dashboard'); }}
          onClose={() => setReward(null)}
        />
      )}
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '16px 24px',
        borderRadius: '20px',
        border: '2px solid #E2E8F0',
        boxShadow: '0 4px 0 #E2E8F0'
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-kid btn-outline"
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          ← Trở Về
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
            {isAge3
              ? '🔤 Nhận diện chữ cái A-Z'
              : isAge4
              ? '🔢 Luyện nói số và hình dạng'
              : isAge5
              ? '💬 Luyện nói câu ngắn'
              : isAge6
              ? '👋 Luyện giao tiếp và hỏi đáp'
              : isAge7
              ? '📖 Đọc và nói về cuộc sống hằng ngày'
              : isAge8
              ? '🚀 Đọc và mô tả nghề nghiệp, thiên nhiên'
              : '🎙️ Luyện Phát Âm Trí Tuệ Nhân Tạo (AI)'}
          </div>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
            Từ số {currentIndex + 1} / {lessonItems.length}
          </div>
        </div>

        <button
          onClick={handleListenSample}
          disabled={isSpeakingSample}
          className="btn-kid btn-primary"
          style={{ padding: '8px 16px', fontSize: '14px', opacity: isSpeakingSample ? 0.75 : 1 }}
        >
          {isSpeakingSample ? '🔊 Đang đọc...' : '🔊 Nghe Mẫu'}
        </button>
      </div>

      {/* ================= U08 - MÀN HÌNH LUYỆN PHÁT ÂM ================= */}
      <div className="card-kid" style={{ textAlign: 'center', padding: '36px 24px' }}>
        {/* Word Card */}
        <div style={{ fontSize: '84px', marginBottom: '8px' }}>
          {currentItem.emoji}
        </div>

        <h1 style={{ fontSize: '48px', color: '#1E293B', marginBottom: '4px' }}>
          {currentItem.word}
        </h1>

        <div style={{ fontSize: '18px', color: '#64748B', fontFamily: 'monospace', marginBottom: '8px' }}>
          {currentItem.phonetic}
        </div>

        <div style={{ fontSize: '20px', color: '#2563EB', fontWeight: 700, marginBottom: '20px' }}>
          {currentItem.meaning_vi}
        </div>

        {/* Nút nghe mẫu to, rõ ràng ngay giữa màn hình */}
        <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            onClick={handleListenSample}
            disabled={isSpeakingSample}
            className={`btn-kid btn-primary ${isSpeakingSample ? 'animate-pulse-glow' : ''}`}
            style={{
              padding: '12px 28px',
              fontSize: '17px',
              fontWeight: 800,
              backgroundColor: isSpeakingSample ? '#2563EB' : '#0284C7',
              boxShadow: isSpeakingSample ? '0 4px 0 #1D4ED8' : '0 4px 0 #0369A1',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '999px',
              cursor: isSpeakingSample ? 'wait' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '24px' }}>🔊</span>
            <span>{isSpeakingSample ? 'Đang đọc mẫu cho bé nghe...' : 'Bấm vào đây để nghe phát âm mẫu'}</span>
          </button>
        </div>

        <div style={{ margin: '-12px auto 20px', maxWidth: '500px', padding: '10px 14px', borderRadius: '12px', backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', color: '#1D4ED8', fontSize: '14px', fontWeight: 700 }}>
          {isAge3
            ? '🎙️ Bé hãy đọc tên chữ cái bằng tiếng Anh. Ví dụ: chữ A đọc là “ay”.'
            : isAge4
            ? `🎙️ Bé hãy đọc số hoặc tên hình bằng tiếng Anh: “${currentItem.word}”`
            : isAge5
            ? `💬 Bé hãy nói câu: “${currentItem.word}”`
            : isAge6
            ? `🗣️ Bé hãy nói câu hoặc câu hỏi: “${currentItem.word}”`
            : isAge7
            ? `📖 Bé hãy đọc và nói câu: “${currentItem.word}”`
            : isAge8
            ? `🚀 Bé hãy đọc và nói câu mô tả: “${currentItem.word}”`
            : '🎙️ Bé hãy đọc từ tiếng Anh thật rõ nhé.'}
        </div>

        {isAge3 && currentItem.word.trim().toUpperCase() === 'D' && (
          <div style={{ margin: '-12px auto 20px', maxWidth: '500px', padding: '10px 14px', borderRadius: '12px', backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', color: '#166534', fontSize: '14px', fontWeight: 700 }}>
            Chữ D có thể đọc là “dee” hoặc “di”: bật âm /d/ trước, rồi kéo dài “ee”.
          </div>
        )}

        <div style={{ margin: '-8px auto 16px', color: openAiWhisperEnabled || whisperEnabled ? '#047857' : '#B45309', fontSize: '13px', fontWeight: 700 }}>
          {openAiWhisperEnabled
            ? '☁️ Đang chấm bằng OpenAI Whisper API'
            : whisperEnabled
            ? '🖥️ Đang chấm bằng Whisper cục bộ'
            : '⚠️ Chưa sẵn sàng bộ nhận diện giọng nói'}
        </div>

        {/* Big Animated Microphone Button */}
        <div style={{ margin: '24px 0' }}>
          <button
            onClick={handleToggleRecord}
            className={isRecording ? 'animate-pulse-glow' : ''}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: isRecording ? '#EF4444' : '#58CC02',
              color: '#FFFFFF',
              border: '6px solid #FFFFFF',
              boxShadow: isRecording ? '0 8px 0 #DC2626, 0 0 20px rgba(239, 68, 68, 0.6)' : '0 8px 0 #46A302',
              fontSize: '44px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isRecording ? '⏹️' : '🎙️'}
          </button>
          <div style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '16px',
            fontWeight: 700,
            color: isRecording ? '#DC2626' : '#64748B',
            marginTop: '12px'
          }}>
            {isRecording ? 'Đang lắng nghe bé nói (Chạm micro để chấm ngay)...' : 'Chạm vào micro để nói'}
          </div>
        </div>

        {/* AI Result & Feedback Box */}
        {score !== null && (
          <div style={{
            marginTop: '24px',
            backgroundColor: score >= PRONUNCIATION_PASS_SCORE ? '#DCFCE7' : '#FEF3C7',
            border: `2.5px solid ${score >= PRONUNCIATION_PASS_SCORE ? '#86EFAC' : '#FDE68A'}`,
            borderRadius: '24px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '32px' }}>{score >= PRONUNCIATION_PASS_SCORE ? '🌟' : '💡'}</span>
              <span style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '28px',
                fontWeight: 800,
                color: score >= PRONUNCIATION_PASS_SCORE ? '#166534' : '#92400E'
              }}>
                Độ chuẩn xác: {score}%
              </span>
            </div>

            <div style={{ fontSize: '15px', color: '#4B5563', fontWeight: 600, marginBottom: '6px' }}>
              Giọng bé nói nhận diện được: <strong>"{recognizedText}"</strong>
            </div>

            <div style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              color: score >= PRONUNCIATION_PASS_SCORE ? '#15803D' : '#B45309'
            }}>
              {aiFeedback}
            </div>

            {score === 0 && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#475569', backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', textAlign: 'left', lineHeight: 1.5 }}>
                💡 <strong>Nếu trình duyệt chưa nghe được giọng bé:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: '20px' }}>
                  <li>Kiểm tra xem biểu tượng 🔒 hoặc 🎙️ trên thanh địa chỉ trình duyệt có đang <strong>Cho phép (Allow)</strong> micro không.</li>
                  <li>Bé hãy bấm nút xanh <strong>"🔊 Bấm vào đây để nghe phát âm mẫu"</strong> ở trên, nghe cách đọc mẫu của <strong>"{currentItem.word}"</strong> rồi bấm Micro nói lại to, rõ nhé.</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {sessionSummary && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #86EFAC',
          borderRadius: '24px',
          padding: '22px',
          boxShadow: '0 4px 0 #BBF7D0'
        }}>
          <h2 style={{ margin: '0 0 14px', textAlign: 'center', color: '#166534', fontFamily: 'Fredoka, sans-serif' }}>
            🎉 Tổng kết luyện nói
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '18px' }}>
            <div><strong style={{ display: 'block', fontSize: '24px', color: '#2563EB' }}>{sessionSummary.averageScore}%</strong><span>Điểm trung bình</span></div>
            <div><strong style={{ display: 'block', fontSize: '24px', color: '#16A34A' }}>{sessionSummary.correctCount}</strong><span>Từ đúng</span></div>
            <div><strong style={{ display: 'block', fontSize: '24px', color: '#DC2626' }}>{sessionSummary.incorrectCount}</strong><span>Từ cần luyện</span></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessionSummary.attempts.map((attempt) => (
              <div key={`${attempt.index}-${attempt.word}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', backgroundColor: attempt.correct ? '#F0FDF4' : '#FFF7ED', color: '#334155', fontSize: '13px' }}>
                <span><strong>{attempt.word}</strong> → {attempt.recognized || 'chưa nhận diện'}</span>
                <span style={{ color: attempt.correct ? '#15803D' : '#C2410C', fontWeight: 800 }}>{attempt.score}%</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate(isAge3 || isAge4 || isAge5 || isAge6 || isAge7 || isAge8 ? '/dashboard' : '/rewards')}
            className="btn-kid btn-primary"
            style={{ width: '100%', marginTop: '18px', padding: '12px' }}
          >
            Về lộ trình học →
          </button>
        </div>
      )}

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
        <button
          onClick={() => {
            setScore(null);
            setRecognizedText('');
            setAiFeedback('');
            void handleToggleRecord();
          }}
          className="btn-kid btn-outline"
          style={{ flex: 1, padding: '14px' }}
        >
          🎙️ Nói Lại
        </button>

        <button
          onClick={handleNextWord}
          className="btn-kid btn-primary"
          style={{ flex: 1.5, padding: '14px', fontSize: '1.1rem' }}
        >
          {score !== null && score < PRONUNCIATION_PASS_SCORE && false
            ? '🎙️ Nói lại để tiếp tục'
            : currentIndex === lessonItems.length - 1
              ? '🏆 Xem Thành Tích'
              : 'Từ Tiếp Theo →'}
        </button>
      </div>
    </div>
  );
}
