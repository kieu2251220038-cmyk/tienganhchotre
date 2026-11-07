const VISUALS: Record<string, { emoji?: string; background: string; foreground: string }> = {
  apple: { emoji: '\u{1F34E}', background: '#FEF2F2', foreground: '#B91C1C' },
  banana: { emoji: '\u{1F34C}', background: '#FEF9C3', foreground: '#854D0E' },
  orange: { emoji: '\u{1F34A}', background: '#FFF7ED', foreground: '#C2410C' },
  mango: { emoji: '\u{1F96D}', background: '#FFF7ED', foreground: '#C2410C' },
  grape: { emoji: '\u{1F347}', background: '#FAF5FF', foreground: '#7E22CE' },
  pear: { emoji: '\u{1F350}', background: '#F7FEE7', foreground: '#3F6212' },
  watermelon: { emoji: '\u{1F349}', background: '#F0FDF4', foreground: '#166534' },
  strawberry: { emoji: '\u{1F353}', background: '#FFF1F2', foreground: '#BE123C' },
  ball: { emoji: '\u{26BD}', background: '#F8FAFC', foreground: '#334155' },
  cat: { emoji: '\u{1F431}', background: '#FFF7ED', foreground: '#9A3412' },
  dog: { emoji: '\u{1F436}', background: '#FFFBEB', foreground: '#92400E' },
  bird: { emoji: '\u{1F426}', background: '#EFF6FF', foreground: '#1D4ED8' },
  cow: { emoji: '\u{1F42E}', background: '#F8FAFC', foreground: '#334155' },
  duck: { emoji: '\u{1F986}', background: '#FEF9C3', foreground: '#854D0E' },
  fish: { emoji: '\u{1F41F}', background: '#ECFEFF', foreground: '#0E7490' },
  rabbit: { emoji: '\u{1F430}', background: '#FDF2F8', foreground: '#9D174D' },
  lion: { emoji: '\u{1F981}', background: '#FFF7ED', foreground: '#C2410C' },
  monkey: { emoji: '\u{1F435}', background: '#F5F5F4', foreground: '#57534E' },
  elephant: { emoji: '\u{1F418}', background: '#F1F5F9', foreground: '#475569' },
  red: { emoji: '\u{1F534}', background: '#FEF2F2', foreground: '#B91C1C' },
  blue: { emoji: '\u{1F535}', background: '#EFF6FF', foreground: '#1D4ED8' },
  yellow: { emoji: '\u{1F7E1}', background: '#FEFCE8', foreground: '#A16207' },
  green: { emoji: '\u{1F7E2}', background: '#F0FDF4', foreground: '#15803D' },
  pink: { emoji: '\u{1F338}', background: '#FDF2F8', foreground: '#BE185D' },
  purple: { emoji: '\u{1F7E3}', background: '#FAF5FF', foreground: '#7E22CE' },
  black: { emoji: '\u{26AB}', background: '#F8FAFC', foreground: '#0F172A' },
  white: { emoji: '\u{26AA}', background: '#F8FAFC', foreground: '#475569' },
  circle: { emoji: '\u{1F535}', background: '#EFF6FF', foreground: '#1D4ED8' },
  square: { emoji: '\u{1F7E6}', background: '#EFF6FF', foreground: '#1D4ED8' },
  triangle: { emoji: '\u{1F53A}', background: '#FFF7ED', foreground: '#C2410C' },
  star: { emoji: '\u{2B50}', background: '#FEF9C3', foreground: '#A16207' },
  one: { emoji: '1️⃣', background: '#EFF6FF', foreground: '#1D4ED8' },
  two: { emoji: '2️⃣', background: '#ECFDF5', foreground: '#047857' },
  three: { emoji: '3️⃣', background: '#FFF7ED', foreground: '#C2410C' },
  four: { emoji: '4️⃣', background: '#FDF2F8', foreground: '#BE185D' },
  five: { emoji: '5️⃣', background: '#FAF5FF', foreground: '#7E22CE' },
  six: { emoji: '6️⃣', background: '#F0FDFA', foreground: '#0F766E' },
  seven: { emoji: '7️⃣', background: '#FEF2F2', foreground: '#B91C1C' },
  eight: { emoji: '8️⃣', background: '#F0FDF4', foreground: '#166534' },
  nine: { emoji: '9️⃣', background: '#FFF7ED', foreground: '#9A3412' },
  ten: { emoji: '🔟', background: '#EFF6FF', foreground: '#1E40AF' },
  father: { emoji: '\u{1F468}', background: '#EFF6FF', foreground: '#1D4ED8' },
  mother: { emoji: '\u{1F469}', background: '#FDF2F8', foreground: '#BE185D' },
  sister: { emoji: '\u{1F467}', background: '#FDF2F8', foreground: '#9D174D' },
  brother: { emoji: '\u{1F466}', background: '#EFF6FF', foreground: '#1D4ED8' },
  head: { emoji: '\u{1F642}', background: '#FFF7ED', foreground: '#C2410C' },
  eyes: { emoji: '\u{1F440}', background: '#EFF6FF', foreground: '#1D4ED8' },
  nose: { emoji: '\u{1F443}', background: '#FDF2F8', foreground: '#BE185D' },
  mouth: { emoji: '\u{1F444}', background: '#FFF1F2', foreground: '#BE123C' },
  hands: { emoji: '\u{1F64C}', background: '#FFF7ED', foreground: '#C2410C' },
  happy: { emoji: '\u{1F600}', background: '#FEF9C3', foreground: '#A16207' },
  sad: { emoji: '\u{1F622}', background: '#EFF6FF', foreground: '#1D4ED8' },
  angry: { emoji: '\u{1F620}', background: '#FEF2F2', foreground: '#B91C1C' },
  tired: { emoji: '\u{1F634}', background: '#F5F3FF', foreground: '#6D28D9' },
  clap: { emoji: '\u{1F44F}', background: '#FFF7ED', foreground: '#C2410C' },
  jump: { emoji: '\u{1F938}', background: '#EFF6FF', foreground: '#1D4ED8' },
  wave: { emoji: '\u{1F44B}', background: '#ECFDF5', foreground: '#047857' },
  hello: { emoji: '\u{1F44B}', background: '#ECFDF5', foreground: '#047857' },
  goodbye: { emoji: '\u{1F44B}', background: '#FDF2F8', foreground: '#BE185D' },
  run: { emoji: '\u{1F3C3}', background: '#FEF2F2', foreground: '#B91C1C' },
  stop: { emoji: '\u{1F6D1}', background: '#FFF7ED', foreground: '#C2410C' },
  'turn around': { emoji: '\u{1F504}', background: '#F5F3FF', foreground: '#6D28D9' },
  'sit down': { emoji: '\u{1FA91}', background: '#F0FDFA', foreground: '#0F766E' },
  'stand up': { emoji: '\u{1F9D1}', background: '#EFF6FF', foreground: '#1D4ED8' },
  'wake up': { emoji: '\u{23F0}', background: '#FEF3C7', foreground: '#92400E' },
  'brush teeth': { emoji: '\u{1FAA5}', background: '#E0F2FE', foreground: '#0369A1' },
  'eat breakfast': { emoji: '\u{1F373}', background: '#FFF7ED', foreground: '#C2410C' },
  'go to school': { emoji: '\u{1F392}', background: '#FEF9C3', foreground: '#854D0E' },
  sunny: { emoji: '\u{2600}\u{FE0F}', background: '#FEF9C3', foreground: '#A16207' },
  rainy: { emoji: '\u{1F327}\u{FE0F}', background: '#EFF6FF', foreground: '#1D4ED8' },
  cloudy: { emoji: '\u{2601}\u{FE0F}', background: '#F1F5F9', foreground: '#475569' },
  windy: { emoji: '\u{1F32C}\u{FE0F}', background: '#ECFEFF', foreground: '#0E7490' },
  milk: { emoji: '\u{1F95B}', background: '#F8FAFC', foreground: '#475569' },
  bread: { emoji: '\u{1F35E}', background: '#FFF7ED', foreground: '#9A3412' },
  rice: { emoji: '\u{1F35A}', background: '#F8FAFC', foreground: '#475569' },
  egg: { emoji: '\u{1F95A}', background: '#FEF9C3', foreground: '#854D0E' },
  teacher: { emoji: '\u{1F469}\u{200D}\u{1F3EB}', background: '#FDF2F8', foreground: '#9D174D' },
  doctor: { emoji: '\u{1F9D1}\u{200D}\u{2695}\u{FE0F}', background: '#EFF6FF', foreground: '#1D4ED8' },
  farmer: { emoji: '\u{1F9D1}\u{200D}\u{1F33E}', background: '#F0FDF4', foreground: '#166534' },
  pilot: { emoji: '\u{1F9D1}\u{200D}\u{2708}\u{FE0F}', background: '#E0F2FE', foreground: '#0369A1' },
  tree: { emoji: '\u{1F333}', background: '#F0FDF4', foreground: '#166534' },
  river: { emoji: '\u{1F3DE}\u{FE0F}', background: '#ECFEFF', foreground: '#0E7490' },
  mountain: { emoji: '\u{26F0}\u{FE0F}', background: '#F1F5F9', foreground: '#475569' },
  forest: { emoji: '\u{1F332}', background: '#DCFCE7', foreground: '#166534' },
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[character] || character));
}

/**
 * Local, child-friendly fallback artwork. It keeps cards useful before a teacher
 * uploads a real image and prevents an unrelated dog image appearing for every word.
 */
export function getVocabularyFallbackImage(word: string) {
  const label = word.trim() || 'Word';
  const key = label.toLowerCase();
  const visual = VISUALS[key];
  const isLetter = /^[a-z]$/i.test(label);
  const emoji = visual?.emoji || (isLetter ? label.toUpperCase() : '\u{1F4D6}');
  const background = visual?.background || '#EFF6FF';
  const foreground = visual?.foreground || '#1D4ED8';
  const iconFontSize = isLetter ? 112 : 92;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
      <rect width="600" height="420" rx="36" fill="${background}"/>
      <circle cx="300" cy="180" r="120" fill="#FFFFFF" opacity="0.82"/>
      <text x="300" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="${iconFontSize}" font-weight="700">${emoji}</text>
      <text x="300" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="${foreground}">${escapeXml(label)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
