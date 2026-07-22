/**
 * 니닉 이름 생성 시스템
 * Ninnik Name Generation System
 */

// 니닉 이름 구성 요소
const NINNIK_PREFIXES = [
    '울림의', '공명의', '침묵의', '각성의', '순례의',
    '빛나는', '깊은', '고요한', '영원의', '숨은',
    '흙의', '바람의', '물결의', '불꽃의', '그림자의'
];

const NINNIK_CORES = [
    '자각자', '수행자', '관망자', '탐색자', '연결자',
    '울림통지기', '순례자', '기억자', '전달자', '수호자',
    '몽상가', '예언자', '귀환자', '깨우침', '걸음'
];

const NINNIK_SUFFIXES = [
    '', '', '', // 접미사 없는 경우도 허용
    '의 발자국', '의 메아리', '의 속삭임', '의 그늘',
    '의 씨앗', '의 파동', '의 잔향'
];

/**
 * 현재 등록된 유저 수 (로컬 시뮬레이션)
 * 실제로는 서버에서 관리
 */
function getNextSerialNumber() {
    let currentMax = parseInt(localStorage.getItem('ninnik_max_serial') || '0');
    currentMax++;
    localStorage.setItem('ninnik_max_serial', currentMax.toString());
    return currentMax;
}

/**
 * 니닉 이름 생성
 */
function generateNinnikName() {
    const prefix = NINNIK_PREFIXES[Math.floor(Math.random() * NINNIK_PREFIXES.length)];
    const core = NINNIK_CORES[Math.floor(Math.random() * NINNIK_CORES.length)];
    const suffix = NINNIK_SUFFIXES[Math.floor(Math.random() * NINNIK_SUFFIXES.length)];

    return `${prefix} ${core}${suffix}`;
}

/**
 * 유저 데이터 구조
 */
function createUser() {
    const serialNumber = getNextSerialNumber();
    const ninnikName = generateNinnikName();

    const user = {
        id: crypto.randomUUID(),
        ninnikName: ninnikName,
        serialNumber: serialNumber,
        displayNumber: String(serialNumber).padStart(4, '0'),
        joinedAt: Date.now(),
        talismans: [],
        completedRituals: [],
        visitedNodes: [],
        unlockedNodes: []
    };

    return user;
}

/**
 * 유저 저장
 */
function saveUser(user) {
    localStorage.setItem('ninnik_user', JSON.stringify(user));
}

/**
 * 유저 불러오기
 */
function loadUser() {
    const data = localStorage.getItem('ninnik_user');
    return data ? JSON.parse(data) : null;
}

/**
 * 유저 존재 여부 확인
 */
function userExists() {
    return localStorage.getItem('ninnik_user') !== null;
}

/**
 * 부적 추가
 */
function addTalisman(type) {
    const user = loadUser();
    if (!user) return false;

    user.talismans.push({
        type: type,
        earnedAt: Date.now()
    });

    saveUser(user);
    checkUnlocks(user);
    return true;
}

/**
 * 울림통 잠금해제 확인
 */
const UNLOCK_THRESHOLDS = [
    { count: 3, nodeIndex: 0 },
    { count: 7, nodeIndex: 1 },
    { count: 12, nodeIndex: 2 },
    { count: 18, nodeIndex: 3 }
];

function checkUnlocks(user) {
    const talismanCount = user.talismans.length;

    UNLOCK_THRESHOLDS.forEach(threshold => {
        if (talismanCount >= threshold.count &&
            !user.unlockedNodes.includes(threshold.nodeIndex)) {
            user.unlockedNodes.push(threshold.nodeIndex);
            console.log(`울림통 #${threshold.nodeIndex + 1} 해제!`);
        }
    });

    saveUser(user);
}

/**
 * 수행 완료 기록
 */
function completeRitual(ritualType, score, oolimtongId = null) {
    const user = loadUser();
    if (!user) return false;

    user.completedRituals.push({
        type: ritualType,
        score: score,
        oolimtongId: oolimtongId,
        completedAt: Date.now()
    });

    saveUser(user);
    return true;
}

/**
 * 방문 기록
 */
function recordVisit(oolimtongId, duration) {
    const user = loadUser();
    if (!user) return false;

    user.visitedNodes.push({
        oolimtongId: oolimtongId,
        arrivedAt: Date.now(),
        duration: duration
    });

    saveUser(user);
    return true;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateNinnikName,
        createUser,
        saveUser,
        loadUser,
        userExists,
        addTalisman,
        completeRitual,
        recordVisit
    };
}
