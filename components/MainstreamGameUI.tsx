import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Play, Square, Radio, Sparkles, ArrowRight, Lock, Award } from 'lucide-react';
import { GatewayLocation } from '@/lib/gateway-data';
import { UserNode } from '@/lib/user-node-data';

export interface MainstreamGameUIProps {
    user: any;
    location: GatewayLocation;
    userNodes?: UserNode[];
    onClose: () => void;
    isMobile: boolean;
    onSwitchToBlue?: () => void;
}

export const MainstreamGameUI: React.FC<MainstreamGameUIProps> = ({ 
    user, 
    location, 
    onClose, 
    isMobile, 
    userNodes = [],
    onSwitchToBlue
}) => {
    const playableNodes = userNodes.filter(n => n.state === 'materialized' || (n.state === 'observable' && n.ownerId === user?.id));
    const [showSystemNotice, setShowSystemNotice] = useState(true);

    // Scenario Game States
    const [chapter, setChapter] = useState<number>(1);
    const [selectedMandala, setSelectedMandala] = useState<number | null>(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [dungeonChoice, setDungeonChoice] = useState<'left' | 'right' | 'straight' | null>(null);

    // Audio Playback Simulation
    useEffect(() => {
        let interval: any;
        if (isPlayingAudio) {
            interval = setInterval(() => {
                setAudioProgress(prev => {
                    if (prev >= 100) {
                        setIsPlayingAudio(false);
                        return 100;
                    }
                    return prev + 4; // Takes about 5 seconds
                });
            }, 200);
        }
        return () => clearInterval(interval);
    }, [isPlayingAudio]);

    return (
        <div className="relative">
            {/* External header control bar (Top-right) */}
            <div className={`pointer-events-auto absolute ${isMobile ? '-top-9 right-2' : '-top-10 right-0'} z-[101] flex items-center gap-2`}>
                <AnimatePresence>
                    {showSystemNotice && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-950/30 border border-orange-500/30 text-orange-400 font-bold shadow-[0_0_10px_rgba(249,115,22,0.1)] transition-all h-[26px]"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                            <span className="text-[7px] md:text-[9px] font-mono uppercase tracking-widest shrink-0 text-orange-500">[SYS]</span>
                            
                            <div className="overflow-hidden w-20 md:w-32 relative flex items-center shrink-0">
                                <motion.div
                                    animate={{ x: ['100%', '-100%'] }}
                                    transition={{
                                        ease: 'linear',
                                        duration: 10,
                                        repeat: Infinity
                                    }}
                                    className="whitespace-nowrap text-orange-400 text-[8px] md:text-[9px] font-mono font-medium"
                                >
                                    v0.2.1-beta resonance synchronization completed.
                                </motion.div>
                            </div>
                            
                            <button 
                                onClick={() => setShowSystemNotice(false)}
                                className="text-orange-500/50 hover:text-orange-400 hover:bg-orange-500/10 text-[8px] font-bold uppercase shrink-0 border border-orange-500/20 px-1 py-0.5 rounded transition-all"
                            >
                                X
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {playableNodes.length > 0 && onSwitchToBlue && (
                    <motion.button
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        onClick={onSwitchToBlue}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded bg-blue-950/40 border border-blue-500/30 text-blue-400 hover:text-blue-200 hover:bg-blue-900/50 hover:border-blue-400/50 font-bold shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all`}
                    >
                        <span className={`font-mono tracking-widest uppercase ${isMobile ? 'text-[7px]' : 'text-[9px]'}`}>TO FREQUENCY</span>
                    </motion.button>
                )}
                
                <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    onClick={onClose}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all`}
                >
                    <span className={`font-mono tracking-widest uppercase ${isMobile ? 'text-[7px]' : 'text-[9px]'}`}>close</span>
                    <X size={isMobile ? 11 : 13} />
                </motion.button>
            </div>

            <div className={`pointer-events-auto bg-[#0b1617]/95 backdrop-blur-xl ${isMobile ? 'w-full h-[480px] p-3' : 'w-[400px] h-[650px] p-6'} flex flex-col relative rounded shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden`}>
                
                {/* Header */}
                <div className="mb-3 pb-3 border-b border-white/10 shrink-0">
                    {/* Row 1: location badge + progress ring */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-[2px] rounded-full border border-white/10 bg-black/40 shrink-0">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 -rotate-90 drop-shadow-[0_0_6px_rgba(204,255,0,0.3)]">
                                <circle cx="12" cy="12" r="6" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                                <circle
                                    cx="12" cy="12" r="6"
                                    fill="transparent" stroke="#CCFF00" strokeWidth="12"
                                    strokeDasharray="37.6991"
                                    strokeDashoffset={`calc(37.6991 - (37.6991 * ${location.mainstream ?? 50}) / 100)`}
                                />
                            </svg>
                        </div>
                        <span className={`font-mono text-[#CCFF00] tracking-widest uppercase ${isMobile ? 'text-[8px]' : 'text-[10px]'}`}>
                            {location.name}
                        </span>
                        <span className="text-white/20 font-mono text-[8px] ml-auto">
                            {location.mainstream ?? 50}%
                        </span>
                    </div>
                </div>

                {/* Chat Terminal Zone */}
                <div className="flex-1 flex flex-col min-h-0 bg-black/60 border border-white/10 rounded overflow-hidden shadow-inner mt-1">

                    {/* Content / Log Area */}
                    <div className="flex-1 p-3 overflow-y-auto scrollbar-hide flex flex-col text-left text-[10px] space-y-3 font-mono">
                        <div className="space-y-3 overflow-y-auto scrollbar-hide flex-1 flex flex-col justify-start">
                            {/* Chapter Banner */}
                            <div className="flex justify-between items-center text-[#CCFF00] text-[8px] border-b border-[#CCFF00]/25 pb-1 mb-2 tracking-[0.15em] shrink-0 font-bold">
                                <span>[ MAINSTREAM SCENARIO ]</span>
                                <span>CHAPTER {chapter} / 6</span>
                            </div>

                            <div className="flex-1 flex flex-col justify-center space-y-3">
                                {/* Chapter 1 */}
                                {chapter === 1 && (
                                    <div className="space-y-3">
                                        <div className="text-[#CCFF00] font-semibold text-[11px] uppercase tracking-wider">제1장: 공명의 시작</div>
                                        <p className="text-white/80 leading-relaxed text-[11px] break-keep">
                                            차원 관문에 접근하자 공기가 묵직하게 진동하기 시작합니다. 
                                            우주의 주파수가 연두색 빛을 발하며 공명하고, 미누의 흩어진 분신들이 소곤거리는 신호가 감지됩니다. 
                                            이곳에서 세계의 숨겨진 설계를 풀어나갈 메인스트림 이야기가 펼쳐집니다.
                                        </p>
                                    </div>
                                )}

                                {/* Chapter 2 */}
                                {chapter === 2 && (
                                    <div className="space-y-3">
                                        <div className="text-[#CCFF00] font-semibold text-[11px] uppercase tracking-wider">제2장: 만다라 타로의 선택</div>
                                        <p className="text-white/70 leading-relaxed text-[10px] break-keep">
                                            차원의 틈새를 안정화하기 위해서는 당신이 빚어낸 기하학 결과물, '만다라' 에너지가 필요합니다. 
                                            타로 카드로 소환된 세 개의 만다라 중 활성화할 하나의 에너지를 선택하십시오.
                                        </p>
                                        
                                        {/* Mandala Cards Selection */}
                                        <div className="grid grid-cols-3 gap-2.5 pt-2">
                                            {[1, 2, 3].map((num) => {
                                                const titles = ["조율의 만다라", "공진의 만다라", "결속의 만다라"];
                                                const colors = ["#CCFF00", "#eab308", "#22c55e"];
                                                return (
                                                    <div 
                                                        key={num}
                                                        onClick={() => setSelectedMandala(num)}
                                                        className={`p-2 border rounded cursor-pointer transition-all flex flex-col items-center justify-between aspect-[3/4] ${
                                                            selectedMandala === num 
                                                                ? 'border-[#CCFF00] bg-[#CCFF00]/15 shadow-[0_0_12px_rgba(204,255,0,0.25)] scale-[1.03]' 
                                                                : 'border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <div className="w-full flex justify-end">
                                                            <Sparkles size={8} className={selectedMandala === num ? 'text-[#CCFF00]' : 'text-white/20'} />
                                                        </div>
                                                        {/* Mandala Geometry dummy svg */}
                                                        <svg className="w-10 h-10 my-1 animate-spin-slow" viewBox="0 0 100 100">
                                                            <circle cx="50" cy="50" r="40" fill="none" stroke={colors[num-1]} strokeWidth="1" strokeDasharray={num === 1 ? "4 4" : num === 2 ? "12 4" : "8 2 4 2"} />
                                                            <circle cx="50" cy="50" r="25" fill="none" stroke={colors[num-1]} strokeWidth="0.8" />
                                                            <line x1="50" y1="10" x2="50" y2="90" stroke={colors[num-1]} strokeWidth="0.5" />
                                                            <line x1="10" y1="50" x2="90" y2="50" stroke={colors[num-1]} strokeWidth="0.5" />
                                                        </svg>
                                                        <span className="text-[8px] text-white/80 font-bold truncate w-full text-center">
                                                            {titles[num-1]}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Chapter 3 */}
                                {chapter === 3 && (
                                    <div className="space-y-3">
                                        <div className="text-[#CCFF00] font-semibold text-[11px] uppercase tracking-wider">제3장: 속삭이는 메아리</div>
                                        <p className="text-white/70 leading-relaxed text-[10px] break-keep">
                                            방출한 만다라 에너지가 봉인문과 결합되었습니다. 
                                            문을 개방하려면 관문에 봉인되어 있는 전령의 음성 에코를 재생하여 성대의 주파수를 분석해야 합니다.
                                        </p>

                                        {/* Dummy Audio Player */}
                                        <div className="bg-black/60 border border-white/10 rounded p-2.5 flex flex-col gap-2 mt-2">
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                                                    className="w-8 h-8 rounded-full bg-[#CCFF00] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_8px_rgba(204,255,0,0.4)]"
                                                >
                                                    {isPlayingAudio ? <Square size={12} fill="black" /> : <Play size={12} className="ml-0.5" fill="black" />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[9px] text-white/90 font-bold truncate">미누의 잊혀진 목소리.wav</div>
                                                    <div className="text-[8px] text-[#CCFF00]/60 font-mono">
                                                        {isPlayingAudio ? "DECODING AUDIO ECHO..." : "AUDIO PAUSED"}
                                                    </div>
                                                </div>
                                                <Radio size={14} className={isPlayingAudio ? 'text-[#CCFF00] animate-pulse' : 'text-white/20'} />
                                            </div>

                                            {/* Audio Waves Simulation */}
                                            <div className="h-6 flex items-center justify-between gap-[2px] px-1 bg-black/40 border border-white/5 rounded overflow-hidden">
                                                {Array.from({ length: 28 }).map((_, i) => {
                                                    const randomHeight = isPlayingAudio ? Math.max(10, Math.sin(i * 0.5 + audioProgress) * 90 + Math.random() * 10) : 15;
                                                    return (
                                                        <div 
                                                            key={i} 
                                                            className="flex-1 bg-[#CCFF00]/80 rounded-full transition-all duration-150"
                                                            style={{ height: `${randomHeight}%` }}
                                                        />
                                                    );
                                                })}
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                                <div className="bg-[#CCFF00] h-full transition-all duration-200" style={{ width: `${audioProgress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Chapter 4 */}
                                {chapter === 4 && (
                                    <div className="space-y-3">
                                        <div className="text-[#CCFF00] font-semibold text-[11px] uppercase tracking-wider">제4장: 던전 경로의 선택</div>
                                        <p className="text-white/70 leading-relaxed text-[10px] break-keep">
                                            음성 에코의 해독으로 차원 문이 열리고 동쪽 심연의 던전이 나타납니다. 
                                            안개가 자욱한 미로 속에서 어느 방향의 주파수로 전진하시겠습니까?
                                        </p>
                                        
                                        <div className="flex flex-col gap-2 pt-1.5">
                                            {[
                                                { id: 'left', name: '왼쪽 통로 (격렬한 파동 흐름)', desc: '공진 계수가 급상승하는 붉은 안개의 길' },
                                                { id: 'straight', name: '중앙 직진 (깊은 수직 균열)', desc: '위험하지만 코어에 가장 빠르게 접근하는 틈새' },
                                                { id: 'right', name: '오른쪽 통로 (적막한 안정대)', desc: '공격적인 주파수가 억제된 안전한 우회로' }
                                            ].map((opt) => (
                                                <div 
                                                    key={opt.id}
                                                    onClick={() => setDungeonChoice(opt.id as any)}
                                                    className={`p-2 border rounded cursor-pointer transition-all text-left ${
                                                        dungeonChoice === opt.id 
                                                            ? 'border-[#CCFF00] bg-[#CCFF00]/10 shadow-[inset_0_0_8px_rgba(204,255,0,0.1)]' 
                                                            : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5'
                                                    }`}
                                                >
                                                    <div className="text-[9px] text-white font-bold">{opt.name}</div>
                                                    <div className="text-[8px] text-white/40">{opt.desc}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Chapter 5 */}
                                {chapter === 5 && (
                                    <div className="space-y-3">
                                        <div className="text-[#CCFF00] font-semibold text-[11px] uppercase tracking-wider">제5장: 마지막 공진</div>
                                        <p className="text-white/80 leading-relaxed text-[11px] break-keep">
                                            던전의 가장 심부에 이르자, 관문의 에너지 핵이 강렬하게 박동합니다. 
                                            당신의 눈앞에 실체화된 분신 미누의 눈동자가 흔들립니다. 
                                            "너의 해답을 찾았는가? 세계는 오직 너가 지켜보는 동안에만 흐를 뿐이다." 
                                            관문의 주파수를 영혼에 강제로 동기화하여 흡수합니다.
                                        </p>
                                    </div>
                                )}

                                {/* Chapter 6 */}
                                {chapter === 6 && (
                                    <div className="space-y-3 flex flex-col items-center justify-center py-4">
                                        <div className="w-12 h-12 rounded-full border border-[#CCFF00] bg-[#CCFF00]/10 flex items-center justify-center mb-3 animate-pulse shadow-[0_0_20px_rgba(204,255,0,0.2)]">
                                            <Award className="text-[#CCFF00]" size={24} />
                                        </div>
                                        <div className="text-[#CCFF00] font-bold text-[12px] uppercase tracking-[0.2em] mb-1">Gate synchronised</div>
                                        <p className="text-white/70 text-center leading-relaxed text-[10px] break-keep">
                                            성공적으로 메인스트림 6장 스토리를 완수했습니다. 
                                            {location.name}의 공명 에너지가 당신에게 귀속되었으며, 차원 동기화가 안전하게 매핑되었습니다.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Game Action Area */}
                    <div className="p-3 border-t border-white/10 bg-black/80 flex flex-col gap-2 shrink-0">
                        {chapter === 1 && (
                            <button
                                onClick={() => setChapter(2)}
                                className={`w-full bg-[#CCFF00] text-black ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} rounded font-semibold uppercase tracking-widest hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] flex items-center justify-center gap-1.5`}
                            >
                                <span>제2장으로 진입하기 (만다라 조율)</span>
                                <ArrowRight size={12} />
                            </button>
                        )}
                        {chapter === 2 && (
                            <button
                                onClick={() => selectedMandala !== null && setChapter(3)}
                                disabled={selectedMandala === null}
                                className={`w-full bg-[#CCFF00] text-black ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} rounded font-semibold uppercase tracking-widest hover:bg-white hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] flex items-center justify-center gap-1.5`}
                            >
                                <span>{selectedMandala !== null ? '선택한 만다라 공명 활성화' : '만다라 카드를 선택해주세요'}</span>
                                <ArrowRight size={12} />
                            </button>
                        )}
                        {chapter === 3 && (
                            <button
                                onClick={() => audioProgress >= 100 && setChapter(4)}
                                disabled={audioProgress < 100}
                                className={`w-full bg-[#CCFF00] text-black ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} rounded font-semibold uppercase tracking-widest hover:bg-white hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] flex items-center justify-center gap-1.5`}
                            >
                                <span>{audioProgress >= 100 ? '음성 분석 완료 - 던전 진입' : '오디오 메시지를 끝까지 재생하십시오'}</span>
                                <ArrowRight size={12} />
                            </button>
                        )}
                        {chapter === 4 && (
                            <button
                                onClick={() => dungeonChoice !== null && setChapter(5)}
                                disabled={dungeonChoice === null}
                                className={`w-full bg-[#CCFF00] text-black ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} rounded font-semibold uppercase tracking-widest hover:bg-white hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] flex items-center justify-center gap-1.5`}
                            >
                                <span>{dungeonChoice !== null ? '통로 진입 및 전진하기' : '던전 경로를 위에서 선택해주세요'}</span>
                                <ArrowRight size={12} />
                            </button>
                        )}
                        {chapter === 5 && (
                            <button
                                onClick={() => setChapter(6)}
                                className={`w-full bg-[#CCFF00] text-black ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} rounded font-semibold uppercase tracking-widest hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] flex items-center justify-center gap-1.5`}
                            >
                                <span>마지막 공진 완료 (실체화 승인)</span>
                                <ArrowRight size={12} />
                            </button>
                        )}
                        {chapter === 6 && (
                            <button
                                onClick={() => {
                                    setChapter(1);
                                    setSelectedMandala(null);
                                    setIsPlayingAudio(false);
                                    setAudioProgress(0);
                                    setDungeonChoice(null);
                                }}
                                className={`w-full bg-white/10 text-white border border-white/20 ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} rounded font-semibold uppercase tracking-widest hover:bg-white hover:text-black hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5`}
                            >
                                <span>시나리오 다시 체험하기</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
