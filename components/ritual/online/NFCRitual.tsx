'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, CheckCircle2, ChevronDown, Loader2, Smartphone } from 'lucide-react';

// ── Props ──────────────────────────────────────────────
interface NFCRitualProps {
    onComplete: (score: number) => void;
    gatewayId: string;
}

interface ScannedFragment {
    serial: string;
    scannedAt: number;
    fragmentIndex: number;
}

// ── 조각 텍스트 (6개) ────────────────────────────────────
const FRAGMENTS = [
    {
        title: '첫 번째 울림',
        poem: '소리는 공간을 채우기 전에\n먼저 공간이 된다.',
        hint: '울림통 위쪽 테두리 근처',
    },
    {
        title: '두 번째 울림',
        poem: '두드리면 대답하고\n침묵하면 반향한다.',
        hint: '울림통 측면 하단',
    },
    {
        title: '세 번째 울림',
        poem: '파동은 끝나지 않는다\n다만 우리의 귀가 멈출 뿐.',
        hint: '울림통 내부 벽면',
    },
    {
        title: '네 번째 울림',
        poem: '함께 울릴 때\n각각의 떨림은 하나가 된다.',
        hint: '울림통 상단 안쪽',
    },
    {
        title: '다섯 번째 울림',
        poem: '공명은 기억이다\n모든 소리가 지나간 자리.',
        hint: '울림통 외벽 중단',
    },
    {
        title: '여섯 번째 울림',
        poem: '빈 곳이 가득 찬 곳보다\n더 많이 울린다.',
        hint: '울림통 바닥 근처',
    },
];

const TARGET_SCANS = 6;

// ── Component ──────────────────────────────────────────
export const NFCRitual: React.FC<NFCRitualProps> = ({ onComplete, gatewayId }) => {
    const storageKey = `ninnik_nfc_scanned_${gatewayId}`;

    const loadScanned = (): ScannedFragment[] => {
        try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]'); }
        catch { return []; }
    };
    const saveScanned = (arr: ScannedFragment[]) =>
        localStorage.setItem(storageKey, JSON.stringify(arr));

    const [scanned, setScanned]           = useState<ScannedFragment[]>(loadScanned);
    const [scanning, setScanning]         = useState(false);
    const [newFragment, setNewFragment]   = useState<ScannedFragment | null>(null);
    const [error, setError]               = useState<string | null>(null);
    const [expandedIdx, setExpandedIdx]   = useState<number | null>(null);
    // null = checking, true = supported, false = not supported
    const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);

    const abortRef      = useRef<AbortController | null>(null);
    const onCompleteRef = useRef(onComplete);
    useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

    // ── NFC support check ─────────────────────────────
    useEffect(() => {
        setNfcSupported('NDEFReader' in window);
    }, []);

    // ── Auto-complete ─────────────────────────────────
    useEffect(() => {
        if (scanned.length >= TARGET_SCANS) {
            const t = setTimeout(() => onCompleteRef.current(100), 1200);
            return () => clearTimeout(t);
        }
    }, [scanned.length]);

    // ── Scan logic ────────────────────────────────────
    const startScan = useCallback(async () => {
        if (!nfcSupported || scanning) return;
        setError(null);
        setScanning(true);

        try {
            abortRef.current = new AbortController();
            const NDEFReaderClass = (window as any).NDEFReader;
            const reader = new NDEFReaderClass();
            await reader.scan({ signal: abortRef.current.signal });

            reader.onreading = (event: any) => {
                const serial: string = event.serialNumber ?? String(Date.now());
                setScanned(prev => {
                    if (prev.some(f => f.serial === serial)) return prev;
                    const fragmentIndex = Math.min(prev.length, FRAGMENTS.length - 1);
                    const fragment: ScannedFragment = { serial, scannedAt: Date.now(), fragmentIndex };
                    const next = [...prev, fragment];
                    saveScanned(next);
                    setNewFragment(fragment);
                    setTimeout(() => setNewFragment(null), 3500);
                    return next;
                });
            };

            reader.onreadingerror = () => {
                setError("couldn't read tag. hold closer and try again.");
            };
        } catch (err: any) {
            if (err?.name === 'AbortError') { setScanning(false); return; }
            if (err?.name === 'NotAllowedError') setError('NFC permission required.');
            else setError("couldn't start NFC.");
            setScanning(false);
        }
    }, [nfcSupported, scanning]);

    const stopScan = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setScanning(false);
    }, []);

    useEffect(() => () => { abortRef.current?.abort(); }, []);

    const allDone  = scanned.length >= TARGET_SCANS;
    const progress = scanned.length / TARGET_SCANS;

    // ── Main UI (항상 표시 — 지원 여부와 무관) ────────────
    return (
        <div className="flex flex-col h-full overflow-hidden text-white">

            {/* ── Top: progress ring + scan CTA ── */}
            <div className="flex-none flex flex-col items-center gap-3 px-4 pt-4 pb-3 border-b border-white/5">

                {/* Circular progress */}
                <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                        {/* Track */}
                        <circle cx="40" cy="40" r="34"
                            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                        {/* Progress arc */}
                        <circle cx="40" cy="40" r="34"
                            fill="none"
                            stroke="#CCFF00"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 34 * progress} ${2 * Math.PI * 34}`}
                            className="transition-all duration-700"
                            style={{ filter: progress > 0 ? 'drop-shadow(0 0 5px #CCFF0070)' : 'none' }}
                        />
                    </svg>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {allDone ? (
                            <CheckCircle2 size={22} className="text-[#CCFF00]" />
                        ) : (
                            <>
                                <span className="text-[15px] font-bold text-white leading-none">
                                    {scanned.length}
                                </span>
                                <span className="text-[8px] text-white/30 font-mono">/ {TARGET_SCANS}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Dot indicators */}
                <div className="flex gap-1.5">
                    {Array.from({ length: TARGET_SCANS }).map((_, i) => (
                        <motion.div
                            key={i}
                            animate={i === scanned.length - 1 ? { scale: [1.5, 1] } : {}}
                            transition={{ duration: 0.4 }}
                            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                                i < scanned.length
                                    ? 'bg-[#CCFF00]'
                                    : 'bg-white/12 border border-white/15'
                            }`}
                        />
                    ))}
                </div>

                {/* Scan button / status */}
                {allDone ? (
                    <div className="flex items-center gap-1.5 text-[#CCFF00]">
                        <CheckCircle2 size={12} />
                        <span className="text-[10px] font-bold tracking-wide">all fragments collected</span>
                    </div>
                ) : nfcSupported === false ? (
                    /* NFC 미지원 기기 — 버튼 비활성, 안내 인라인 표시 */
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/4">
                        <Smartphone size={11} className="text-white/25 shrink-0" />
                        <span className="text-[9px] text-white/30 font-mono">
                            Android + Chrome에서만 스캔 가능
                        </span>
                    </div>
                ) : (
                    <button
                        onClick={scanning ? stopScan : startScan}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold tracking-wide transition-all ${
                            scanning
                                ? 'bg-white/8 text-white/40 border border-white/15'
                                : 'bg-[#CCFF00]/12 border border-[#CCFF00]/35 text-[#CCFF00] hover:bg-[#CCFF00]/22'
                        }`}
                    >
                        {scanning
                            ? <><Loader2 size={11} className="animate-spin" /> scanning… (tap to stop)</>
                            : <><Wifi size={11} /> start NFC scan</>
                        }
                    </button>
                )}
            </div>

            {/* ── Scan ripple animation ── */}
            <AnimatePresence>
                {scanning && !allDone && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-none flex flex-col items-center gap-1 py-3"
                    >
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full border border-[#CCFF00]/25"
                                    style={{ width: 16 + i * 10, height: 16 + i * 10 }}
                                    animate={{ opacity: [0.6, 0], scale: [1, 1.4] }}
                                    transition={{ duration: 1.6, delay: i * 0.4, repeat: Infinity }}
                                />
                            ))}
                            <Wifi size={13} className="text-[#CCFF00]/60" />
                        </div>
                        <p className="text-[9px] text-white/55 font-mono">hold device close to the gateway</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── New fragment toast ── */}
            <AnimatePresence>
                {newFragment && (
                    <motion.div
                        key="toast"
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="mx-3 my-1 p-2.5 bg-[#CCFF00]/10 border border-[#CCFF00]/25 rounded-lg"
                    >
                        <p className="text-[9px] text-[#CCFF00]/70 font-mono tracking-wider mb-0.5">✦ new fragment found</p>
                        <p className="text-[10px] font-bold">
                            {FRAGMENTS[newFragment.fragmentIndex]?.title}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Error ── */}
            {error && (
                <div className="mx-3 my-1 flex items-start gap-1.5 bg-rose-500/10 border border-rose-500/25 rounded p-2.5">
                    <WifiOff size={10} className="text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-[9px] text-rose-300">{error}</p>
                </div>
            )}

            {/* ── Fragment list ── */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 mt-1 flex flex-col gap-1.5">

                {scanned.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="relative w-16 h-16 opacity-20">
                            {[1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className="absolute inset-0 rounded-full border border-white/40"
                                    style={{ margin: i * 4 }}
                                />
                            ))}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Wifi size={18} className="text-white/50" />
                            </div>
                        </div>
                        <p className="text-[10px] text-white/55 font-mono text-center leading-loose">
                            울림통 곳곳에 숨겨진<br />
                            NFC 태그를 찾아보세요.<br />
                            <span className="text-white/45">총 {TARGET_SCANS}개의 조각이 기다립니다.</span>
                        </p>
                    </div>
                ) : (
                    <>
                        <p className="text-[9px] text-white/55 font-mono tracking-wider py-0.5 border-t border-white/5 pt-2">
                            collected fragments
                        </p>

                        {scanned.map((frag, idx) => {
                            const text   = FRAGMENTS[frag.fragmentIndex];
                            const isOpen = expandedIdx === idx;
                            return (
                                <button
                                    key={frag.serial}
                                    onClick={() => setExpandedIdx(isOpen ? null : idx)}
                                    className="w-full text-left bg-white/4 hover:bg-white/6 border border-white/8 rounded-lg overflow-hidden transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 px-3 py-2.5">
                                        {/* Index badge */}
                                        <span className="text-[9px] font-mono text-[#CCFF00]/40 w-5 shrink-0 text-right">
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        {/* Title */}
                                        <span className="text-[10px] text-white/80 flex-1 font-medium text-left">
                                            {text?.title ?? `fragment #${idx + 1}`}
                                        </span>
                                        {/* Expand chevron */}
                                        <ChevronDown
                                            size={11}
                                            className={`text-white/20 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                                        />
                                    </div>

                                    {/* Expanded poem */}
                                    <AnimatePresence>
                                        {isOpen && text && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-3 pt-1 border-t border-white/5">
                                                    <p className="text-[9px] text-white/65 italic whitespace-pre-line leading-relaxed font-light">
                                                        {text.poem}
                                                    </p>
                                                    <p className="text-[9px] text-white/55 font-mono mt-2 tracking-wider">
                                                        hint — {text.hint}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            );
                        })}

                        {/* Remaining placeholder slots */}
                        {scanned.length < TARGET_SCANS && Array.from({ length: TARGET_SCANS - scanned.length }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 px-3 py-2.5 border border-dashed border-white/8 rounded-lg opacity-20"
                            >
                                <span className="text-[9px] font-mono text-white/20 w-5 text-right">
                                    {String(scanned.length + i + 1).padStart(2, '0')}
                                </span>
                                <span className="text-[9px] text-white/50 italic">undiscovered</span>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};
