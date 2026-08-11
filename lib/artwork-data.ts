import artworkRecords from "@/data/ninnik-artworks.generated.json";

export interface ArtworkEntry {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  category: string;
  categories: string[];
  series?: string;
  year: string;
  medium: string;
  mediumEn: string;
  dimensions: string;
  description: string;
  descriptionEn: string;
  bodyHtml: string;
  thumbnailUrl: string;
  previewUrl: string;
  images: {
    id: string;
    url: string;
    fullUrl?: string;
    alt: string;
  }[];
  relatedWordIds: string[];
  sourceUrl: string;
  archiveUrl: string;
}

type ImportedArtworkEntry = Omit<ArtworkEntry, "categories">;

const CATEGORY_OVERRIDES: Record<string, string[]> = {
  "artwork-9504": ["공공예술·협력프로젝트", "설치·융복합매체"],
  "artwork-9216": ["공공예술·협력프로젝트", "영상·퍼포먼스"],
  "artwork-9146": ["설치·융복합매체", "회화·드로잉"],
  "artwork-9091": ["설치·융복합매체", "회화·드로잉"],
  "artwork-8285": ["설치·융복합매체"],
  "artwork-7103": ["설치·융복합매체"],
  "artwork-6850": ["회화·드로잉", "그래픽·출판"],
  "artwork-1219": ["그래픽·출판"],
  "artwork-7128": ["그래픽·출판"],
  "artwork-6679": ["회화·드로잉"],
  "artwork-7116": ["회화·드로잉"],
  "artwork-7107": ["그래픽·출판"],
  "artwork-8088": ["영상·퍼포먼스"],
  "artwork-7015": ["회화·드로잉"],
  "artwork-9305": ["그래픽·출판"],
  "artwork-7147": ["자료·기록"],
};

function getCategories(artwork: ImportedArtworkEntry) {
  const override = CATEGORY_OVERRIDES[artwork.id];
  if (override) return override;
  if (artwork.category === "설치·복합매체") return ["설치·융복합매체"];
  if (artwork.category === "복합매체") return ["자료·기록"];
  return [artwork.category];
}

export const ARTWORKS: ArtworkEntry[] = (
  artworkRecords as ImportedArtworkEntry[]
).map((artwork) => {
  const categories = getCategories(artwork);
  return {
    ...artwork,
    category: categories[0],
    categories,
  };
});

export interface ExhibitionEntry {
  id: string;
  type: "개인전" | "단체전·기획전" | "공공예술·협력프로젝트";
  year: string;
  period?: string;
  title: string;
  venue: string;
  artworkIds: string[];
}

export const EXHIBITIONS: ExhibitionEntry[] = [
  {
    id: "solo-conceptual-ninnik-10",
    type: "개인전",
    year: "2024",
    period: "09.28–10.27",
    title: "컨셉추얼 니닉 10 — 공간니닉",
    venue: "니닉크라프트, 강원",
    artworkIds: [],
  },
  {
    id: "solo-this-too-shall-pass",
    type: "개인전",
    year: "2024",
    period: "02.24–05.25",
    title: "지·나·가·길",
    venue: "전·진·상 영성센터, 서울",
    artworkIds: [],
  },
  {
    id: "solo-conceptual-ninnik-9",
    type: "개인전",
    year: "2023",
    period: "04.26–09.30",
    title: "컨셉추얼 니닉 9 — 구전, 빛처럼 퍼지는 이야기",
    venue: "한향림도자미술관, 경기",
    artworkIds: ["artwork-9573"],
  },
  {
    id: "solo-conceptual-ninnik-8",
    type: "개인전",
    year: "2022",
    period: "05.01–05.31",
    title: "컨셉추얼 니닉 8 — 궁리된 흠과 틈",
    venue: "자미갤러리, 서울",
    artworkIds: [],
  },
  {
    id: "solo-artist-picture-bookshop",
    type: "개인전",
    year: "2021",
    title: "예술가의 그림책방 — 캐릭터×캐릭터×캐릭터",
    venue: "니닉크라프트, 강원",
    artworkIds: [],
  },
  {
    id: "solo-storytelling-artist-bookshop",
    type: "개인전",
    year: "2019",
    period: "12.02–12.15",
    title: "이야기 들려주는 예술가의 책방",
    venue: "문막 예술가책방, 강원",
    artworkIds: [],
  },
  {
    id: "solo-conceptual-ninnik-7",
    type: "개인전",
    year: "2018",
    period: "06.02–06.12",
    title: "컨셉추얼 니닉 7 — 니닉향",
    venue: "파비욘드갤러리, 경기",
    artworkIds: [],
  },
  {
    id: "solo-conceptual-ninnik-6",
    type: "개인전",
    year: "2018",
    period: "04.12–05.13",
    title: "컨셉추얼 니닉 6 — 선수상",
    venue: "포네티브 스페이스, 경기",
    artworkIds: ["artwork-9146", "artwork-9091"],
  },
  {
    id: "solo-conceptual-ninnik-5",
    type: "개인전",
    year: "2016",
    period: "04.04–04.23",
    title: "컨셉추얼 니닉 5 — 니닉 크라프트",
    venue: "니닉크라프트, 강원",
    artworkIds: ["artwork-8142"],
  },
  {
    id: "solo-conceptual-ninnik-4",
    type: "개인전",
    year: "2013",
    period: "08.24–09.06",
    title: "컨셉추얼 니닉 4 — 프리마 비스타: 원형, 최초의 인상",
    venue: "갤러리 지지향, 경기",
    artworkIds: [],
  },
  {
    id: "solo-conceptual-ninnik-3-1",
    type: "개인전",
    year: "2012",
    period: "08.15–08.21",
    title: "컨셉추얼 니닉 3.1 — 빌 니닉",
    venue: "KCDF 갤러리, 서울",
    artworkIds: [
      "artwork-7135",
      "artwork-7128",
      "artwork-6679",
    ],
  },
  {
    id: "solo-conceptual-ninnik-3-0",
    type: "개인전",
    year: "2012",
    period: "08.15–08.21",
    title: "컨셉추얼 니닉 3.0 — 다큐, 수직적이고 병렬적인 세계",
    venue: "KCDF 갤러리, 서울",
    artworkIds: [
      "artwork-6682",
      "artwork-7131",
    ],
  },
  {
    id: "solo-conceptual-ninnik-2",
    type: "개인전",
    year: "2010",
    period: "03.03–03.09",
    title: "컨셉추얼 니닉 2 — 예고편, 서사우주",
    venue: "인사갤러리, 서울",
    artworkIds: [],
  },
  {
    id: "solo-conceptual-ninnik-1",
    type: "개인전",
    year: "2009",
    period: "02.18–02.24",
    title: "컨셉추얼 니닉 1 — 이야기는 나무에서 자란다",
    venue: "갤러리 이즈, 서울",
    artworkIds: [],
  },
  {
    id: "solo-conceptual-ninnik-0",
    type: "개인전",
    year: "2007",
    title: "컨셉추얼 니닉 0 — The Artisan Fair",
    venue: "University of Adelaide, Australia",
    artworkIds: ["artwork-7137"],
  },
  {
    id: "group-ark-adventure",
    type: "단체전·기획전",
    year: "2014",
    title: "아크-어드벤처",
    venue: "클레이아크김해미술관, 경남",
    artworkIds: ["artwork-6697"],
  },
  {
    id: "project-ecosystem-munmak",
    type: "공공예술·협력프로젝트",
    year: "2022",
    title: "생태계 레지던시 in 문막",
    venue: "아트팩토리 후, 강원",
    artworkIds: ["artwork-9458"],
  },
  {
    id: "project-resonant-tale",
    type: "공공예술·협력프로젝트",
    year: "2019",
    period: "01.23–01.27",
    title: "ART & VR — 울림통 프로젝트",
    venue: "광교경기문화창조허브, 경기",
    artworkIds: ["artwork-9216"],
  },
];

export interface RelatedWord {
  id: string;
  word: string;
  indexNumber: number;
  category: string;
  description: string;
}

export const RELATED_WORDS: RelatedWord[] = [
  {
    id: "word-seed-5",
    word: "네골",
    indexNumber: 5,
    category: "도구·장치",
    description:
      "빌가와의 무기. 강렬한 붉은빛을 내며, 현재 단달계의 모든 생물과 반생물의 구조에 효력을 미친다. 아직은 미완성이지만 빌가와 고리의 능력을 한데 모은 소수 세력이 네골의 개발을 계속하고 있다.",
  },
  {
    id: "word-seed-8",
    word: "니닉",
    indexNumber: 8,
    category: "세계·장소",
    description:
      "아직 정해진 뜻이 없다. 어떤 뜻도 될 수 있음을 의미하기도 한다. 나중에 님벨이 세운 나라도 니닉이라 불리며, 니닉의 주도는 니말다라가 된다.",
  },
  {
    id: "word-seed-16",
    word: "둔가라",
    indexNumber: 16,
    category: "세계·장소",
    description: "번개. 니말다라에 지어진 끝이 보이지 않을 만큼 높은 벽돌 탑.",
  },
  {
    id: "word-seed-41",
    word: "슈자라",
    indexNumber: 41,
    category: "세계·장소",
    description: "숨 쉬는 땅. 님과 빌리크람 사이의 푸른 별.",
  },
];
