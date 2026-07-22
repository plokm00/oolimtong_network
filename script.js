// Character configuration
const characters = {
    mystical: {
        name: 'Mystical Green Spirit',
        folder: 'mystical-green-spirit',
        canvas: document.getElementById('canvas-mystical')
    },
    golden: {
        name: 'Golden Dress Girl',
        folder: 'golden-dress-girl',
        canvas: document.getElementById('canvas-golden')
    },
    chain: {
        name: 'Chain Wielder',
        folder: 'chain-wielder',
        canvas: document.getElementById('canvas-chain')
    }
};

// Current state for each character
const characterStates = {
    mystical: { direction: 'south', image: null },
    golden: { direction: 'south', image: null },
    chain: { direction: 'south', image: null }
};

// Load and display character image
function loadCharacterImage(characterKey, direction) {
    const character = characters[characterKey];
    const imagePath = `characters/${character.folder}/${direction}.png`;

    const img = new Image();
    img.onload = function () {
        const canvas = character.canvas;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scaling to fit 48x48 image into 240x240 canvas (5x scale)
        const scale = 5;
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Center the image
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;

        // Disable image smoothing for crisp pixel art
        ctx.imageSmoothingEnabled = false;

        // Draw the image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        // Store the image
        characterStates[characterKey].image = img;
    };

    img.onerror = function () {
        console.error(`Failed to load image: ${imagePath}`);
    };

    img.src = imagePath;
}

// Handle direction button clicks
function setupDirectionButtons() {
    const buttons = document.querySelectorAll('.direction-btn');

    buttons.forEach(button => {
        button.addEventListener('click', function () {
            const characterKey = this.dataset.character;
            const direction = this.dataset.direction;

            // Update active state for buttons
            const characterButtons = document.querySelectorAll(`[data-character="${characterKey}"]`);
            characterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Update character state and load new image
            characterStates[characterKey].direction = direction;
            loadCharacterImage(characterKey, direction);

            // Add a subtle animation
            const canvas = characters[characterKey].canvas;
            canvas.style.transform = 'scale(0.95)';
            setTimeout(() => {
                canvas.style.transform = 'scale(1)';
            }, 100);
        });
    });
}

// Keyboard controls
function setupKeyboardControls() {
    const directionKeys = {
        'ArrowUp': 'north',
        'ArrowDown': 'south',
        'ArrowLeft': 'west',
        'ArrowRight': 'east',
        'w': 'north',
        's': 'south',
        'a': 'west',
        'd': 'east'
    };

    document.addEventListener('keydown', function (e) {
        const direction = directionKeys[e.key];
        if (!direction) return;

        // Update all characters to the same direction
        Object.keys(characters).forEach(characterKey => {
            characterStates[characterKey].direction = direction;
            loadCharacterImage(characterKey, direction);

            // Update button states
            const buttons = document.querySelectorAll(`[data-character="${characterKey}"]`);
            buttons.forEach(btn => {
                if (btn.dataset.direction === direction) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        });

        e.preventDefault();
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('NINNIK Character Gallery initialized');

    // Load initial images (south direction for all characters)
    Object.keys(characters).forEach(characterKey => {
        loadCharacterImage(characterKey, 'south');
    });

    // Setup event listeners
    setupDirectionButtons();
    setupKeyboardControls();

    console.log('Controls: Click buttons or use arrow keys (↑↓←→) / WASD to change directions');
});

// Add smooth transitions
document.querySelectorAll('.character-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});
