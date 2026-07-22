import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Footprints, RefreshCw, Timer } from 'lucide-react';
import { useDeviceMotion } from '@/hooks/sensors/useDeviceMotion';

interface TapDoriRitualProps {
    onComplete: (score: number) => void;
}

export const TapDoriRitual: React.FC<TapDoriRitualProps> = ({ onComplete }) => {
    const { motion: deviceMotion, requestPermission, permissionGranted } = useDeviceMotion();
    const [steps, setSteps] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [timeSpent, setTimeSpent] = useState(0);
    const [isActive, setIsActive] = useState(false);

    // Step detection helper
    const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });
    const threshold = 1.5; // Threshold for step detection

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isActive) {
            timer = setInterval(() => {
                setTimeSpent(p => p + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isActive]);

    useEffect(() => {
        if (!isActive || !deviceMotion) return;

        const { acceleration, rotationRate } = deviceMotion;

        // Simple step counting logic
        if (acceleration) {
            const deltaX = Math.abs((acceleration.x || 0) - lastAccelRef.current.x);
            const deltaY = Math.abs((acceleration.y || 0) - lastAccelRef.current.y);
            const deltaZ = Math.abs((acceleration.z || 0) - lastAccelRef.current.z);

            if (deltaX + deltaY + deltaZ > threshold) {
                setSteps(prev => prev + 1);
            }
            lastAccelRef.current = { x: acceleration.x || 0, y: acceleration.y || 0, z: acceleration.z || 0 };
        }

        // Rotation accumulation
        if (rotationRate) {
            // Approximation of rotation accumulation (degrees)
            const rate = Math.abs(rotationRate.alpha || 0); // Z-axis rotation usually
            if (rate > 10) {
                setRotation(prev => prev + (rate * 0.1)); // 0.1s interval roughly
            }
        }

    }, [deviceMotion, isActive]);

    const [level, setLevel] = useState(1);
    const MAX_LEVELS = 30;

    useEffect(() => {
        // Completion Check for Current Level
        // E.g., 20 steps OR rotation + time per level
        // Simplification for testing: 
        const currentScore = Math.min(100, (steps * 5) + (rotation / 360 * 50) + (timeSpent * 5)); // Faster progression per level

        if (currentScore >= 100) {
            if (level < MAX_LEVELS) {
                // Next Level
                setLevel(l => l + 1);
                // Reset metrics for next level
                setSteps(0);
                setRotation(0);
                setTimeSpent(0);
            } else {
                // Complete
                setIsActive(false);
                onComplete(100);
            }
        }
    }, [steps, rotation, timeSpent, onComplete, level]);

    const handleStart = async () => {
        const granted = await requestPermission();
        if (granted) {
            setIsActive(true);
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-4 gap-4">
            <div className="text-center mb-2">
                <h3 className="text-[#CCFF00] font-bold text-lg uppercase tracking-widest">Tap-Dori</h3>
                <p className="text-white font-bold text-xs mb-1">LEVEL {level} / {MAX_LEVELS}</p>
                <p className="text-white/40 text-[10px]">Walk around the gateway / Rotate yourself</p>
            </div>

            {!isActive ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <button
                        onClick={handleStart}
                        className="bg-[#CCFF00] text-black font-bold px-8 py-4 rounded-full text-xl shadow-[0_0_30px_#CCFF00] animate-pulse"
                    >
                        START RITUAL
                    </button>
                    <p className="mt-4 text-white/40 text-xs max-w-[200px] text-center">
                        Requires Motion Sensors permission. Please allow if prompted.
                    </p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-2 gap-4">
                    {/* Steps Card */}
                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/10">
                        <Footprints className="text-blue-400 mb-2" size={32} />
                        <div className="text-3xl font-black text-white">{steps}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Steps</div>
                    </div>

                    {/* Rotation Card */}
                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/10">
                        <RefreshCw className="text-purple-400 mb-2" size={32} />
                        <div className="text-3xl font-black text-white">{Math.floor(rotation)}°</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Rotation</div>
                    </div>

                    {/* Timer Card (Full Width) */}
                    <div className="col-span-2 bg-white/5 rounded-2xl p-4 flex items-center justify-between px-8 border border-white/10">
                        <div className="flex items-center gap-4">
                            <Timer className="text-orange-400" size={32} />
                            <div className="flex flex-col text-left">
                                <div className="text-2xl font-black text-white">{timeSpent}s</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest">Duration</div>
                            </div>
                        </div>
                        {/* Progress Ring or Bar */}
                        <div className="w-16 h-16 relative flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                                <motion.circle
                                    cx="32" cy="32" r="28"
                                    stroke="#CCFF00"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray={175}
                                    strokeDashoffset={175 - (175 * Math.min(1, ((steps * 5 + rotation / 360 * 50 + timeSpent * 5) / 100)))}
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
