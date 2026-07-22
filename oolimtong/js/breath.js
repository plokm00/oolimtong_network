/**
 * 호흡 수행 미니게임 로직
 * Breath Practice Mini-game
 */

// 수행 설정
const BREATH_CONFIG = {
    inhaleTime: 4000,  // 들숨 4초
    holdTime: 2000,    // 정지 2초
    exhaleTime: 4000,  // 날숨 4초
    totalCycles: 3     // 3회 반복
};

let practiceState = {
    isRunning: false,
    currentCycle: 0,
    phase: 'ready'
};

// 화면 전환
function showScreen(screenId) {
    document.querySelectorAll('.breath-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// 수행 시작
function startPractice() {
    practiceState.isRunning = true;
    practiceState.currentCycle = 0;

    showScreen('screen-practice');
    updateCycleDisplay();

    // 짧은 딜레이 후 시작
    setTimeout(() => {
        runBreathCycle();
    }, 1000);
}

// 호흡 사이클 실행
function runBreathCycle() {
    if (!practiceState.isRunning) return;

    const circle = document.getElementById('breath-circle');
    const text = document.getElementById('breath-text');
    const progressBar = document.getElementById('progress-bar');

    const totalTime = BREATH_CONFIG.inhaleTime + BREATH_CONFIG.holdTime + BREATH_CONFIG.exhaleTime;
    const cycleProgress = (practiceState.currentCycle / BREATH_CONFIG.totalCycles) * 100;

    // Phase 1: 들숨
    practiceState.phase = 'inhale';
    circle.className = 'breath-circle inhale';
    text.textContent = '들숨';
    progressBar.style.width = `${cycleProgress + 10}%`;

    setTimeout(() => {
        if (!practiceState.isRunning) return;

        // Phase 2: 정지
        practiceState.phase = 'hold';
        circle.className = 'breath-circle hold';
        text.textContent = '멈춤';
        progressBar.style.width = `${cycleProgress + 20}%`;

        setTimeout(() => {
            if (!practiceState.isRunning) return;

            // Phase 3: 날숨
            practiceState.phase = 'exhale';
            circle.className = 'breath-circle exhale';
            text.textContent = '날숨';
            progressBar.style.width = `${cycleProgress + 33}%`;

            setTimeout(() => {
                if (!practiceState.isRunning) return;

                practiceState.currentCycle++;
                updateCycleDisplay();

                if (practiceState.currentCycle < BREATH_CONFIG.totalCycles) {
                    // 다음 사이클
                    runBreathCycle();
                } else {
                    // 완료
                    completePractice();
                }
            }, BREATH_CONFIG.exhaleTime);

        }, BREATH_CONFIG.holdTime);

    }, BREATH_CONFIG.inhaleTime);
}

// 사이클 표시 업데이트
function updateCycleDisplay() {
    document.getElementById('current-cycle').textContent = practiceState.currentCycle;
    document.getElementById('total-cycles').textContent = BREATH_CONFIG.totalCycles;
}

// 수행 완료
function completePractice() {
    practiceState.isRunning = false;

    // 부적 추가
    addTalisman('breath');

    // 수행 기록
    completeRitual('breath', 1.0);

    // 완료 화면
    showScreen('screen-complete');

    console.log('호흡 수행 완료! 부적 획득!');
}

// 수행 페이지로 돌아가기
function goBack() {
    window.location.href = 'practice.html';
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('울림통: 호흡 수행 초기화');

    // 유저 확인
    if (!userExists()) {
        window.location.href = 'call.html';
        return;
    }

    // 이벤트 리스너
    document.getElementById('start-btn').addEventListener('click', startPractice);
    document.getElementById('continue-btn').addEventListener('click', goBack);
});
