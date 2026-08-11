/**
 * unify.js
 * Enforces global visuals and smooth transitions to create a single-game feel.
 */

(function () {
    // 1. Enforce Background
    function enforceBackground() {
        // Assume execution from oolimtong/ root
        const bgUrl = 'assets/bg_field.png';

        // Apply styles directly to body to override any CSS issues
        Object.assign(document.body.style, {
            backgroundImage: `url('${bgUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#0a0e27' // Fallback deep blue
        });
    }

    // 2. SPA Router
    window.navigateSPA = async function (viewName) {
        const container = document.getElementById('spa-view-container');
        console.log(`Navigating to view: ${viewName}`);

        // 1. Fade out current view
        if (container) container.classList.remove('show');
        await new Promise(r => setTimeout(r, 500));

        try {
            // 2. Fetch fragment (ensure path is correct relative to index.html)
            const response = await fetch(`fragments/${viewName}.html`);
            if (!response.ok) throw new Error(`Failed to load view: ${viewName}`);
            const html = await response.text();
            // 3. Inject HTML
            if (container) {
                container.innerHTML = html;

                // Cleanup previous view if needed
                if (window._compassKeyHandler) {
                    document.removeEventListener('keydown', window._compassKeyHandler);
                    window._compassKeyHandler = null;
                }
                if (window._onboardingKeyHandler) {
                    document.removeEventListener('keydown', window._onboardingKeyHandler);
                    window._onboardingKeyHandler = null;
                }

                // 4. Initialize specific view logic
                const initMap = {
                    'call': 'initCall',
                    'onboarding': 'initOnboarding',
                    'compass': 'initCompass'
                };

                const initFunc = initMap[viewName];
                if (initFunc && typeof window[initFunc] === 'function') {
                    console.log(`Running init: ${initFunc}`);
                    window[initFunc]();
                } else {
                    console.warn(`Init function ${initFunc} not found or not a function`);
                }

                // 5. Fade in
                container.classList.add('show');
            }
        } catch (err) {
            console.error('SPA Route Error:', err);
            if (container) {
                container.innerHTML = `<div style="padding: 2rem; color: white; background: rgba(0,0,0,0.8); z-index: 1000; position: relative;">
                        <h2>동적 로딩 오류</h2>
                        <p>${err.message}</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; cursor: pointer;">새로고침</button>
                    </div>`;
                container.classList.add('show');
            }
        }
    };

    // Override existing navigateGame for legacy support within SPA
    window.navigateGame = function (target) {
        const view = target.replace('.html', '');
        window.navigateSPA(view);
    };

    // Initialize
    function init() {
        console.log('OOLIMTONG SPA Core Active');
        enforceBackground();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
