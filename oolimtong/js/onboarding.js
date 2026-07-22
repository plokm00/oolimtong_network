// Onboarding State Management
let currentScreen = 1;
const totalScreens = 3;

// Screen Navigation (Namespaced for Onboarding)
function showOnboardingScreen(screenNumber) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.querySelector(`[data-screen="${screenNumber}"]`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Update progress dots
    document.querySelectorAll('.progress-dots .dot').forEach((dot, index) => {
        if (index + 1 === screenNumber) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    currentScreen = screenNumber;
}

function nextScreen() {
    if (currentScreen < totalScreens) {
        showOnboardingScreen(currentScreen + 1);
    } else {
        // Navigate to main compass
        // Navigate to main compass
        if (window.navigateGame) {
            window.navigateGame('compass');
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Screen 1: Awakening - Touch to activate
function initAwakening() {
    const touchIndicator = document.querySelector('.touch-indicator');
    const seedCore = document.querySelector('.seed-core');
    const screen1 = document.querySelector('[data-screen="1"]');

    // Make entire screen clickable
    if (screen1) {
        screen1.addEventListener('click', handleAwakening);
        screen1.style.cursor = 'pointer';
    }

    // Also keep touch indicator clickable
    if (touchIndicator) {
        touchIndicator.addEventListener('click', (e) => {
            e.stopPropagation();
            handleAwakening();
        });
    }

    function handleAwakening() {
        if (currentScreen !== 1) return;

        // Amplify the glow effect
        if (seedCore) {
            seedCore.style.transform = 'translate(-50%, -50%) scale(1.2)';
            seedCore.style.transition = 'transform 0.5s ease-out';
        }

        setTimeout(() => {
            nextScreen();
        }, 600);
    }
}

// Screen 2: Practice - Trace pattern
function initPractice() {
    const svg = document.querySelector('.pattern-trace');
    const userTrace = document.querySelector('.user-trace');
    let isDrawing = false;
    let pathData = '';
    let pointsCollected = 0;
    const requiredPoints = 20;

    if (!svg || !userTrace) return;

    svg.addEventListener('mousedown', startDrawing);
    svg.addEventListener('touchstart', startDrawing);

    svg.addEventListener('mousemove', draw);
    svg.addEventListener('touchmove', draw);

    svg.addEventListener('mouseup', stopDrawing);
    svg.addEventListener('touchend', stopDrawing);
    svg.addEventListener('mouseleave', stopDrawing);

    function startDrawing(e) {
        isDrawing = true;
        pathData = '';
        pointsCollected = 0;

        const point = getPoint(e);
        pathData = `M ${point.x} ${point.y}`;
        userTrace.setAttribute('d', pathData);
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();

        const point = getPoint(e);
        pathData += ` L ${point.x} ${point.y}`;
        userTrace.setAttribute('d', pathData);

        pointsCollected++;

        // Auto-complete after collecting enough points
        if (pointsCollected >= requiredPoints) {
            stopDrawing(e);
            setTimeout(() => {
                nextScreen();
            }, 800);
        }
    }

    function stopDrawing(e) {
        isDrawing = false;
    }

    function getPoint(e) {
        const rect = svg.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = ((clientX - rect.left) / rect.width) * 200;
        const y = ((clientY - rect.top) / rect.height) * 200;

        return { x, y };
    }
}

// Screen 3: Encounter - Send resonance
function initEncounter() {
    const resonanceButton = document.querySelector('.resonance-button');
    const monolith = document.querySelector('.monolith');

    if (resonanceButton) {
        resonanceButton.addEventListener('click', () => {
            // Create resonance effect
            monolith.style.boxShadow = '0 0 100px var(--color-energy-cyan), inset 0 0 50px rgba(0, 217, 255, 0.5)';
            monolith.style.transition = 'box-shadow 0.5s ease-out';

            // Create multiple resonance waves
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    createResonanceWave();
                }, i * 300);
            }

        });
    }

    function createResonanceWave() {
        const wave = document.createElement('div');
        wave.style.position = 'absolute';
        wave.style.bottom = '50%';
        wave.style.left = '50%';
        wave.style.transform = 'translate(-50%, -50%)';
        wave.style.width = '50px';
        wave.style.height = '50px';
        wave.style.border = '3px solid var(--color-energy-cyan)';
        wave.style.borderRadius = '50%';
        wave.style.opacity = '1';
        wave.style.pointerEvents = 'none';
        wave.style.animation = 'waveExpand 2s ease-out forwards';

        document.querySelector('.monolith').appendChild(wave);

        setTimeout(() => {
            wave.remove();
        }, 2000);
    }
}

// Progress dots navigation
function initProgressDots() {
    document.querySelectorAll('.progress-dots .dot').forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showOnboardingScreen(index + 1);
        });
    });
}

// Canvas animation for Screen 2
function initCanvas() {
    const canvas = document.getElementById('trace-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];

    // Create floating particles
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.3
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw particles
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 217, 255, ${p.opacity})`;
            ctx.fill();

            // Update position
            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap around edges
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// Keyboard navigation
function setupOnboardingKeyboard() {
    const handleKey = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
            nextScreen();
        } else if (e.key === 'ArrowLeft') {
            if (currentScreen > 1) {
                showOnboardingScreen(currentScreen - 1);
            }
        }
    };
    document.addEventListener('keydown', handleKey);
    window._onboardingKeyHandler = handleKey;
}

// Initialize on load (SPA용)
window.initOnboarding = function () {
    console.log('OOLIMTONG: Mythical Manual initialized');

    initAwakening();
    initPractice();
    initEncounter();
    initProgressDots();
    initCanvas();
    setupOnboardingKeyboard();

    // Show first screen
    showOnboardingScreen(1);

    console.log('Controls: Click to interact, Arrow keys or Enter to navigate');
};


// Add smooth character animations
document.querySelectorAll('.pixel-character').forEach(char => {
    char.style.imageRendering = 'pixelated';
});
