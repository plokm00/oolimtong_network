/**
 * Central configuration constants.
 * Edit values here instead of hunting through component files.
 */

// ─── Parallax & Node Layout ───────────────────────────────────────────────────
export const PARALLAX_MULTIPLIER = 40;       // px scale factor for mouse parallax
export const GOLDEN_ANGLE = 2.399963;        // ~137.5° in radians — even radial spread
export const REST_RADIUS = 16;               // px — gateway node rest-offset at mouse center

// ─── User Node Spawning ───────────────────────────────────────────────────────
export const USER_NODE_Z_MIN = 0.3;          // minimum z-depth for new user nodes
export const USER_NODE_Z_RANGE = 0.5;        // random range added on top of Z_MIN
export const USER_NODE_SPAWN_MARGIN = 15;    // % from edge — safe spawn zone
export const USER_NODE_SPAWN_WIDTH = 70;     // % width of usable spawn area
export const GATEWAY_EXCLUSION_RADIUS = 12;  // % — min distance from any gateway node
export const SPAWN_ATTEMPTS = 20;            // collision-avoidance retry count

// ─── Starfield Canvas ─────────────────────────────────────────────────────────
export const STAR_COUNT = 3500;
export const CLOUD_COUNT = 18;
export const STAR_PARALLAX_INTENSITY = 30;   // per-star parallax scale
export const CLOUD_PARALLAX_INTENSITY = 15;  // per-cloud parallax scale

// ─── API Caching ──────────────────────────────────────────────────────────────
export const GATEWAY_CACHE_TTL_MS = 30_000;  // 30s — how long the gateway list stays fresh

// ─── Geography ────────────────────────────────────────────────────────────────
export const SEOUL = {
    lat: 37.5665,
    lng: 126.9780,
    address: 'Seoul, Republic of Korea'
} as const;

// ─── UI Interaction ───────────────────────────────────────────────────────────
export const DRAG_THRESHOLD_PX = 50;         // px — swipe distance to trigger prev/next
