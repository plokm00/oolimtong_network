/**
 * 수행 허브 페이지 로직
 * Practice Hub - Stage 2 Logic
 */

// 울림통 데이터 (잠금해제 시 표시)
const OOLIMTONG_DATA = [
    { name: '설악산 울림통', icon: '⛰️' },
    { name: '강릉 정동진 울림통', icon: '🌊' },
    { name: '평창 대관령 울림통', icon: '🌲' },
    { name: '속초 영랑호 울림통', icon: '💧' }
];

// 부적 아이콘
const TALISMAN_ICONS = {
    'breath': '🌬️',
    'mudra': '🤲',
    'voice': '🗣️',
    'stomp': '👣'
};

// 페이지 초기화
function initPracticePage() {
    const user = loadUser();

    if (!user) {
        // 유저가 없으면 소환 페이지로
        window.location.href = 'call.html';
        return;
    }

    // 유저 정보 표시
    document.getElementById('user-name').textContent = user.ninnikName;
    document.getElementById('user-number').textContent = `#${user.displayNumber}`;

    // 부적 수 표시
    updateTalismanCount(user);

    // 부적 목록 표시
    displayTalismans(user);

    // 잠금해제 상태 표시
    updateUnlockStatus(user);

    // 수행 버튼 이벤트
    setupPracticeButtons();
}

// 부적 수 업데이트
function updateTalismanCount(user) {
    const count = user.talismans.length;
    document.getElementById('talisman-count').textContent = count;

    // 다음 해제에 필요한 수
    const thresholds = [3, 7, 12, 18];
    let nextThreshold = thresholds.find(t => t > count) || '∞';
    document.getElementById('unlock-next').textContent = nextThreshold;
}

// 부적 목록 표시
function displayTalismans(user) {
    const grid = document.getElementById('talismans-grid');
    const emptyMsg = document.getElementById('empty-talismans');

    if (user.talismans.length === 0) {
        emptyMsg.style.display = 'block';
        return;
    }

    emptyMsg.style.display = 'none';

    // 기존 부적 아이템 제거
    grid.querySelectorAll('.talisman-item').forEach(el => el.remove());

    // 부적 추가
    user.talismans.forEach((talisman, index) => {
        const item = document.createElement('div');
        item.className = 'talisman-item';
        item.textContent = TALISMAN_ICONS[talisman.type] || '◇';
        item.style.animationDelay = `${index * 0.2}s`;
        grid.appendChild(item);
    });
}

// 잠금해제 상태 업데이트
function updateUnlockStatus(user) {
    const unlockItems = document.querySelectorAll('.unlock-item');

    unlockItems.forEach((item, index) => {
        if (user.unlockedNodes && user.unlockedNodes.includes(index)) {
            item.classList.remove('locked');
            item.classList.add('unlocked');
            item.querySelector('.unlock-icon').textContent = OOLIMTONG_DATA[index].icon;
            item.querySelector('.unlock-name').textContent = OOLIMTONG_DATA[index].name;
            item.querySelector('.unlock-req').textContent = '위치 공개됨';
        }
    });
}

// 수행 버튼 설정
function setupPracticeButtons() {
    document.querySelectorAll('.practice-card').forEach(card => {
        const btn = card.querySelector('.practice-btn');
        const practiceType = card.dataset.practice;

        if (!btn.disabled) {
            btn.addEventListener('click', () => {
                startPractice(practiceType);
            });
        }
    });
}

// 수행 시작
function startPractice(type) {
    switch (type) {
        case 'breath':
            window.location.href = 'breath.html';
            break;
        case 'mudra':
            window.location.href = 'mudra.html';
            break;
        case 'voice':
            window.location.href = 'voice.html';
            break;
        case 'stomp':
            window.location.href = 'stomp.html';
            break;
    }
}

// 테스트용: 부적 추가
function debugAddTalisman(type = 'breath') {
    addTalisman(type);
    const user = loadUser();
    updateTalismanCount(user);
    displayTalismans(user);
    updateUnlockStatus(user);
    console.log(`부적 추가됨: ${type}`);
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('울림통: 수행 허브 초기화');
    initPracticePage();
});
