/**
 * 공명지도 로직
 * Resonance Map - Stage 3 Logic
 */

// 울림통 데이터
const OOLIMTONG_NODES = [
    {
        id: 0,
        name: '설악산 울림통',
        icon: '⛰️',
        location: { lat: 38.1190, lng: 128.4656 },
        status: 'awakening',
        visits: 47,
        rituals: 23,
        resonance: 0.45
    },
    {
        id: 1,
        name: '강릉 정동진 울림통',
        icon: '🌊',
        location: { lat: 37.6914, lng: 129.0336 },
        status: 'dormant',
        visits: 12,
        rituals: 5,
        resonance: 0.15
    },
    {
        id: 2,
        name: '평창 대관령 울림통',
        icon: '🌲',
        location: { lat: 37.6874, lng: 128.7590 },
        status: 'resonating',
        visits: 89,
        rituals: 67,
        resonance: 0.78
    },
    {
        id: 3,
        name: '속초 영랑호 울림통',
        icon: '💧',
        location: { lat: 38.2124, lng: 128.5912 },
        status: 'dormant',
        visits: 8,
        rituals: 2,
        resonance: 0.08
    }
];

let mapState = {
    userLocation: null,
    selectedNode: null,
    isSimulation: false,
    watchId: null
};

// 맵 초기화
function initMap() {
    const user = loadUser();

    if (!user) {
        window.location.href = 'call.html';
        return;
    }

    setupEventListeners();
    renderMapBackground();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    document.getElementById('enable-gps').addEventListener('click', enableGPS);
    document.getElementById('skip-gps').addEventListener('click', startSimulation);
    document.getElementById('panel-close').addEventListener('click', closeDetailPanel);
    document.getElementById('navigate-btn').addEventListener('click', openNavigation);
}

// GPS 활성화
function enableGPS() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                mapState.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                hideGPSPrompt();
                showUserMarker();
                renderOolimtongMarkers();
                startLocationWatch();
            },
            (error) => {
                console.error('GPS 오류:', error);
                alert('위치를 가져올 수 없습니다. 시뮬레이션 모드로 전환합니다.');
                startSimulation();
            },
            { enableHighAccuracy: true }
        );
    } else {
        startSimulation();
    }
}

// 시뮬레이션 모드
function startSimulation() {
    mapState.isSimulation = true;
    // 설악산 근처로 시뮬레이션 위치 설정
    mapState.userLocation = {
        lat: 38.1200,
        lng: 128.4700
    };
    hideGPSPrompt();
    showUserMarker();
    renderOolimtongMarkers();

    // 시뮬레이션 공명 신호
    setTimeout(() => {
        showResonanceSignal(500);
    }, 2000);
}

// GPS 프롬프트 숨기기
function hideGPSPrompt() {
    document.getElementById('gps-prompt').classList.add('hidden');
}

// 사용자 마커 표시
function showUserMarker() {
    const marker = document.getElementById('user-marker');
    marker.classList.add('visible');

    // 맵 중앙에 배치
    marker.style.left = '50%';
    marker.style.top = '50%';
}

// 위치 감시 시작
function startLocationWatch() {
    if (mapState.isSimulation) return;

    mapState.watchId = navigator.geolocation.watchPosition(
        (position) => {
            mapState.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            checkProximity();
        },
        (error) => console.error('위치 감시 오류:', error),
        { enableHighAccuracy: true }
    );
}

// 근접성 확인
function checkProximity() {
    const user = loadUser();
    if (!user) return;

    OOLIMTONG_NODES.forEach(node => {
        // 잠금해제된 노드만 확인
        if (!user.unlockedNodes || !user.unlockedNodes.includes(node.id)) return;

        const distance = calculateDistance(
            mapState.userLocation.lat,
            mapState.userLocation.lng,
            node.location.lat,
            node.location.lng
        );

        if (distance < 5000) { // 5km 이내
            showResonanceSignal(distance);
            updateResonanceIndicator(true);

            if (distance < 100) { // 100m 이내
                triggerArrival(node);
            }
        }
    });
}

// 거리 계산 (Haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 지구 반경 (미터)
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

// 공명 신호 표시
function showResonanceSignal(distance) {
    const overlay = document.getElementById('resonance-overlay');
    const distanceDisplay = document.getElementById('signal-distance');

    overlay.classList.add('active');

    if (distance >= 1000) {
        distanceDisplay.textContent = (distance / 1000).toFixed(1) + 'km';
    } else {
        distanceDisplay.textContent = Math.round(distance) + 'm';
    }

    // 진동 (모바일)
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }

    setTimeout(() => {
        overlay.classList.remove('active');
    }, 3000);
}

// 공명 인디케이터 업데이트
function updateResonanceIndicator(active) {
    const indicator = document.querySelector('.resonance-indicator');
    const status = document.getElementById('resonance-status');

    if (active) {
        indicator.classList.add('active');
        status.textContent = '공명 감지됨';
    } else {
        indicator.classList.remove('active');
        status.textContent = '대기 중';
    }
}

// 도착 트리거
function triggerArrival(node) {
    console.log(`${node.name}에 도착!`);
    // TODO: 현장 수행 페이지로 이동
    alert(`${node.name}에 도착했습니다!\n현장 수행을 시작할 수 있습니다.`);
}

// 맵 배경 렌더링
function renderMapBackground() {
    const canvas = document.getElementById('map-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 배경
    // ctx.fillStyle = '#0a0e27';
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 그리드 라인
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)';
    ctx.lineWidth = 1;

    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // 중앙 십자선
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}

// 울림통 마커 렌더링
function renderOolimtongMarkers() {
    const container = document.getElementById('oolimtong-markers');
    const user = loadUser();

    container.innerHTML = '';

    OOLIMTONG_NODES.forEach((node, index) => {
        const isUnlocked = user.unlockedNodes && user.unlockedNodes.includes(node.id);

        // 위치 계산 (간단한 배치)
        const positions = [
            { left: '30%', top: '25%' },
            { left: '70%', top: '35%' },
            { left: '40%', top: '60%' },
            { left: '65%', top: '75%' }
        ];

        const marker = document.createElement('div');
        marker.className = `oolimtong-marker ${isUnlocked ? node.status : 'locked'}`;
        marker.style.left = positions[index].left;
        marker.style.top = positions[index].top;
        marker.dataset.nodeId = node.id;

        marker.innerHTML = `
            <div class="marker-glow"></div>
            <div class="marker-icon">${isUnlocked ? node.icon : '🔒'}</div>
        `;

        if (isUnlocked) {
            marker.addEventListener('click', () => openDetailPanel(node));
        }

        container.appendChild(marker);
    });
}

// 상세 패널 열기
function openDetailPanel(node) {
    mapState.selectedNode = node;

    document.getElementById('panel-icon').textContent = node.icon;
    document.getElementById('panel-name').textContent = node.name;
    document.getElementById('panel-visits').textContent = node.visits;
    document.getElementById('panel-rituals').textContent = node.rituals;
    document.getElementById('panel-resonance').textContent = Math.round(node.resonance * 100) + '%';
    document.getElementById('panel-progress').style.width = (node.resonance * 100) + '%';

    // 상태 텍스트
    const statusMap = {
        'dormant': '휴면 중',
        'awakening': '각성 중',
        'resonating': '공명 중',
        'full': '풀 가동'
    };
    document.querySelector('.status-text').textContent = statusMap[node.status] || '알 수 없음';

    document.getElementById('detail-panel').classList.add('visible');
}

// 상세 패널 닫기
function closeDetailPanel() {
    document.getElementById('detail-panel').classList.remove('visible');
    mapState.selectedNode = null;
}

// 네비게이션 열기
function openNavigation() {
    if (!mapState.selectedNode) return;

    const node = mapState.selectedNode;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${node.location.lat},${node.location.lng}`;
    window.open(url, '_blank');
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('울림통: 공명지도 초기화');
    initMap();
});

// 윈도우 리사이즈
window.addEventListener('resize', renderMapBackground);
