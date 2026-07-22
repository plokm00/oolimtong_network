import React from 'react';

// Common props
interface LogoProps {
    className?: string;
    color?: string;
}

// 1. Mandala Logo (Online)
// Concept: Concentric circles with symmetry, resembling a mandala
export const MandalaLogo: React.FC<LogoProps> = ({ className = "w-12 h-12", color = "currentColor" }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" className="opacity-60" />
        {/* Middle Ring */}
        <circle cx="50" cy="50" r="35" stroke={color} strokeWidth="1" />
        {/* Petal-like shapes */}
        <path d="M50 20 Q65 35 50 50 Q35 35 50 20" stroke={color} strokeWidth="1.5" />
        <path d="M50 80 Q65 65 50 50 Q35 65 50 80" stroke={color} strokeWidth="1.5" />
        <path d="M20 50 Q35 65 50 50 Q35 35 20 50" stroke={color} strokeWidth="1.5" />
        <path d="M80 50 Q65 65 50 50 Q65 35 80 50" stroke={color} strokeWidth="1.5" />
        {/* Inner Core */}
        <circle cx="50" cy="50" r="8" fill={color} className="opacity-80" />
    </svg>
);

// 2. Online Recitation Logo (Online)
// Concept: Abstract sound wave circle or throat chakra visualization
export const OnlineRecitationLogo: React.FC<LogoProps> = ({ className = "w-12 h-12", color = "currentColor" }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Vertical Sound Bars forming a circle hint */}
        <path d="M30 50 L30 50" stroke={color} strokeWidth="4" strokeLinecap="round">
            <animate attributeName="d" values="M30 45 L30 55; M30 30 L30 70; M30 45 L30 55" dur="1.5s" repeatCount="indefinite" />
        </path>
        <path d="M40 50 L40 50" stroke={color} strokeWidth="4" strokeLinecap="round">
            <animate attributeName="d" values="M40 40 L40 60; M40 20 L40 80; M40 40 L40 60" dur="1.5s" begin="0.1s" repeatCount="indefinite" />
        </path>
        <path d="M50 50 L50 50" stroke={color} strokeWidth="4" strokeLinecap="round">
            <animate attributeName="d" values="M50 35 L50 65; M50 15 L50 85; M50 35 L50 65" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
        </path>
        <path d="M60 50 L60 50" stroke={color} strokeWidth="4" strokeLinecap="round">
            <animate attributeName="d" values="M60 40 L60 60; M60 20 L60 80; M60 40 L60 60" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
        </path>
        <path d="M70 50 L70 50" stroke={color} strokeWidth="4" strokeLinecap="round">
            <animate attributeName="d" values="M70 45 L70 55; M70 30 L70 70; M70 45 L70 55" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
        </path>

        {/* Encapsulating Circle */}
        <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="1" className="opacity-30" />
    </svg>
);

// 3. TapDori Logo (Online - GPS circling game)
// Concept: Footstep-circle around a center point
export const TapdoriLogo: React.FC<LogoProps> = ({ className = "w-12 h-12", color = "currentColor" }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Dashed orbit path */}
        <circle cx="50" cy="50" r="36" stroke={color} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
        {/* Center dot (Oolimtong) */}
        <circle cx="50" cy="50" r="5" fill={color} opacity="0.8" />
        {/* Walking figure dot on orbit + arrow suggesting direction */}
        <circle cx="86" cy="50" r="4.5" fill={color} opacity="0.9" />
        {/* Rotation arrow arc */}
        <path
            d="M 78 22 A 36 36 0 0 1 86 50"
            stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"
        />
        {/* Arrowhead */}
        <path d="M 86 50 L 79 44 M 86 50 L 80 56" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
);

// 4. NFC Logo (Online - NFC scanning game)
// Concept: NFC waves radiating from a tag point
export const NFCLogo: React.FC<LogoProps> = ({ className = "w-12 h-12", color = "currentColor" }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Tag rectangle */}
        <rect x="36" y="30" width="28" height="40" rx="4" stroke={color} strokeWidth="2" opacity="0.8" />
        {/* Inner dot */}
        <circle cx="50" cy="50" r="4" fill={color} opacity="0.9" />
        {/* NFC wave arcs (left) */}
        <path d="M 32 40 Q 22 50 32 60" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M 25 34 Q 10 50 25 66" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.35" />
        {/* NFC wave arcs (right) */}
        <path d="M 68 40 Q 78 50 68 60" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M 75 34 Q 90 50 75 66" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.35" />
    </svg>
);

// 5. Concentric Resonance Logo (Offline - TapDori)
// Concept: Expanding ripples/target, implying movement/location
export const ConcentricLogo: React.FC<LogoProps> = ({ className = "w-12 h-12", color = "currentColor" }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="10" stroke={color} strokeWidth="2" />
        <circle cx="50" cy="50" r="20" stroke={color} strokeWidth="1.5" opacity="0.8" />
        <circle cx="50" cy="50" r="30" stroke={color} strokeWidth="1" opacity="0.6" />
        <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="0.5" opacity="0.4" />

        {/* Movement Indicators */}
        <path d="M50 5 L50 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M95 50 L85 50" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M50 95 L50 85" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M5 50 L15 50" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// 4. Offline Recitation Logo (Offline)
// Concept: Mic icon but with 'broadcast' waves to signify physical presence/location
export const OfflineRecitationLogo: React.FC<LogoProps> = ({ className = "w-12 h-12", color = "currentColor" }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Mic Shape */}
        <rect x="38" y="25" width="24" height="35" rx="12" stroke={color} strokeWidth="2" />
        <path d="M38 45 V50 C38 56.6274 43.3726 62 50 62 C56.6274 62 62 56.6274 62 50 V45" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M50 62 V75" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M35 75 H65" stroke={color} strokeWidth="2" strokeLinecap="round" />

        {/* Radiating Waves (Offline/Distance aspect) */}
        <path d="M20 40 Q10 50 20 60" stroke={color} strokeWidth="1.5" fill="none" className="opacity-50" />
        <path d="M80 40 Q90 50 80 60" stroke={color} strokeWidth="1.5" fill="none" className="opacity-50" />
        <path d="M15 35 Q0 50 15 65" stroke={color} strokeWidth="1" fill="none" className="opacity-30" />
        <path d="M85 35 Q100 50 85 65" stroke={color} strokeWidth="1" fill="none" className="opacity-30" />
    </svg>
);
