// Compass Main Logic
let currentDirection = 'south';
let selectedNodeId = null;

const directionMap = {
    'north': 0,
    'east': 90,
    'south': 180,
    'west': 270
};

const directionSprites = {
    'north': 'assets/characters/chain-wielder/north.png',
    'east': 'assets/characters/chain-wielder/east.png',
    'south': 'assets/characters/chain-wielder/south.png',
    'west': 'assets/characters/chain-wielder/west.png'
};

// Initialize Compass
function initCompass() {
    updateTime();
    setInterval(updateTime, 1000);

    updateLocation();
    startResonanceVisualization();
    initMapCanvas();
    loadNodes();
    initRitualModal();

    // Update resonance every 5 seconds
    setInterval(updateResonance, 5000);
    updateResonance();

    // Auto-select first node
    const resonances = calculateAllResonances();
    if (resonances.length > 0) {
        selectNode(resonances[0].id);
    }
}

// Update Time Display
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('time-text').textContent = `${hours}:${minutes}`;
}

// Update Location Display
function updateLocation() {
    const locations = [
        '강원 · 설악산 구역',
        '강원 · 강릉 해안',
        '강원 · 평창 고원',
        '강원 · 속초 영역'
    ];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    document.getElementById('location-text').textContent = randomLocation;
}

// Direction Control
function changeDirection(direction) {
    currentDirection = direction;

    const avatar = document.getElementById('avatar-sprite');
    avatar.src = directionSprites[direction];

    const needle = document.querySelector('.compass-needle');
    needle.style.transform = `translate(-50%, -100%) rotate(${directionMap[direction]}deg)`;

    avatar.style.transform = 'scale(1.1)';
    setTimeout(() => {
        avatar.style.transform = 'scale(1)';
    }, 200);
}

// Direction Pad Listeners
document.querySelectorAll('.dir-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const direction = btn.dataset.direction;
        changeDirection(direction);
    });
});

// Keyboard Controls
function setupCompassKeyboard() {
    const handleKey = (e) => {
        const keyMap = {
            'ArrowUp': 'north',
            'ArrowDown': 'south',
            'ArrowLeft': 'west',
            'ArrowRight': 'east',
            'w': 'north',
            's': 'south',
            'a': 'west',
            'd': 'east'
        };

        const direction = keyMap[e.key];
        if (direction) {
            changeDirection(direction);
            e.preventDefault();
        }
    };
    document.addEventListener('keydown', handleKey);
    // Store for cleanup if needed
    window._compassKeyHandler = handleKey;
}

// Update Resonance Display
function updateResonance() {
    const strongest = getStrongestResonance();
    const resonanceValue = strongest.resonance;

    const fill = document.getElementById('resonance-fill');
    const valueDisplay = document.getElementById('resonance-value');

    const normalized = Math.min(100, (resonanceValue / 10) * 100);
    fill.style.width = `${normalized}%`;
    valueDisplay.textContent = resonanceValue.toFixed(2);
}

// Load Nodes into HUD
function loadNodes() {
    const nodeList = document.getElementById('node-list');
    const resonances = calculateAllResonances();

    resonances.sort((a, b) => b.resonance - a.resonance);

    nodeList.innerHTML = '';
    resonances.forEach(node => {
        const nodeItem = document.createElement('div');
        nodeItem.className = 'node-item';
        nodeItem.dataset.nodeId = node.id;

        if (node.id === selectedNodeId) {
            nodeItem.classList.add('selected');
        }

        nodeItem.innerHTML = `
            <strong>${node.name}</strong><br>
            <small>공명: ${node.resonance.toFixed(1)} | ${node.frequency} Hz</small>
        `;

        // Add click handler to select node
        nodeItem.addEventListener('click', () => {
            selectNode(node.id);
        });

        nodeList.appendChild(nodeItem);
    });
}

// Select a node for ritual
function selectNode(nodeId) {
    selectedNodeId = nodeId;

    // Update visual selection
    document.querySelectorAll('.node-item').forEach(item => {
        if (parseInt(item.dataset.nodeId) === nodeId) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });

    console.log(`Selected node: ${nodeId}`);
}

// ========================
// RITUAL MINI-GAME
// ========================

let ritualState = {
    isRunning: false,
    currentCycle: 0,
    totalCycles: 3,
    phase: 'ready',
    targetNode: null
};

function initRitualModal() {
    const modal = document.getElementById('ritual-modal');
    const startBtn = document.getElementById('ritual-start-btn');
    const cancelBtn = document.getElementById('ritual-cancel-btn');
    const ritualBtn = document.getElementById('ritual-btn');

    // Open modal when ritual button clicked
    ritualBtn.addEventListener('click', () => {
        openRitualModal();
    });

    // Start ritual
    startBtn.addEventListener('click', () => {
        startBreathingRitual();
    });

    // Cancel ritual
    cancelBtn.addEventListener('click', () => {
        closeRitualModal();
    });

    // Close on backdrop click
    const backdrop = document.querySelector('.ritual-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            if (!ritualState.isRunning) {
                closeRitualModal();
            }
        });
    }
}

function openRitualModal() {
    const modal = document.getElementById('ritual-modal');
    const targetNode = mockResonanceData.find(n => n.id === selectedNodeId) || mockResonanceData[0];

    ritualState.targetNode = targetNode;

    // Update modal with target node info
    document.getElementById('ritual-node-name').textContent = targetNode.name;
    document.getElementById('ritual-node-freq').textContent = `${targetNode.frequency} Hz`;

    // Reset state
    document.getElementById('breathing-text').textContent = '준비';
    document.getElementById('breathing-fill').style.width = '0%';
    document.getElementById('breathing-circle').className = 'breathing-circle';
    document.getElementById('ritual-result').style.display = 'none';
    document.querySelector('.breathing-container').style.display = 'block';
    document.querySelector('.ritual-controls').style.display = 'flex';
    document.getElementById('ritual-start-btn').style.display = 'inline-block';

    modal.style.display = 'flex';
}

function closeRitualModal() {
    const modal = document.getElementById('ritual-modal');
    modal.style.display = 'none';
    ritualState.isRunning = false;
    ritualState.currentCycle = 0;
}

function startBreathingRitual() {
    if (ritualState.isRunning) return;

    ritualState.isRunning = true;
    ritualState.currentCycle = 0;

    // Hide start button
    document.getElementById('ritual-start-btn').style.display = 'none';

    // Start breathing cycle
    runBreathingCycle();
}

function runBreathingCycle() {
    if (!ritualState.isRunning) return;

    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breathing-text');
    const fill = document.getElementById('breathing-fill');

    const cycleProgress = (ritualState.currentCycle / ritualState.totalCycles) * 100;

    // Phase 1: Inhale (4 seconds)
    circle.className = 'breathing-circle inhale';
    text.textContent = '들숨';
    fill.style.width = `${cycleProgress + 10}%`;

    setTimeout(() => {
        if (!ritualState.isRunning) return;

        // Phase 2: Hold (2 seconds)
        text.textContent = '멈춤';
        fill.style.width = `${cycleProgress + 20}%`;

        setTimeout(() => {
            if (!ritualState.isRunning) return;

            // Phase 3: Exhale (4 seconds)
            circle.className = 'breathing-circle exhale';
            text.textContent = '날숨';
            fill.style.width = `${cycleProgress + 33}%`;

            setTimeout(() => {
                if (!ritualState.isRunning) return;

                ritualState.currentCycle++;

                if (ritualState.currentCycle < ritualState.totalCycles) {
                    runBreathingCycle();
                } else {
                    completeRitual();
                }
            }, 4000);

        }, 2000);

    }, 4000);
}

function completeRitual() {
    ritualState.isRunning = false;

    const result = performRitual(ritualState.targetNode.id);

    // Hide breathing, show result
    document.querySelector('.breathing-container').style.display = 'none';
    document.querySelector('.ritual-controls').style.display = 'none';

    const resultDiv = document.getElementById('ritual-result');
    document.getElementById('result-resonance').textContent = result.resonance.toFixed(2);
    resultDiv.style.display = 'block';

    createRitualEffect();

    updateResonance();
    loadNodes();

    setTimeout(() => {
        closeRitualModal();
    }, 3000);
}

// Ritual Visual Effect
function createRitualEffect() {
    const compassCore = document.querySelector('.compass-core');

    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const ring = document.createElement('div');
            ring.style.position = 'absolute';
            ring.style.top = '50%';
            ring.style.left = '50%';
            ring.style.transform = 'translate(-50%, -50%)';
            ring.style.width = '100px';
            ring.style.height = '100px';
            ring.style.border = '3px solid var(--color-sacred-amber)';
            ring.style.borderRadius = '50%';
            ring.style.opacity = '1';
            ring.style.pointerEvents = 'none';
            ring.style.animation = 'ritualExpand 2s ease-out forwards';

            compassCore.appendChild(ring);

            setTimeout(() => ring.remove(), 2000);
        }, i * 200);
    }

    if (!document.getElementById('ritual-animation-style')) {
        const style = document.createElement('style');
        style.id = 'ritual-animation-style';
        style.textContent = `
            @keyframes ritualExpand {
                from { width: 100px; height: 100px; opacity: 1; }
                to { width: 500px; height: 500px; opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Resonance Visualization Canvas
function startResonanceVisualization() {
    const canvas = document.getElementById('resonance-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];

    function createParticles() {
        const resonances = calculateAllResonances();

        for (let i = 0; i < 30; i++) {
            const node = resonances[Math.floor(Math.random() * resonances.length)];

            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                opacity: Math.random() * 0.5 + 0.3,
                resonance: node.resonance
            });
        }
    }

    createParticles();

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 217, 255, ${0.2 * (1 - distance / 150)})`;
                    ctx.stroke();
                }
            }
        }

        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

            const intensity = Math.min(255, p.resonance / 10);
            ctx.fillStyle = `rgba(${intensity}, 217, 255, ${p.opacity})`;
            ctx.fill();

            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// Map Canvas
function initMapCanvas() {
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    for (let i = 0; i < 10; i++) {
        const y = (i / 10) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.strokeStyle = `rgba(0, 217, 255, ${0.1 - i * 0.008})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    const resonances = calculateAllResonances();
    resonances.forEach((node, index) => {
        const x = (index / resonances.length) * canvas.width + 100;
        const y = canvas.height / 2 + (Math.random() - 0.5) * 300;

        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212, 165, 116, 0.8)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const glowSize = 20 + (node.resonance / 10) * 30;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 217, 255, 0.1)';
        ctx.fill();
    });
}

// Initialize on load (SPA용 전역 노출됨)
window.initCompass = function () {
    console.log('OOLIMTONG: Resonance Compass initialized');

    // Internal initialization logic
    updateTime();
    // Use a window-scoped timer to avoid duplicates on re-init
    if (window._timeTimer) clearInterval(window._timeTimer);
    window._timeTimer = setInterval(updateTime, 1000);

    updateLocation();
    startResonanceVisualization();
    initMapCanvas();
    loadNodes();
    initRitualModal();

    if (window._resonanceTimer) clearInterval(window._resonanceTimer);
    window._resonanceTimer = setInterval(updateResonance, 5000);
    updateResonance();

    // Auto-select first node
    const resonances = typeof calculateAllResonances === 'function' ? calculateAllResonances() : [];
    if (resonances.length > 0) {
        selectNode(resonances[0].id);
    }

    setupCompassKeyboard();
};

// Legacy support if loaded directly
if (document.readyState === 'complete' && !document.getElementById('spa-view-container')) {
    window.initCompass();
}

