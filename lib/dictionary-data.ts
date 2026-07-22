export interface VisualBlock {
  id: string;
  type: 'upload' | 'gemini' | 'video';
  url: string;
  caption?: string;
  kraftCategory?: string; // Portfolio category (전시작품, 울림통프로젝트, 일러스트레이션)
}

export interface WordEntry {
  id: string;
  word: string;
  indexNumber: string;
  category: string;
  description: string;
  imagePrompt: string;
  visualBlocks: VisualBlock[];
  isKraft: boolean; // Flag for portfolio
  createdAt: string;
}

export interface TrashedItem {
  trashId: string;
  type: 'word' | 'block';
  originalEntryId: string;
  originalWord: string;
  wordEntry?: WordEntry; // Full entry if type is 'word'
  block?: VisualBlock;   // Individual block if type is 'block'
  trashedAt: string;
}

const categories = ["순수어", "기존어", "합성어", "청록전쟁편수록", "천개의문", "생물", "반생물", "지명", "캐릭터"];
export const KRAFT_CATEGORIES = ["전시작품", "울림통프로젝트", "일러스트레이션"];

const REAL_DATA = [
  { word: "가미진", category: "순수어", description: "어느 우주에도 속하지 않는 원반행성에 살고 있다 전해지는 지성생명체, 원반행성은 궤도를 스스로 만들어내기 때문에 우주를 제멋대로 지난다.", prompt: "Intelligent beings living on a wandering disc-shaped planet, celestial orbit, cosmic mysterious lifeforms, ethereal atmosphere" },
  { word: "고리", category: "순수어", description: "빌 리크람의 두 고등 문명 중 하나, 혹은 그 구성원을 일컫는다. 가지각색의 동물들의 모습을 하고 있다.", prompt: "Advanced civilization of diverse animal-like beings, ancient high-tech culture, Bil Likram ecosystem" },
  { word: "고힘", category: "순수어", description: "미누가 네골로 인해 둘로 분리되어 진화된 종족의 하나. 코끼리의 몸집인데 팔다리는 말 정도다.", prompt: "Hybrid creature with elephant-like body and horse-like legs, Minu evolution, surreal anatomy" },
  { word: "기에베트", category: "순수어", description: "금과 비슷한 광채를 내는 광물. 카라도크보다 고강도다.", prompt: "Golden glowing mineral crystal, high-strength metallic ore, radiant treasure" },
  { word: "네골", category: "순수어", description: "빌가와의 무기. 강렬한 붉은빛을 내며, 현재 단달계의 모든 생물과 반생물의 구조에 효력을 미친다. 아직은 미완성이지만 빌가와 고리의 능력을 한데 모은 소수 세력이 네골의 개발을 계속하고 있다.", prompt: "Powerful weapon emitting intense red light, magical energy weapon, Dandal system artifact" },
  { word: "니", category: "순수어", description: "눈. 미누 최후의 분신.", prompt: "Enormous cosmic eye, final avatar of Minu, mysterious gaze" },
  { word: "니니키안", category: "합성어", description: "님벨이 이룩한 나라, 니닉에 사는 사람들.", prompt: "Citizens of the Ninnik kingdom, futuristic tribal society, diverse inhabitants" },
  { word: "니닉", category: "순수어", description: "아직 정해진 뜻이 없다. 어떤 뜻도 될 수 있음을 의미하기도 한다. 나중에 님벨이 세운 나라도 니닉이라 불리며, 니닉의 주도는 니말다라가 된다.", prompt: "Abyssal void meaning everything and nothing, conceptual abstract art, birth of a nation" },
  { word: "니말다라", category: "순수어", description: "니가 기다리는 땅. 후에 님벨이 세운 나라의 수도.", prompt: "Sacred landscape, prospective capital city, mythical promised land" },
  { word: "님", category: "순수어", description: "꿈꾸는 별. 단달에 가장 가까이 있는 연두색 별. 준 항성.", prompt: "Dreaming green star, sub-stellar luminous body, ethereal celestial object" },
  { word: "님벨", category: "순수어", description: "니의 분신. 니니키안의 공주.", prompt: "Princess Nimbel, avatar of Ni, elegant and powerful royal figure" },
  { word: "델링카", category: "순수어", description: "빌가의 무기. 선홍빛을 낸다.", prompt: "Vibrant crimson weapon, Bilga energy tool, glowing artifact" },
  { word: "도구모", category: "순수어", description: "카와 니를 뒤쫓게 하기 위해 빌가가 만든 형상. 그러나 수수께끼의 힘이 간섭한 관계로 추격의 목적은 불분명한 상태다.", prompt: "Mysterious construct created by Bilga, enigmatic shadow figure, surreal apparition" },
  { word: "돌", category: "순수어", description: "빌 리크람의 핵에서 비롯된 반생물. 강한 진화의 의지를 가지고 있다.", prompt: "Semi-living core of Bil Likram, evolving crystalline organism, sentient mineral" },
  { word: "돌", category: "순수어", description: "고리의 여섯 사절 중 회색 나비. 빌리크람의 반생물질과 같은 의미.", prompt: "Grey butterfly emissary of Gori, semi-biological butterfly, ethereal wings" },
  { word: "둔가라", category: "기존어", description: "번개. 니말다라에 지어진 끝이 보이지 않을 만큼 높은 벽돌 탑.", prompt: "Infinite brick tower reaching lightning clouds, Nimaldara architecture, towering monument" },
  { word: "디르테", category: "순수어", description: "빌가의 무기. 하늘빛을 낸다.", prompt: "Sky-blue glowing weapon, Bilga technological artifact, azure energy" },
  { word: "딜루비움", category: "순수어", description: "홍수가 있었던 지역에만 생성되는 귀한 보석. 다섯 가지 색이 섞여 임의의 패턴을 생성한다.", prompt: "Multicolored rare gemstone with swirling patterns, post-flood crystalline treasure, iridescent jewel" },
  { word: "딤", category: "순수어", description: "고리의 여섯 사절 중 하얀 아르마딜로.", prompt: "White armadillo emissary of Gori, sacred ceramic-like creature" },
  { word: "딩", category: "순수어", description: "사슴을 닮고 나무무늬를 한 님의 이동형 생물.", prompt: "Wooden-patterned deer creature, mobile lifeform of Nim, organic bark texture" },
  { word: "딩굴", category: "순수어", description: "한없이 자라는 덩굴, 둥글둥글 뭉쳐서 산다.", prompt: "Ever-growing spherical vines, cluster of organic round plants, lush vegetation" },
  { word: "라바", category: "기존어", description: "님의 이동형 생물. 높은 지능이 있어 학습이 놀랍도록 빠르지만 수동적인 성격이라 길들이지 않을 경우 그냥 비문명 생물과 다를 게 없다.", prompt: "Highly intelligent but passive creature of Nim, scholarly beast, docile lifeform" },
  { word: "룽동", category: "순수어", description: "오드나타 성의 중심부를 일컫는 말. 본래 마카롱을 닮은 돔이 있는 중심건물 하나만을 의미했다.", prompt: "Macaron-shaped dome building, center of Odonata castle, unique architecture" },
  { word: "메아이네이", category: "기존어", description: "평원. 님의 지명.", prompt: "Vast serene plains of Nim, ethereal landscape, endless horizon" },
  { word: "모락", category: "순수어", description: "미누가 네골로 인해 둘로 분리되어 진화된 종족의 하나. 뚱뚱한 새를 닮았고 머리에 여섯 개의 화려한 장식깃이 나있다.", prompt: "Plump bird-like race with six ornate head feathers, Morak tribe, evolutionary variant" },
  { word: "모르쇠", category: "기존어", description: "도구모가 만든 분신. 그림자가 있는 곳이면 어디든 나타날 수 있다.", prompt: "Shadow avatar appearing in darkness, silent stalker, enigmatic duplicate" },
  { word: "몬자", category: "순수어", description: "고리의 여섯 사절 중 분홍색 곰.", prompt: "Pink bear emissary of Gori, soft but powerful sentinel" },
  { word: "몰", category: "순수어", description: "빌리크람의 심연 속 고대원념. 강한 미지의 힘과 의지를 가지고 있다.", prompt: "Ancient primordial consciousness in Bil Likram abyss, dark powerful entity" },
  { word: "뮤", category: "기존어", description: "카의 분신. 필그림의 시조이자 자기부유장치의 시조가 된다.", prompt: "Mu avatar, ancestor of self-floating technology, ethereal levitating figure" },
  { word: "미누", category: "순수어", description: "슈자라의 원주민. 단달계의 고대종족.", prompt: "Aboriginal tribe of Shujara, ancient Dandal race, tribal elders" },
  { word: "밀가", category: "순수어", description: "빌가 사절단의 총단장.", prompt: "Grand commander of Bilga messengers, noble leader, authoritative figure" },
  { word: "벨루비", category: "순수어", description: "딜루비움 정제 시 간혹 나오는 붉은 핵. 네골에 쓰이는 최상급 심의 재료가 되기도 한다.", prompt: "Red glowing core extracted from Diluvium, powerful heart material for Negol" },
  { word: "벰베", category: "순수어", description: "빌가의 무기. 초록빛을 낸다.", prompt: "Green glowing Bilga weapon, organic-tech artifact, emerald energy" },
  { word: "보이오티아", category: "순수어", description: "넓은 대륙. 님의 지명.", prompt: "Vast continent layout on planet Nim, geographical map aesthetic" },
  { word: "빌가", category: "순수어", description: "빌리크람의 고등 문명, 혹은 그 구성원. 사람처럼 생겼다.", prompt: "Bilga civilization inhabitants, humanoid sophisticated race, dark elegance" },
  { word: "빌레릭", category: "순수어", description: "빌가의 무기. 연한 자줏빛을 낸다.", prompt: "Pale violet energy weapon, Bilga technological tool, lavender glow" },
  { word: "빌리크람", category: "순수어", description: "어두운 지혜, 단달의 우주에서 제일 덩치가 크고 단달에서 가장 멀리 떨어진 어두운 별.", prompt: "Massive dark star Bil Likram, ominous celestial body, orb of dark wisdom" },
  { word: "사르바티아", category: "순수어", description: "밝은 대륙. 님의 지명.", prompt: "Luminous bright continent of Nim, radiant landscape, sunlit world" },
  { word: "사보라카", category: "순수어", description: "밝은 눈. 빌리크람이 단달 가까이로 간 후 몰로부터 얻은 새 이름.", prompt: "Bright eye 'Saboraka', enlightened cosmic entity, radiant gaze" },
  { word: "슈레스", category: "순수어", description: "니의 분신. 레시피 연금술사의 시조.", prompt: "Ancestor of recipe alchemists, Shures avatar, mystic potion brewer" },
  { word: "슈자라", category: "순수어", description: "숨 쉬는 땅. 님과 빌리크람 사이의 푸른 별.", prompt: "Blue planet Shujara, breathing earth, lush planetary life" },
  { word: "시공", category: "순수어", description: "고리의 여섯 사절 중 오색 고래.", prompt: "Five-colored space-time whale, cosmic leviathan emissary" },
  { word: "실드레", category: "순수어", description: "빌가의 무기. 은빛을 낸다.", prompt: "Silver glowing Bilga weapon, sleek metallic energy tool, chrome shine" },
  { word: "실리카", category: "순수어", description: "빌리크람의 생명의 강 주변에서 드물게 나는 흐르는 보석.", prompt: "Liquid gem flowing like river, Silica mineral, shimmering biological stream" },
  { word: "아가릭", category: "순수어", description: "연초록색의 보석. 아이들이 많이 지닌다. 먹을 수 있는 보석이다.", prompt: "Edible light green gems, Agaric childhood stones, soft glow" },
  { word: "아라스날", category: "순수어", description: "정체를 숨기고 빌가에게 조력하고 있는 고리. 밀법에 능통하고 다방면에 걸쳐 지식이 풍부하다.", prompt: "Secret collaborator Arasnal, master of occultism, wise scholar in disguise" },
  { word: "에봇", category: "순수어", description: "빌리크람의 몰의 세력에 대항할 지혜를 찾으러 우주에 파견된 고리의 여섯 사절 중 우두머리. 푸른 여우.", prompt: "Blue fox leader of emissaries, Ebot seeker of wisdom, cosmic messenger" },
  { word: "오나", category: "순수어", description: "가미진으로부터 파생된 사역종족. 오드나타 성의 주인. 하나의 날개가 있다.", prompt: "One-winged servant race Ona, lords of Odonata castle, ethereal servants" },
  { word: "오드나타", category: "순수어", description: "다른 우주에서 피는 꽃의 이름이자, 가미진이 원반행성이 지나는 우주마다 세운 시공의 문의 이름.", prompt: "Flower from another universe, gate of Odonata, space-time portal" },
  { word: "오르골", category: "기존어", description: "도구모 만든 분신. 생명체의 꿈을 빼앗거나, 반대로 생명체에 꿈을 심어주거나 할 수 있다.", prompt: "Dream-manipulator Orgel, music box avatar, surreal puppet" },
  { word: "와모라", category: "순수어", description: "품는 돌. 고리의 밀법에 쓰이는 도구 중 하나.", prompt: "The Embracing Stone Wamora, occult magic focal point, warm glowing mineral" },
  { word: "이라", category: "기존어", description: "카의 분신. 장인의 시조.", prompt: "Ira avatar, forefather of all artisans, divine craftsman" },
  { word: "지오드", category: "순수어", description: "강렬한 마력이 담긴 보석. 자줏빛을 낸다.", prompt: "Intense violet magical geode, pulsing arcane crystal, purple power" },
  { word: "청조등화", category: "기존어", description: "시공의 통로를 안내하는 오나의 태엽반생물 사역꾼. 바른길로 안내한다는 푸른빛을 내는 새.", prompt: "Blue light guiding bird, clockwork servant Cheongjo Deunghwa, messenger of light" },
  { word: "초나", category: "순수어", description: "결혼하는 나무. 결혼 전을 일컬음.", prompt: "The Marrying Tree Chona, pre-matrimony phase, majestic white tree" },
  { word: "초로나", category: "순수어", description: "초나가 결혼한 후의 이름.", prompt: "Chorona, the fully bloomed marrying tree, interconnected forest giants" },
  { word: "초로굴", category: "순수어", description: "초나의 묘목 군락.", prompt: "Groves of Chona saplings, young magical forest, Chorogul" },
  { word: "카", category: "순수어", description: "귀. 미누 최후의 분신.", prompt: "Cosmic ear avatar, final fragment of Minu, sensory celestial body" },
  { word: "카라도크", category: "순수어", description: "빌리크람의 검은 광산에서 나는 짙은 암청색의 고강도 보석.", prompt: "Dark blue high-strength Karadok gem, black mine treasure, deep navy crystal" },
  { word: "쿠낙", category: "순수어", description: "고리의 여섯 사절 중 검은 고양이.", prompt: "Black cat emissary Kunak, shadows and mystery, feline messenger" },
  { word: "쿠르타티아", category: "순수어", description: "움직이는 대륙. 님의 지명.", prompt: "Moving continent Kurtatia, shifting tectonic plates, dynamic landmass" },
  { word: "클로뎀", category: "순수어", description: "분홍빛이 나는 보석. 먹을 수 있는 보석이다.", prompt: "Edible pink gems, Clodem mineral, soft glowing candy-like stone" },
  { word: "키슬라", category: "순수어", description: "빌가의 무기. 진한 자줏빛을 낸다.", prompt: "Deep violet Bilga weapon, royal energy tool, dark amethyst glow" },
  { word: "파그라", category: "순수어", description: "다른 우주의 심해의 산호장작. 억겁의 세월동안 기름에 재워져 있었기 때문에 한번 불을 붙이면 절대로 꺼지지 않는다. 혹은 기름에 재운 시간만큼만 지속되기도 한다. 후에 톨라, 흘리바라와 함께 니닉의 3대 보물이 된다.", prompt: "Eternal coral wood Pagra, deep-sea ancient fuel, unquenchable fire" },
  { word: "필그림", category: "기존어", description: "니니키안 시대에 등장한 우주와 우주를 옮겨 다니는 철새 종족.", prompt: "Pilgrim race of migratory birds, space travelers, ethereal bird flock" },
  { word: "하르초크", category: "순수어", description: "님의 지명. 도구모와 오르골의 근거지가 되는 숲.", prompt: "Harchock forest, headquarters of Dogumo and Orgel, dark eerie woods" },
  { word: "홍접등화", category: "기존어", description: "시공의 통로를 안내하는 오나의 태엽반생물 사역꾼. 여행자를 교란시키거나 오나의 성으로 안내하는 붉은빛을 내는 나비.", prompt: "Red light deceptive butterfly, clockwork servant Hongjeop Deunghwa, erratic guide" },
  { word: "후후", category: "순수어", description: "니니키안 소녀의 이름.", prompt: "Ninnikian girl Huhu, youthful curiosity, futuristic traditional attire" }
];

const generateSeededEntries = (): WordEntry[] => {
  return REAL_DATA.map((data, i) => ({
    id: `word-seed-${i + 1}`,
    word: data.word,
    indexNumber: (i + 1).toString().padStart(4, '0'),
    category: data.category,
    description: data.description,
    imagePrompt: data.prompt,
    visualBlocks: [],
    isKraft: false,
    createdAt: new Date().toISOString(),
  }));
};

const STORAGE_KEY = 'ninniklopedia_entries';
const ADMIN_PW_KEY = 'ninniklopedia_admin_pw';
const TRASH_KEY = 'ninniklopedia_trash';

export const compressImage = async (base64Str: string, maxWidth = 800): Promise<string> => {
  if (!base64Str.startsWith('data:')) return base64Str;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
  });
};

export const getAdminPassword = (): string => {
  if (typeof window === 'undefined') return 'admin';
  return localStorage.getItem(ADMIN_PW_KEY) || 'admin';
};

export const updateAdminPassword = (newPw: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_PW_KEY, newPw);
};

export const reindexEntries = (entries: WordEntry[]): WordEntry[] => {
  const sorted = [...entries].sort((a, b) => a.word.localeCompare(b.word, 'ko'));
  let wordCounter = 1;
  return sorted.map((entry) => {
    if (entry.isKraft) return { ...entry, indexNumber: "KRAFT" };
    return {
      ...entry,
      indexNumber: (wordCounter++).toString().padStart(4, '0')
    };
  });
};

// --- API Sync Implementation ---

export const getDictionaryEntries = async (): Promise<WordEntry[]> => {
  try {
    const res = await fetch(`/api/dictionary?t=${Date.now()}`, {
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`Server Error: ${res.status}`);
    const data = await res.json();

    // Check if data is actually an array of entries
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }

    // If server is empty, try to get from local storage before seeding
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* corrupted */ }
    }

    // Only seed if everything is empty
    const seeded = generateSeededEntries();
    const final = reindexEntries(seeded);
    await saveDictionaryEntries(final);
    return final;
  } catch (e) {
    console.error("API Sync failed, using local storage as fallback", e);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch (err) { /* ignore */ }
    }
    return [];
  }
};

export const saveDictionaryEntries = async (entries: WordEntry[]) => {
  try {
    // 1. Save to Server
    await fetch('/api/dictionary', {
      method: 'POST',
      body: JSON.stringify(entries),
      headers: { 'Content-Type': 'application/json' }
    });
    // 2. Backup to Local Storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (e) {
    console.error("Save failed", e);
    return false;
  }
};

// --- Trash API Sync ---
export const getTrashedBlocks = async (): Promise<TrashedItem[]> => {
  try {
    const res = await fetch(`/api/trash?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Server Error: ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      localStorage.setItem(TRASH_KEY, JSON.stringify(data));
      return data;
    }
    const stored = localStorage.getItem(TRASH_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Trash API sync failed", e);
    const stored = localStorage.getItem(TRASH_KEY);
    return stored ? JSON.parse(stored) : [];
  }
};

export const saveTrashedBlocks = async (items: TrashedItem[]) => {
  try {
    await fetch('/api/trash', {
      method: 'POST',
      body: JSON.stringify(items),
      headers: { 'Content-Type': 'application/json' }
    });
    localStorage.setItem(TRASH_KEY, JSON.stringify(items));
    return true;
  } catch (e) {
    console.error("Trash save failed", e);
    return false;
  }
};

export const moveBlockToTrash = async (entryId: string, blockId: string) => {
  const entries = await getDictionaryEntries();
  const entry = entries.find(e => e.id === entryId);
  if (!entry) return;

  const blockIndex = (entry.visualBlocks || []).findIndex(b => b.id === blockId);
  if (blockIndex === -1) return;

  const block = entry.visualBlocks[blockIndex];
  const trashedItem: TrashedItem = {
    trashId: `trash-block-${Date.now()}`,
    type: 'block',
    originalEntryId: entry.id,
    originalWord: entry.word,
    block: block,
    trashedAt: new Date().toISOString()
  };

  const trash = await getTrashedBlocks();
  await saveTrashedBlocks([trashedItem, ...trash]);

  const newBlocks = entry.visualBlocks.filter(b => b.id !== blockId);
  await updateWordEntry(entryId, { visualBlocks: newBlocks });
};

export const moveWordToTrash = async (id: string) => {
  const entries = await getDictionaryEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return;

  const trashedItem: TrashedItem = {
    trashId: `trash-word-${Date.now()}`,
    type: 'word',
    originalEntryId: id,
    originalWord: entry.word,
    wordEntry: entry,
    trashedAt: new Date().toISOString()
  };

  const trash = await getTrashedBlocks();
  await saveTrashedBlocks([trashedItem, ...trash]);

  const updated = entries.filter(e => e.id !== id);
  await saveDictionaryEntries(updated);
};

export const restoreFromTrash = async (trashId: string) => {
  const trash = await getTrashedBlocks();
  const item = trash.find(t => t.trashId === trashId);
  if (!item) return;

  if (item.type === 'word' && item.wordEntry) {
    const entries = await getDictionaryEntries();
    await saveDictionaryEntries([item.wordEntry, ...entries]);
  } else if (item.type === 'block' && item.block) {
    const entries = await getDictionaryEntries();
    const entry = entries.find(e => e.id === item.originalEntryId);
    if (entry) {
      const updatedBlocks = [...(entry.visualBlocks || []), item.block];
      await updateWordEntry(item.originalEntryId, { visualBlocks: updatedBlocks });
    }
  }

  await saveTrashedBlocks(trash.filter(t => t.trashId !== trashId));
}

export const permanentlyDeleteFromTrash = async (trashId: string) => {
  const trash = await getTrashedBlocks();
  await saveTrashedBlocks(trash.filter(t => t.trashId !== trashId));
};

export const addWordEntry = async (entry: Omit<WordEntry, "id" | "createdAt" | "indexNumber">) => {
  const entries = await getDictionaryEntries();
  const processedBlocks = await Promise.all((entry.visualBlocks || []).map(async (block) => {
    if (block.url.startsWith('data:')) return { ...block, url: await compressImage(block.url) };
    return block;
  }));

  const newEntry: WordEntry = {
    ...entry,
    visualBlocks: processedBlocks,
    id: `word-${Date.now()}`,
    indexNumber: "PENDING",
    createdAt: new Date().toISOString(),
  };
  const updated = reindexEntries([newEntry, ...entries]);
  await saveDictionaryEntries(updated);
  return updated.find(e => e.id === newEntry.id) || newEntry;
};

export const updateWordEntry = async (id: string, updatedFields: Partial<Omit<WordEntry, "id" | "createdAt">>) => {
  const entries = await getDictionaryEntries();
  let processedFields = { ...updatedFields };
  if (updatedFields.visualBlocks) {
    processedFields.visualBlocks = await Promise.all(updatedFields.visualBlocks.map(async (block) => {
      if (block.url.startsWith('data:')) return { ...block, url: await compressImage(block.url) };
      return block;
    }));
  }

  const updatedRaw = entries.map(entry =>
    entry.id === id ? { ...entry, ...processedFields } : entry
  );

  const updated = reindexEntries(updatedRaw);
  await saveDictionaryEntries(updated);
};

export const deleteWordEntry = async (id: string) => {
  const entries = await getDictionaryEntries();
  const updated = entries.filter(entry => entry.id !== id);
  await saveDictionaryEntries(updated);
};

