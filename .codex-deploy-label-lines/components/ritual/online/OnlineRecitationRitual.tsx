'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Play, Pause, RotateCcw, Check, ChevronRight } from 'lucide-react';

// ── Props ──────────────────────────────────────────────
interface OnlineRecitationRitualProps {
    onComplete: (score: number) => void;
    level: number;        // 1–30, current word index
    onLevelUp: () => void;
}

// ── 단어 목록 (30개 임시, 추후 니닉어로 교체) ─────────────
const WORDS = [
    // 명사 1–10
    { w: '우무 도리',    t: 'noun' },
    { w: '나카 보',      t: 'noun' },
    { w: '시라 투',      t: 'noun' },
    { w: '타하 카',      t: 'noun' },
    { w: '모루 구',      t: 'noun' },
    { w: '베레 칸',      t: 'noun' },
    { w: '수리 나',      t: 'noun' },
    { w: '키오 라',      t: 'noun' },
    { w: '제르 마',      t: 'noun' },
    { w: '파라 고',      t: 'noun' },
    // verb 11–20
    { w: '쿠바 루',      t: 'verb' },
    { w: '티리 카',      t: 'verb' },
    { w: '호모 사',      t: 'verb' },
    { w: '루엔 다',      t: 'verb' },
    { w: '가라 나',      t: 'verb' },
    { w: '디카 투',      t: 'verb' },
    { w: '메루 샤',      t: 'verb' },
    { w: '포로 무',      t: 'verb' },
    { w: '세케 라',      t: 'verb' },
    { w: '카리 노',      t: 'verb' },
    // adj / adv 21–30
    { w: '비라 모',      t: 'adj' },
    { w: '추무 쿠',      t: 'adj' },
    { w: '네라 호',      t: 'adv'  },
    { w: '사비 투',      t: 'adj' },
    { w: '로코 마',      t: 'adj' },
    { w: '히리 야',      t: 'adj' },
    { w: '투루 파',      t: 'adj' },
    { w: '미카 노',      t: 'adj' },
    { w: '오라 부',      t: 'adj' },
    { w: '야자 루',      t: 'adj' },
] as const;

const TOTAL      = WORDS.length;  // 30
const MAX_SEC    = 4;
const BAR_COUNT  = 26;
const INTRO_KEY  = 'ninnik_voice_bank_intro_seen';
const DB_NAME    = 'ninnik_voice_bank';
const DB_STORE   = 'clips';

// ── IndexedDB helpers ──────────────────────────────────
function openDB(): Promise<IDBDatabase> {
    return new Promise((res, rej) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () =>
            req.result.createObjectStore(DB_STORE, { keyPath: 'idx' });
        req.onsuccess = () => res(req.result);
        req.onerror   = () => rej(req.error);
    });
}
async function saveClip(idx: number, blob: Blob): Promise<void> {
    const db = await openDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put({ idx, blob, word: WORDS[idx]?.w, ts: Date.now() });
        tx.oncomplete = () => res();
        tx.onerror    = () => rej(tx.error);
    });
}
async function loadClip(idx: number): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((res, rej) => {
        const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(idx);
        req.onsuccess = () => res((req.result as any)?.blob ?? null);
        req.onerror   = () => rej(req.error);
    });
}

// ── Word type badge style ──────────────────────────────
const typeCls = (t: string) =>
    t === 'noun' ? 'text-amber-400 border-amber-400/30 bg-amber-400/8'
    : t === 'verb' ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/8'
    :               'text-violet-400 border-violet-400/30 bg-violet-400/8';

// ── Component ──────────────────────────────────────────
type Screen = 'intro' | 'record' | 'review';

export const OnlineRecitationRitual: React.FC<OnlineRecitationRitualProps> = ({
    onComplete, level, onLevelUp,
}) => {
    const wordIdx = Math.min(level - 1, TOTAL - 1);
    const word    = WORDS[wordIdx];
    const isDone  = level > TOTAL;

    const [screen, setScreen]             = useState<Screen>('record');
    const [recState, setRecState]         = useState<'idle' | 'recording'>('idle');
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [existingBlob, setExistingBlob] = useState<Blob | null>(null);
    const [bars, setBars]                 = useState<number[]>(new Array(BAR_COUNT).fill(2));
    const [elapsed, setElapsed]           = useState(0);
    const [isPlaying, setIsPlaying]       = useState(false);
    const [micError, setMicError]         = useState<string | null>(null);

    const recorderRef  = useRef<MediaRecorder | null>(null);
    const chunksRef    = useRef<BlobPart[]>([]);
    const streamRef    = useRef<MediaStream | null>(null);
    const audioCtxRef  = useRef<AudioContext | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRef     = useRef<HTMLAudioElement | null>(null);
    const blobUrlRef   = useRef<string | null>(null);

    // ── Init ─────────────────────────────────────────
    useEffect(() => {
        const seen = localStorage.getItem(INTRO_KEY);
        setScreen(seen ? 'record' : 'intro');
    }, []);

    useEffect(() => {
        setRecordedBlob(null);
        loadClip(wordIdx).then(b => setExistingBlob(b ?? null));
    }, [wordIdx]);

    // ── Cleanup ───────────────────────────────────────
    useEffect(() => () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
            audioCtxRef.current.close().catch(e => console.warn('AudioContext close error:', e));
        }
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    }, []);

    // ── Waveform visualizer ───────────────────────────
    const startViz = (analyser: AnalyserNode) => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
            analyser.getByteFrequencyData(data);
            setBars(Array.from({ length: BAR_COUNT }, (_, i) =>
                Math.max(2, data[Math.floor(i * data.length / BAR_COUNT)] / 3.5)
            ));
            animFrameRef.current = requestAnimationFrame(tick);
        };
        animFrameRef.current = requestAnimationFrame(tick);
    };

    // ── Record ────────────────────────────────────────
    const startRec = useCallback(async () => {
        setMicError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const ctx      = new AudioContext();
            audioCtxRef.current = ctx;
            const src      = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            startViz(analyser);

            const rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            chunksRef.current = [];
            rec.ondataavailable = e => chunksRef.current.push(e.data);
            rec.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(blob);
                stream.getTracks().forEach(t => t.stop());
                if (ctx.state !== 'closed') {
                    ctx.close().catch(e => console.warn('AudioContext close error:', e));
                }
                if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                if (timerRef.current) clearInterval(timerRef.current);
                setBars(new Array(BAR_COUNT).fill(2));
                setRecState('idle');
                setElapsed(0);
                setScreen('review');
            };
            rec.start();
            recorderRef.current = rec;
            setElapsed(0);
            setRecState('recording');

            timerRef.current = setInterval(() => {
                setElapsed(prev => {
                    const next = +(prev + 0.1).toFixed(1);
                    if (next >= MAX_SEC) { stopRec(); return MAX_SEC; }
                    return next;
                });
            }, 100);
        } catch (e: any) {
            setMicError(
                e.name === 'NotAllowedError'
                    ? 'microphone permission required'
                    : 'microphone unavailable'
            );
        }
    }, []);

    const stopRec = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        recorderRef.current?.stop();
    }, []);

    // ── Playback ──────────────────────────────────────
    const playBlob = useCallback((blob: Blob) => {
        audioRef.current?.pause();
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay  = () => setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
        audio.play();
    }, []);

    // ── Confirm + save ────────────────────────────────
    const confirm = useCallback(async () => {
        if (!recordedBlob) return;
        await saveClip(wordIdx, recordedBlob);
        setExistingBlob(recordedBlob);
        setRecordedBlob(null);
        setScreen('record');
        if (level >= TOTAL) { onComplete(100); } else { onLevelUp(); }
    }, [recordedBlob, wordIdx, level, onComplete, onLevelUp]);

    // ════════════════════════════════════════════════════
    // SCREEN: INTRO
    // ════════════════════════════════════════════════════
    const renderIntro = () => (
        <motion.div
            key="intro"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col h-full items-center justify-center px-6 gap-6"
        >
            {/* Icon */}
            <div className="relative flex items-center justify-center">
                <motion.div
                    className="absolute w-14 h-14 rounded-full border border-[#CCFF00]/15"
                    animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                />
                <div className="w-12 h-12 rounded-full bg-[#CCFF00]/8 border border-[#CCFF00]/20 flex items-center justify-center">
                    <Mic size={20} className="text-[#CCFF00]/70" />
                </div>
            </div>

            {/* Headline */}
            <div className="text-center max-w-[240px]">
                <p className="text-[9px] font-mono text-[#CCFF00]/60 tracking-[0.35em] uppercase mb-2">
                    Voice Bank
                </p>
                <h2 className="text-[15px] font-bold text-white leading-snug">
                    당신의 목소리가<br />울림통의 언어가 됩니다
                </h2>
                <p className="text-[10px] text-white/55 leading-relaxed mt-3">
                    녹음한 단어들은 게임 속 NPC와 환경이<br />실제로 사용하게 됩니다.
                </p>
                <p className="text-[10px] text-white/65 leading-relaxed mt-2.5 italic">
                    이 단어들은 미지의 세상에서 온 언어입니다.<br />
                    발음과 억양을 마음껏 상상해보세요.
                </p>
            </div>

            {/* CTA */}
            <button
                onClick={() => { localStorage.setItem(INTRO_KEY, '1'); setScreen('record'); }}
                className="flex items-center gap-2 px-7 py-2.5 bg-[#CCFF00]/10 border border-[#CCFF00]/50 text-[#CCFF00] text-[11px] font-bold tracking-wide rounded-full hover:bg-[#CCFF00]/20 transition-all"
            >
                start <ChevronRight size={12} />
            </button>
        </motion.div>
    );

    // ════════════════════════════════════════════════════
    // SCREEN: RECORD
    // ════════════════════════════════════════════════════
    const renderRecord = () => {
        if (isDone) return (
            <motion.div
                key="all-done"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col h-full items-center justify-center gap-3 px-6"
            >
                <Mic size={26} className="text-[#CCFF00]/50" />
                <p className="text-[11px] font-bold text-[#CCFF00]">VOICE BANK COMPLETE</p>
                <p className="text-[10px] text-white/55 font-mono text-center leading-relaxed">
                    30개 단어 녹음 완료.<br />당신의 목소리가 세계에 스며듭니다.
                </p>
            </motion.div>
        );

        return (
            <motion.div
                key={`rec-${wordIdx}`}
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                className="flex flex-col h-full"
            >
                {/* Top progress bar */}
                <div className="flex-none h-[2px] bg-white/5">
                    <motion.div
                        className="h-full bg-[#CCFF00]/45"
                        animate={{ width: `${((level - 1) / TOTAL) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">

                    {/* Type badge + counter */}
                    <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${typeCls(word.t)}`}>
                            {word.t}
                        </span>
                        <span className="text-[9px] text-white/55 font-mono">{level} / {TOTAL}</span>
                    </div>

                    {/* Word */}
                    <div className="text-center">
                        <p className="text-[34px] font-bold text-white tracking-wide leading-none">
                            {word.w}
                        </p>
                        {existingBlob && recState === 'idle' && (
                            <button
                                onClick={() => playBlob(existingBlob)}
                                className="mt-2 text-[9px] text-white/50 hover:text-white/70 font-mono flex items-center gap-1 mx-auto transition-colors"
                            >
                                <Play size={8} /> play last recording
                            </button>
                        )}
                    </div>

                    {/* Waveform */}
                    <div className="flex items-end justify-center gap-[2.5px] h-9 w-full max-w-[180px]">
                        {bars.map((h, i) => (
                            <div
                                key={i}
                                className={`w-[3px] rounded-full transition-none ${
                                    recState === 'recording' ? 'bg-[#CCFF00]/70' : 'bg-white/20'
                                }`}
                                style={{ height: `${h}px` }}
                            />
                        ))}
                    </div>

                    {/* Record button */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={recState === 'idle' ? startRec : stopRec}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                                recState === 'recording'
                                    ? 'bg-[#CCFF00]/10 border-2 border-[#CCFF00]/70 scale-105'
                                    : 'bg-white/8 border border-white/35 hover:bg-white/15 hover:border-white/55'
                            }`}
                        >
                            {recState === 'recording' ? (
                                <motion.div
                                    className="w-5 h-5 rounded bg-[#CCFF00]/80"
                                    animate={{ opacity: [1, 0.4, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            ) : (
                                <Mic size={22} className="text-white/65" />
                            )}
                        </button>
                        <p className={`text-[9.5px] font-mono ${
                            recState === 'recording' ? 'text-[#CCFF00]/90' : 'text-white/55'
                        }`}>
                            {recState === 'recording'
                                ? `${elapsed.toFixed(1)}s / ${MAX_SEC}s — tap to stop`
                                : 'tap to record'}
                        </p>
                    </div>

                    {micError && (
                        <p className="text-[9px] text-[#CCFF00]/60 font-mono text-center">{micError}</p>
                    )}
                </div>
            </motion.div>
        );
    };

    // ════════════════════════════════════════════════════
    // SCREEN: REVIEW
    // ════════════════════════════════════════════════════
    const renderReview = () => (
        <motion.div
            key="review"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col h-full items-center justify-center gap-6 px-6"
        >
            <div className="text-center">
                <p className="text-[9px] text-[#CCFF00]/65 font-mono tracking-[0.2em] uppercase mb-2">recording done</p>
                <p className="text-[32px] font-bold text-white leading-none">{word?.w}</p>
                <span className={`text-[8px] font-mono px-2 py-0.5 rounded border mt-2 inline-block ${typeCls(word?.t ?? '')}`}>
                    {word?.t}
                </span>
            </div>

            {/* Play button */}
            <div className="flex flex-col items-center gap-1.5">
                <button
                    onClick={() => recordedBlob && playBlob(recordedBlob)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${
                        isPlaying
                            ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30'
                            : 'bg-white/5 border-white/15 hover:bg-white/10'
                    }`}
                >
                    {isPlaying
                        ? <Pause size={20} className="text-[#CCFF00]/90" />
                        : <Play  size={20} className="text-white/65" />}
                </button>
                <p className="text-[9px] text-white/55 font-mono">
                    {isPlaying ? 'playing…' : 'tap to preview'}
                </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5">
                <button
                    onClick={() => { setRecordedBlob(null); setScreen('record'); }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-white/25 text-white/60 text-[10px] font-mono rounded-full hover:bg-white/8 transition-all"
                >
                    <RotateCcw size={11} /> re-record
                </button>
                <button
                    onClick={confirm}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#CCFF00]/10 border border-[#CCFF00]/50 text-[#CCFF00] text-[10px] font-bold rounded-full hover:bg-[#CCFF00]/20 transition-all"
                >
                    <Check size={11} /> confirm
                </button>
            </div>

            <p className="text-[9px] text-white/50 font-mono">
                {level} / {TOTAL} words — confirm to advance to next
            </p>
        </motion.div>
    );

    // ════════════════════════════════════════════════════
    // MAIN
    // ════════════════════════════════════════════════════
    return (
        <div className="w-full h-full flex flex-col overflow-hidden text-white">
            <AnimatePresence mode="wait">
                {screen === 'intro'  && renderIntro()}
                {screen === 'record' && renderRecord()}
                {screen === 'review' && renderReview()}
            </AnimatePresence>
        </div>
    );
};
