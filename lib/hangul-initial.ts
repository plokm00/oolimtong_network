export const HANGUL_INITIALS = [
  'ㄱ',
  'ㄴ',
  'ㄷ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅅ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const;

export type HangulInitial = (typeof HANGUL_INITIALS)[number];

const HANGUL_ONSETS: HangulInitial[] = [
  'ㄱ',
  'ㄱ',
  'ㄴ',
  'ㄷ',
  'ㄷ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅂ',
  'ㅅ',
  'ㅅ',
  'ㅇ',
  'ㅈ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

export const getHangulInitial = (value: string): HangulInitial | null => {
  const firstCharacter = value.trim().charCodeAt(0);

  if (
    Number.isNaN(firstCharacter) ||
    firstCharacter < 0xac00 ||
    firstCharacter > 0xd7a3
  ) {
    return null;
  }

  return HANGUL_ONSETS[Math.floor((firstCharacter - 0xac00) / 588)];
};

export const getHangulInitialAnchorId = (initial: HangulInitial) =>
  `dictionary-initial-${HANGUL_INITIALS.indexOf(initial)}`;
