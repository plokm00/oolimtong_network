/**
 * Resonance Calculation Algorithm
 * Based on the formula: R = (I × F) / log₁₀(T_current - T_ritual + 2)
 */

// Resonance Data Structure
class ResonanceEvent {
    constructor(location, intensity, frequency, timestamp) {
        this.location = location; // {lat, lng, name}
        this.intensity = intensity; // 0.0 ~ 1.0
        this.frequency = frequency; // Hz
        this.timestamp = timestamp; // Unix timestamp (ms)
    }
}

// Mock Data: Simulated resonance events in Gangwon region
const mockResonanceData = [
    {
        id: 1,
        name: '설악산 울림통',
        location: { lat: 38.119444, lng: 128.465278 },
        lastRitual: Date.now() - (3 * 60 * 60 * 1000), // 3 hours ago
        intensity: 0.85,
        frequency: 432 // Hz (sacred frequency)
    },
    {
        id: 2,
        name: '강릉 정동진 울림통',
        location: { lat: 37.688889, lng: 129.033056 },
        lastRitual: Date.now() - (24 * 60 * 60 * 1000), // 1 day ago
        intensity: 0.65,
        frequency: 528 // Hz (love frequency)
    },
    {
        id: 3,
        name: '평창 대관령 울림통',
        location: { lat: 37.682222, lng: 128.718889 },
        lastRitual: Date.now() - (7 * 24 * 60 * 60 * 1000), // 1 week ago
        intensity: 0.45,
        frequency: 396 // Hz (liberation frequency)
    },
    {
        id: 4,
        name: '속초 영랑호 울림통',
        location: { lat: 38.207222, lng: 128.598611 },
        lastRitual: Date.now() - (10 * 60 * 1000), // 10 minutes ago
        intensity: 0.95,
        frequency: 639 // Hz (connection frequency)
    }
];

/**
 * Calculate resonance coefficient
 * @param {number} intensity - Ritual intensity (0.0 - 1.0)
 * @param {number} frequency - Voice frequency (Hz)
 * @param {number} currentTime - Current timestamp (ms)
 * @param {number} ritualTime - Last ritual timestamp (ms)
 * @returns {number} Resonance coefficient
 */
function calculateResonance(intensity, frequency, currentTime, ritualTime) {
    // Time difference in milliseconds
    const timeDiff = Math.max(0, currentTime - ritualTime);

    // Convert to hours for more reasonable decay
    const timeDiffHours = timeDiff / (1000 * 60 * 60);

    // Calculate resonance using the formula
    // Adding 2 to avoid log(0) and provide smooth decay
    const resonance = (intensity * frequency) / Math.log10(timeDiffHours + 2);

    return resonance;
}

/**
 * Calculate all active resonances
 * @returns {Array} Array of resonance data with calculated values
 */
function calculateAllResonances() {
    const currentTime = Date.now();

    return mockResonanceData.map(node => {
        const resonance = calculateResonance(
            node.intensity,
            node.frequency,
            currentTime,
            node.lastRitual
        );

        return {
            ...node,
            resonance: resonance,
            decayFactor: (currentTime - node.lastRitual) / (1000 * 60 * 60) // hours
        };
    });
}

/**
 * Get the strongest resonance
 * @returns {Object} Node with highest resonance
 */
function getStrongestResonance() {
    const resonances = calculateAllResonances();
    return resonances.reduce((max, node) =>
        node.resonance > max.resonance ? node : max
    );
}

/**
 * Calculate distance between two points (simplified)
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} Distance in km
 */
function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

/**
 * Simulate a ritual performance
 * @param {number} nodeId - ID of the node to perform ritual at
 * @returns {Object} Ritual result
 */
function performRitual(nodeId) {
    const node = mockResonanceData.find(n => n.id === nodeId);

    if (!node) {
        return { success: false, message: 'Node not found' };
    }

    // Simulate ritual performance
    const userIntensity = Math.random() * 0.3 + 0.7; // 0.7 - 1.0
    const userFrequency = Math.random() * 200 + 400; // 400-600 Hz

    // Update node data
    node.lastRitual = Date.now();
    node.intensity = Math.min(1.0, node.intensity + userIntensity * 0.2);

    // Calculate new resonance
    const newResonance = calculateResonance(
        node.intensity,
        node.frequency,
        Date.now(),
        node.lastRitual
    );

    return {
        success: true,
        node: node,
        resonance: newResonance,
        userContribution: {
            intensity: userIntensity,
            frequency: userFrequency
        }
    };
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateResonance,
        calculateAllResonances,
        getStrongestResonance,
        calculateDistance,
        performRitual,
        mockResonanceData
    };
}
