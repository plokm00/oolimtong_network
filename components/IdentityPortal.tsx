import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCcw, CheckCircle2, X } from 'lucide-react';

interface IdentityPortalProps {
    onComplete: (user: { id: string; nickname: string; ninnikTitle: string }) => void;
    onClose: () => void;
}

const NINNIK_PREFIXES = [
    '울림의', '공명의', '침묵의', '각성의', '순례의',
    '빛나는', '깊은', '고요한', '영원의', '숨은',
    '흙의', '바람의', '물결의', '불꽃의', '그림자의',
    '흐르는', '먼 곳의', '태초의', '진동하는'
];

const NINNIK_CORES = [
    '자각자', '수행자', '관망자', '탐색자', '연결자',
    '울림통지기', '순례자', '기억자', '전달자', '수호자',
    '몽상가', '예언자', '귀환자', '깨우침', '발자국',
    '파동술사', '공명인', '관찰자'
];

export const IdentityPortal: React.FC<IdentityPortalProps> = ({ onComplete, onClose }) => {
    const [nickname, setNickname] = useState('');
    const [ninnikPrefix, setNinnikPrefix] = useState('');
    const [ninnikCore, setNinnikCore] = useState('');
    const [step, setStep] = useState(1); // 1: Input (Create/Login), 2: Confirm
    const [isRegistering, setIsRegistering] = useState(false); // Used for loading state
    const [isLoginMode, setIsLoginMode] = useState(true); // Default to Login Mode
    const [loginError, setLoginError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const generatePrefix = () => {
        const prefix = NINNIK_PREFIXES[Math.floor(Math.random() * NINNIK_PREFIXES.length)];
        setNinnikPrefix(prefix);
    };

    const generateCore = () => {
        const core = NINNIK_CORES[Math.floor(Math.random() * NINNIK_CORES.length)];
        setNinnikCore(core);
    };

    const generateTitle = () => {
        generatePrefix();
        generateCore();
    };

    useEffect(() => {
        generateTitle();
    }, []);

    // Auto-dismiss errors
    useEffect(() => {
        if (loginError) {
            const timer = setTimeout(() => setLoginError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [loginError]);

    // Auto-focus input when mode changes
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [isLoginMode]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleNext = async () => {
        if (nickname.trim().length < 1) return;

        setLoginError(null);
        setIsRegistering(true);

        try {
            // Check availability - API returns 200 if user exists
            const res = await fetch(`/api/users?nickname=${encodeURIComponent(nickname)}`);
            if (res.ok) {
                setLoginError("NAME ALREADY TAKEN");
            } else {
                // 404 means available
                setStep(2);
            }
        } catch (e) {
            setLoginError("NETWORK ERROR");
        } finally {
            setIsRegistering(false);
        }
    };

    const handleComplete = async () => {
        setIsRegistering(true);
        const userId = `ninnik-${crypto.randomUUID().slice(0, 8)}`;
        const ninnikTitle = `${ninnikPrefix} ${ninnikCore}`;
        const userData = { id: userId, nickname, ninnikTitle };

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const registeredUser = await response.json();
                localStorage.setItem('ninnik_user', JSON.stringify(registeredUser));
                onComplete(registeredUser);
            } else {
                setLoginError("NAME ALREADY TAKEN");
                // If it failed at this stage, go back to step 1 to fix it
                setStep(1);
            }
        } catch (error) {
            console.error("Error registering user:", error);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleRecover = async () => {
        setIsRegistering(true);
        setLoginError(null);

        try {
            const response = await fetch(`/api/users?nickname=${encodeURIComponent(nickname)}`);
            if (response.ok) {
                const existingUser = await response.json();
                localStorage.setItem('ninnik_user', JSON.stringify(existingUser));
                onComplete(existingUser);
            } else {
                setLoginError("IDENTITY NOT FOUND");
            }
        } catch (error) {
            setLoginError("NETWORK ERROR");
        } finally {
            setIsRegistering(false);
        }
    };

    // Consolidated handler for the main action button
    const handleAction = () => {
        if (isLoginMode) {
            handleRecover();
        } else {
            handleNext();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pointer-events-auto bg-[#0b1617]/95 backdrop-blur-xl rounded w-[280px] p-5 relative overflow-hidden flex flex-col h-[295px] shadow-[0_0_80px_rgba(0,0,0,0.8)] text-center"
            >
                {/* Toast Notification Layer */}
                <AnimatePresence>
                    {loginError && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-16 left-0 right-0 z-[60] flex justify-center pointer-events-none"
                        >
                            <div className="bg-[#ccff00] text-black text-[10px] font-bold px-3 py-1 rounded shadow-lg uppercase tracking-widest">
                                {loginError}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-50"
                >
                    <X size={20} />
                </button>

                {/* Minimalist Header - Dynamic Title */}
                <div className="w-full flex flex-col items-center mb-3">
                    <h2 className="text-lg font-bold text-white tracking-tighter uppercase leading-tight pb-2 w-full border-b border-white/20">
                        {isLoginMode ? "LOG IN" : "IDENTITY REGISTRATION"}
                    </h2>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="mode-input"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-3">
                                    {!isLoginMode && (
                                        <div className="grid grid-cols-2 gap-0 py-3 border-y border-white/5 bg-white/[0.02]">
                                            <div className="flex items-center justify-center gap-1.5 group border-r border-white/5">
                                                <div className="w-[75px] text-center">
                                                    <span className="text-[#CCFF00] text-[12px] font-mono tracking-widest opacity-80 truncate block">{ninnikPrefix}</span>
                                                </div>
                                                <button onClick={generatePrefix} className="text-white/20 hover:text-[#CCFF00] transition-colors flex-none">
                                                    <RefreshCcw size={15} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-center gap-1.5 group">
                                                <div className="w-[75px] text-center">
                                                    <span className="text-[#CCFF00] text-[12px] font-mono tracking-widest opacity-80 truncate block">{ninnikCore}</span>
                                                </div>
                                                <button onClick={generateCore} className="text-white/20 hover:text-[#CCFF00] transition-colors flex-none">
                                                    <RefreshCcw size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        ref={inputRef}
                                        type="text"
                                        autoFocus
                                        value={nickname}
                                        onChange={(e) => {
                                            setNickname(e.target.value);
                                            setLoginError(null);
                                        }}
                                        placeholder={isLoginMode ? "MY NINNIKIAN NAME" : "ENTER NAME"}
                                        maxLength={10}
                                        className="w-full bg-white/5 text-center text-white text-sm py-3 px-3 focus:outline-none focus:bg-white/10 transition-colors placeholder:text-white/20 font-bold tracking-widest uppercase border-b border-white/10 focus:border-[#CCFF00]/50"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && nickname.trim().length >= 1) {
                                                handleAction();
                                            }
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={handleAction}
                                    disabled={nickname.trim().length < 1 || isRegistering}
                                    className={`w-full py-2.5 text-[10px] font-bold tracking-[0.2em] rounded flex items-center justify-center gap-2 transition-all uppercase ${nickname.trim().length >= 1 && !isRegistering
                                        ? "bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:bg-[#b3ff00]"
                                        : "bg-white/5 text-white/20 cursor-default border border-white/5"
                                        }`}
                                >
                                    {isRegistering ? "PROCESSING..." : (isLoginMode ? "LOG IN" : "CREATE")}
                                </button>

                                {/* Bottom Navigation - Moved INSIDE Step 1 for smooth transition */}
                                <div className="mt-4 flex justify-center gap-4">
                                    <button
                                        onClick={() => {
                                            setIsLoginMode(true);
                                            setNickname('');
                                            setLoginError(null);
                                        }}
                                        className={`text-[9px] font-bold tracking-[0.2em] transition-colors uppercase ${isLoginMode ? 'text-[#CCFF00]' : 'text-white/20 hover:text-white'}`}
                                    >
                                        LOG IN
                                    </button>
                                    <div className="w-[1px] h-3 bg-white/10 my-auto"></div>
                                    <button
                                        onClick={() => {
                                            setIsLoginMode(false);
                                            setNickname('');
                                            setLoginError(null);
                                        }}
                                        className={`text-[9px] font-bold tracking-[0.2em] transition-colors uppercase ${!isLoginMode ? 'text-[#CCFF00]' : 'text-white/20 hover:text-white'}`}
                                    >
                                        SIGN UP
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step-confirm"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="py-3 border-y border-white/5 text-center bg-white/[0.02]">
                                    <div className="text-[#CCFF00] text-[9px] font-mono tracking-widest mb-1 opacity-70">
                                        [{ninnikPrefix} {ninnikCore}]
                                    </div>
                                    <div className="text-xl font-bold text-white tracking-widest italic">{nickname}</div>
                                    <div className="mt-4 flex justify-center gap-4">
                                        <button
                                            onClick={generatePrefix}
                                            className="text-white/20 hover:text-[#CCFF00] transition-colors flex flex-col items-center gap-1"
                                            title="Reroll Prefix"
                                        >
                                            <RefreshCcw size={12} />
                                            <span className="text-[6px] uppercase tracking-tighter">Prefix</span>
                                        </button>
                                        <button
                                            onClick={generateCore}
                                            className="text-white/20 hover:text-[#CCFF00] transition-colors flex flex-col items-center gap-1"
                                            title="Reroll Core"
                                        >
                                            <RefreshCcw size={12} />
                                            <span className="text-[6px] uppercase tracking-tighter">Core</span>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleComplete}
                                    disabled={isRegistering}
                                    className={`w-full py-2.5 text-[10px] font-bold tracking-[0.2em] rounded flex items-center justify-center gap-2 transition-all uppercase ${!isRegistering
                                        ? "bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:bg-[#b3ff00]"
                                        : "bg-white/5 text-white/20 cursor-default border border-white/5"
                                        }`}
                                >
                                    {isRegistering ? "INITIALIZING..." : "ENTER WORLD"}
                                </button>

                                <button
                                    onClick={() => {
                                        setStep(1);
                                        // Keeping mode as is when going back, usually
                                        setLoginError(null);
                                    }}
                                    className="w-full text-[9px] text-white/30 hover:text-[#CCFF00] transition-colors uppercase tracking-widest font-mono"
                                >
                                    BACK
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Navigation moved inside Step 1 */}
            </motion.div>
        </div>
    );
};
