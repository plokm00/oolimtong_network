/**
 * 소환 페이지 로직
 * The Call - Stage 1 Logic
 */

let currentUser = null;

// 화면 전환 (Namespaced for Call)
function showCallScreen(screenId) {
    document.querySelectorAll('.call-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

// 파티클 생성
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 4 + 1 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = Math.random() > 0.5
            ? 'rgba(0, 217, 255, 0.6)'
            : 'rgba(212, 165, 116, 0.6)';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `particleFloat ${5 + Math.random() * 10}s ease-in-out infinite`;
        particle.style.animationDelay = `-${Math.random() * 5}s`;
        container.appendChild(particle);
    }

    // 파티클 애니메이션 스타일 추가
    if (!document.getElementById('particle-style')) {
        const style = document.createElement('style');
        style.id = 'particle-style';
        style.textContent = `
            @keyframes particleFloat {
                0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                25% { transform: translateY(-30px) translateX(10px); opacity: 0.8; }
                50% { transform: translateY(-20px) translateX(-10px); opacity: 0.5; }
                75% { transform: translateY(-40px) translateX(5px); opacity: 0.7; }
            }
        `;
        document.head.appendChild(style);
    }
}

// 소환 시퀀스
async function startSummoning() {
    showCallScreen('screen-summoning');

    const progressBar = document.getElementById('progress-bar');
    const summoningText = document.getElementById('summoning-text');

    const steps = [
        { text: '연결 중...', progress: 20 },
        { text: '공명 신호 탐지...', progress: 40 },
        { text: '니닉 에너지 동기화...', progress: 60 },
        { text: '이름 생성 중...', progress: 80 },
        { text: '소환 완료', progress: 100 }
    ];

    for (const step of steps) {
        summoningText.textContent = step.text;
        progressBar.style.width = step.progress + '%';
        await sleep(800);
    }

    await sleep(500);
    revealName();
}

// 이름 공개
function revealName() {
    // 유저 생성
    currentUser = createUser();

    // 이름 표시
    document.getElementById('ninnik-name').textContent = currentUser.ninnikName;
    document.getElementById('serial-number').textContent = `#${currentUser.displayNumber}`;

    showCallScreen('screen-naming');
}

// 이름 수락
function acceptName() {
    // 유저 저장
    saveUser(currentUser);

    // 카드 정보 채우기
    document.getElementById('card-name').textContent = currentUser.ninnikName;
    document.getElementById('card-number').textContent = `수행자 #${currentUser.displayNumber}`;

    const joinDate = new Date(currentUser.joinedAt);
    document.getElementById('card-date').textContent =
        `가입일: ${joinDate.getFullYear()}년 ${joinDate.getMonth() + 1}월 ${joinDate.getDate()}일`;

    showCallScreen('screen-complete');
}

// 수행 시작
function startPractice() {
    // Stage 1 -> 2: 소환 후 바로 매뉴얼(Onboarding)로 이동
    if (window.navigateGame) {
        window.navigateGame('onboarding.html');
    } else {
        window.location.href = 'onboarding.html';
    }
}

// 유틸리티
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 초기화 (SPA용)
window.initCall = function () {
    console.log('울림통: 소환 인터페이스 초기화');

    if (userExists()) {
        const existingUser = loadUser();
        console.log(`기존 유저 발견: ${existingUser.ninnikName}`);
    }

    createParticles();

    // 이벤트 리스너 (DOM이 로드된 후에 실행됨)
    const enterBtn = document.getElementById('enter-btn');
    const acceptBtn = document.getElementById('accept-btn');
    const continueBtn = document.getElementById('continue-btn');

    if (enterBtn) enterBtn.addEventListener('click', startSummoning);
    if (acceptBtn) acceptBtn.addEventListener('click', acceptName);
    if (continueBtn) continueBtn.addEventListener('click', startPractice);
};

