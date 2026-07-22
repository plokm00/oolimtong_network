import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Shield, Globe, Terminal, MessageSquare, BookOpen, Layers, Award, Sparkles, User, RefreshCw } from 'lucide-react';
import { UserNode } from '@/lib/user-node-data';

export interface UserNodeGameUIProps {
    node: UserNode | null;
    user: any;
    userNodes: UserNode[];
    onClose: () => void;
    isMobile: boolean;
    onSwitchToMainstream?: () => void;
}

interface ChatMessage {
    id: string;
    sender: 'user' | 'system' | 'other';
    senderName: string;
    text: string;
    timestamp: string;
}

export const UserNodeGameUI: React.FC<UserNodeGameUIProps> = ({
    node,
    user,
    userNodes,
    onClose,
    isMobile,
    onSwitchToMainstream
}) => {
    const [activeTab, setActiveTab] = useState<'messenger' | 'sarab'>('messenger');
    const [showSystemNotice, setShowSystemNotice] = useState(true);

    // Messenger States
    const materializedNodes = userNodes.filter(n => n.state === 'materialized' && n.id !== node?.id);
    const [selectedChatNode, setSelectedChatNode] = useState<UserNode | null>(materializedNodes[0] || null);
    const [chatInput, setChatInput] = useState('');
    const [chats, setChats] = useState<{ [nodeId: string]: ChatMessage[] }>({});
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Sarab Quest States
    const questions = [
        { id: 'q1', text: "니닉 차원의 파동 경계선이 갑작스럽게 왜곡되는 원인은 무엇인가?" },
        { id: 'q2', text: "미누가 숨긴 세 번째 그림자의 본명과 그 그림자가 머무는 좌표는?" },
        { id: 'q3', text: "흙으로 빚은 울림통이 방출하는 특정 가청 주파수의 참뜻은 무엇인가?" }
    ];
    const [selectedQuestion, setSelectedQuestion] = useState(questions[0]);
    const [sarabText, setSarabText] = useState('');
    const [ninnikName, setNinnikName] = useState('');
    const [sarabStatus, setSarabStatus] = useState<'idle' | 'submitting' | 'evaluating' | 'convinced'>('idle');
    const [submittedAnswers, setSubmittedAnswers] = useState<{ questionId: string; title: string; body: string }[]>([]);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chats, selectedChatNode]);

    // Send Message Logic
    const handleSendMessage = () => {
        if (!chatInput.trim() || !selectedChatNode) return;
        const currentTargetId = selectedChatNode.id;

        const userMsg: ChatMessage = {
            id: Math.random().toString(),
            sender: 'user',
            senderName: user?.nickname || '나',
            text: chatInput,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChats(prev => ({
            ...prev,
            [currentTargetId]: [...(prev[currentTargetId] || []), userMsg]
        }));
        setChatInput('');

        // Simulate automatic response
        setTimeout(() => {
            const replies = [
                "주파수 동조율이 상승하고 있습니다. 당신의 울림 소리가 잘 들립니다.",
                "이 별의 좌표에도 파동의 간섭이 느껴지네요. 혹시 관문 동기화를 완료하셨나요?",
                "우리가 보낸 신호가 다중세계의 사랍(Sarab) 보관소에 전달되길 바랍니다.",
                "푸른 별의 메아리가 들려옵니다. 계속해서 파동을 확장해주십시오."
            ];
            const systemReply: ChatMessage = {
                id: Math.random().toString(),
                sender: 'other',
                senderName: selectedChatNode.name || '알 수 없는 별',
                text: replies[Math.floor(Math.random() * replies.length)],
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChats(prev => ({
                ...prev,
                [currentTargetId]: [...(prev[currentTargetId] || []), systemReply]
            }));
        }, 1500);
    };

    // Submit Sarab Answer Logic
    const handleSarabSubmit = () => {
        if (!sarabText.trim() || !ninnikName.trim()) return;
        setSarabStatus('submitting');

        setTimeout(() => {
            setSarabStatus('evaluating');
            setTimeout(() => {
                setSarabStatus('convinced');
                setSubmittedAnswers(prev => [
                    ...prev,
                    { questionId: selectedQuestion.id, title: ninnikName, body: sarabText }
                ]);
            }, 2000);
        }, 1200);
    };

    const activeChats = selectedChatNode ? (chats[selectedChatNode.id] || [
        {
            id: 'init',
            sender: 'system',
            senderName: 'SYSTEM',
            text: `[${selectedChatNode.name}] 별과의 보안 주파수 통신망이 성공적으로 수립되었습니다. 대화를 시작하세요.`,
            timestamp: ''
        }
    ]) : [];

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
                                    Real-time telemetry active. Star coherence at 98.74%.
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
                
                {onSwitchToMainstream && (
                    <motion.button
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        onClick={onSwitchToMainstream}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded bg-[#CCFF00] text-black hover:bg-[#b3ff00] font-bold shadow-[0_0_10px_rgba(204,255,0,0.3)] transition-all`}
                    >
                        <span className={`font-mono tracking-widest uppercase ${isMobile ? 'text-[7px]' : 'text-[9px]'}`}>TO MAINSTREAM</span>
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

            <div className={`pointer-events-auto bg-[#0b1617]/95 backdrop-blur-xl ${isMobile ? 'w-full h-[480px] p-3' : 'w-[400px] h-[650px] p-6'} flex flex-col relative rounded shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden text-white`}>
                
                {/* Header */}
                <div className="mb-3 pb-3 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#60a5fa]/10 flex items-center justify-center border border-white/10 animate-pulse">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]" />
                        </div>
                        <span className={`font-mono text-[#60a5fa] tracking-widest uppercase font-bold ${isMobile ? 'text-[9px]' : 'text-[11px]'}`}>
                            {node?.name || "Active Blue Star"}
                        </span>
                        <div className="ml-auto flex items-center gap-1.5">
                            <span className="text-[7px] font-mono bg-white/5 text-[#60a5fa] px-1.5 py-0.5 rounded border border-white/10">
                                OBSERVED
                                {node?.state === 'materialized' ? 'MATERIALIZED' : 'IDLE'}
                            </span>
                        </div>
                    </div>
                    <p className={`text-white/55 ${isMobile ? 'text-[10px]' : 'text-[11px]'} leading-relaxed break-keep`}>
                        <span className="text-[#60a5fa] font-semibold">@{node?.ownerId}</span> 님의 별입니다. 이 주파수 공간에서 파란별들끼리의 공진망을 확인하고 세계의 수수께끼인 '사랍'에 답변하십시오.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[8px] font-mono text-[#60a5fa]/90">
                        <span className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-0.5 rounded">COHERENCE: 98.74%</span>
                        <span className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-0.5 rounded">OBSERVERS: {node?.observers?.length || 1} entities</span>
                        <span className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-0.5 rounded">SYNC COORDS: {node?.x?.toFixed(2) || "0.00"}, {node?.y?.toFixed(2) || "0.00"}</span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className={`flex items-center border-b border-white/10 uppercase font-mono bg-black/40 shrink-0 rounded-t overflow-hidden ${isMobile ? 'text-[7.5px] tracking-normal' : 'text-[9px] tracking-widest'}`}>
                    <button 
                        onClick={() => setActiveTab('messenger')}
                        className={`flex-1 ${isMobile ? 'py-2 px-1' : 'py-2.5'} transition-all border-b-2 text-center ${activeTab === 'messenger' ? 'bg-[#3b82f6]/10 text-[#60a5fa] font-bold border-[#3b82f6] shadow-[inset_0_-2px_8px_rgba(59,130,246,0.15)]' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white/60'}`}
                    >
                        {isMobile ? 'MSG' : 'Messenger'}
                    </button>
                    <button 
                        onClick={() => setActiveTab('sarab')}
                        className={`flex-1 ${isMobile ? 'py-2 px-1' : 'py-2.5'} transition-all border-b-2 text-center ${activeTab === 'sarab' ? 'bg-[#3b82f6]/10 text-[#60a5fa] font-bold border-[#3b82f6] shadow-[inset_0_-2px_8px_rgba(59,130,246,0.15)]' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white/60'}`}
                    >
                        {isMobile ? 'SARAB' : 'Sarab Quest'}
                    </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 flex flex-col min-h-0 bg-black/50 border border-white/5 rounded-b overflow-hidden shadow-inner mt-1">
                    
                    {/* 1. Messenger Tab */}
                    {activeTab === 'messenger' && (
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Channel Selector */}
                            <div className="p-2 border-b border-white/10 bg-white/[0.03] flex items-center gap-2 shrink-0">
                                <span className="text-[8px] font-mono text-white/40 uppercase">FREQUENCY TARGET:</span>
                                {materializedNodes.length > 0 ? (
                                    <select
                                        value={selectedChatNode?.id || ''}
                                        onChange={(e) => {
                                            const selected = materializedNodes.find(n => n.id === e.target.value);
                                            if (selected) setSelectedChatNode(selected);
                                        }}
                                        className="bg-black/60 border border-white/10 text-[#60a5fa] text-[9px] font-mono p-1 rounded outline-none flex-1 max-w-[200px]"
                                    >
                                        {materializedNodes.map(n => (
                                            <option key={n.id} value={n.id}>
                                                {n.name} (@{n.ownerId})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="text-[8px] font-mono text-red-400">NO OTHER MATERIALIZED STARS FOUND</span>
                                )}
                            </div>

                            {/* Chat messages */}
                            <div className="flex-1 p-3 overflow-y-auto scrollbar-hide flex flex-col space-y-2">
                                {activeChats.map((msg) => {
                                    if (msg.sender === 'system') {
                                        return (
                                            <div key={msg.id} className="text-[#60a5fa]/60 text-center py-1 text-[8px] border-b border-white/5 mb-2 font-mono">
                                                {msg.text}
                                            </div>
                                        );
                                    }
                                    const isSelf = msg.sender === 'user';
                                    return (
                                        <div 
                                            key={msg.id}
                                            className={`flex flex-col max-w-[80%] ${isSelf ? 'self-end items-end' : 'self-start items-start'}`}
                                        >
                                            <span className="text-[7px] text-white/40 mb-0.5">{msg.senderName}</span>
                                            <div className={`p-2 rounded border text-[9px] font-mono break-all leading-normal ${
                                                isSelf 
                                                    ? 'bg-[#3b82f6]/10 border-[#3b82f6]/40 text-white' 
                                                    : 'bg-white/5 border-white/10 text-white/90'
                                            }`}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[6px] text-white/30 mt-0.5">{msg.timestamp}</span>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-2 border-t border-white/10 bg-black/80 flex gap-2 shrink-0">
                                <input
                                    type="text"
                                    placeholder={selectedChatNode ? "메시지를 송신하십시오..." : "송신 대상이 없습니다"}
                                    disabled={!selectedChatNode}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 bg-black/50 border border-white/10 rounded px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-[#60a5fa]/50 placeholder-white/20 disabled:opacity-40"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!selectedChatNode || !chatInput.trim()}
                                    className="px-3 bg-[#3b82f6] text-white rounded hover:bg-[#60a5fa] transition-colors flex items-center justify-center disabled:opacity-30"
                                >
                                    <Send size={11} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2. Sarab Quest Tab */}
                    {activeTab === 'sarab' && (
                        <div className="flex-1 p-3 overflow-y-auto scrollbar-hide flex flex-col space-y-3 text-left">
                            <div className="bg-white/[0.03] border border-white/10 rounded p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <BookOpen size={12} className="text-[#60a5fa]" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#60a5fa]">다중세계 보관소 '사랍 (Sarab)'</span>
                                </div>
                                <p className="text-[8.5px] text-white/70 leading-relaxed break-keep">
                                    니닉의 차원은 아직 불완전하며 끊임없이 소멸하고 융합됩니다. 
                                    우주의 근본적인 수수께끼인 아래 질문들에 대해 당신의 직관과 상상력을 담은 해답을 적으십시오. 
                                    제출된 글은 **'납득기준'**의 심사를 통과하면 공식 세계선(다중세계)에 편입됩니다.
                                </p>
                            </div>

                            <AnimatePresence mode="wait">
                                {sarabStatus === 'idle' && (
                                    <motion.div key="sarab-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            {/* Question Selector */}
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[7.5px] font-mono text-white/40 uppercase">수수께끼 질문 선택:</span>
                                                <select
                                                    value={selectedQuestion.id}
                                                    onChange={(e) => {
                                                        const q = questions.find(item => item.id === e.target.value);
                                                        if (q) setSelectedQuestion(q);
                                                    }}
                                                    className="bg-black/60 border border-white/10 text-[#60a5fa] text-[9.5px] font-mono p-1.5 rounded outline-none"
                                                >
                                                    {questions.map(q => (
                                                        <option key={q.id} value={q.id}>{q.text}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Answer Form */}
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[7.5px] font-mono text-white/40 uppercase">당신이 해석한 차원의 이름 (니닉 스타일 가이드):</span>
                                                <input
                                                    type="text"
                                                    placeholder="예: 미시하, 자아하, 시니누크 (자음 중첩 또는 '시', '하', '아' 포함 권장)"
                                                    value={ninnikName}
                                                    onChange={(e) => setNinnikName(e.target.value)}
                                                    className="w-full bg-black/60 border border-white/10 rounded p-2 text-white text-[9.5px] font-mono outline-none focus:border-[#60a5fa]/50"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[7.5px] font-mono text-white/40 uppercase">수수께끼에 대한 상상해답 기술:</span>
                                                <textarea
                                                    placeholder="이 현상이나 존재의 기원을 구체적으로 묘사해주십시오. 니닉 우주에 실재로 존재하기 위한 당신만의 이야기를 서술해야 합니다..."
                                                    value={sarabText}
                                                    onChange={(e) => setSarabText(e.target.value)}
                                                    className="w-full h-24 bg-black/60 border border-white/10 rounded p-2 text-white text-[9px] font-mono outline-none focus:border-[#60a5fa]/50 resize-none"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSarabSubmit}
                                            disabled={!sarabText.trim() || !ninnikName.trim()}
                                            className={`w-full bg-[#3b82f6] hover:bg-[#60a5fa] disabled:opacity-40 text-white font-bold ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 rounded text-[9.5px]'} tracking-widest transition-all uppercase shrink-0 mt-2 shadow-[0_0_10px_rgba(59,130,246,0.3)]`}
                                        >
                                            다중세계 사랍(Sarab) 보관소에 제출
                                        </button>
                                    </motion.div>
                                )}

                                {(sarabStatus === 'submitting' || sarabStatus === 'evaluating') && (
                                    <motion.div key="sarab-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center py-6 text-center space-y-3">
                                        <RefreshCw size={24} className="text-[#60a5fa] animate-spin" />
                                        <div className="font-mono text-[#60a5fa] text-[10px] tracking-widest uppercase">
                                            {sarabStatus === 'submitting' 
                                                ? "TRANSMITTING DATA..." 
                                                : "EVALUATING CONVINCED CRITERIA..."}
                                        </div>
                                        <p className="text-[8px] text-white/40 max-w-[250px] leading-relaxed">
                                            {sarabStatus === 'submitting' 
                                                ? "답변 데이터가 파란 주파수 통신 대역을 통과하고 있습니다." 
                                                : "제출하신 답변이 니닉의 물리 법칙 및 타당성 납득기준을 통과하는지 대조 분석 중입니다."}
                                        </p>
                                    </motion.div>
                                )}

                                {sarabStatus === 'convinced' && (
                                    <motion.div key="sarab-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-between">
                                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2.5">
                                            <div className="w-10 h-10 rounded-full bg-[#60a5fa]/10 border border-white/20 flex items-center justify-center animate-pulse">
                                                <Award className="text-[#60a5fa]" size={20} />
                                            </div>
                                            <div className="font-mono text-[#60a5fa] text-[11px] font-bold tracking-[0.15em] uppercase">
                                                CONVINCED & INTEGRATED
                                            </div>
                                            <p className="text-[9px] text-white/80 max-w-[280px] break-keep leading-relaxed bg-white/5 border border-white/10 p-2 rounded">
                                                <strong>[{ninnikName}]</strong>(이)가 납득기준을 통과했습니다. 당신의 이야기가 파란별 차원의 정사(正史)로 채택되어 다중세계에 영구 편입되었습니다.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSarabStatus('idle');
                                                setSarabText('');
                                                setNinnikName('');
                                            }}
                                            className={`w-full bg-[#3b82f6]/20 border border-[#3b82f6]/40 hover:bg-[#3b82f6]/40 text-[#60a5fa] font-bold ${isMobile ? 'py-1.5 text-[8px]' : 'py-2 rounded text-[9px]'} tracking-widest transition-all uppercase`}
                                        >
                                            추가 수수께끼 작성하기
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submitted Answers Drawer Log */}
                            {submittedAnswers.length > 0 && (
                                <div className="mt-4 border-t border-white/10 pt-2 shrink-0">
                                    <div className="text-[7.5px] font-mono text-white/40 uppercase mb-1.5">사랍(Sarab) 보관소 보존 기록:</div>
                                    <div className="space-y-1.5 max-h-[80px] overflow-y-auto scrollbar-hide">
                                        {submittedAnswers.map((ans, idx) => (
                                            <div key={idx} className="bg-white/5 border border-white/10 rounded p-1.5 text-[8.5px]">
                                                <div className="flex justify-between items-center text-[#60a5fa] font-bold mb-0.5">
                                                    <span>✦ {ans.title}</span>
                                                    <span className="text-[7px] text-[#22c55e] font-mono">편입 완료</span>
                                                </div>
                                                <p className="text-white/60 truncate">{ans.body}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
