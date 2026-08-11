import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { UserNode } from "@/lib/user-node-data"

interface UserNodeModalProps {
    node: UserNode;
    currentUser: { id: string, nickname?: string } | null;
    isMobile: boolean;
    onClose: () => void;
    onUpdateNode: (updatedNode: UserNode) => void;
    onDeleteNode: (nodeId: string) => void;
    onNext?: () => void;
    onPrev?: () => void;
    onLock?: (locked: boolean) => void;
    swipeableNodes?: UserNode[];
    onSelectNode?: (node: UserNode) => void;
    onEnterGame?: () => void;
}

export const UserNodeModal = ({
    node,
    currentUser,
    isMobile,
    onClose,
    onUpdateNode,
    onDeleteNode,
    onNext,
    onPrev,
    onLock,
    swipeableNodes,
    onSelectNode,
    onEnterGame
}: UserNodeModalProps) => {
    const isOwner = currentUser?.id === node.ownerId;
    const isSuperpositionOwner = node.state === 'superposition' && isOwner;
    const [closePhase, setClosePhase] = useState<0 | 1>(0);
    const isRegistration = isSuperpositionOwner;

    // Lock only during phase 0 (before first close press)
    useEffect(() => {
        if (onLock) onLock(isSuperpositionOwner && closePhase === 0);
        return () => { if (onLock) onLock(false); };
    }, [isSuperpositionOwner, closePhase, onLock]);
    
    // Check if the user has seen the tutorial
    const [showTutorial, setShowTutorial] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('ninnik_unode_tut');
        }
        return false;
    });

    const handleAckTutorial = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('ninnik_unode_tut', 'true');
        }
        setShowTutorial(false);
        setClosePhase(0);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [name, setName] = useState(node.name || "");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [desc, setDesc] = useState(node.description || "");

    const handleUploadSubmit = async () => {
        if (!name || !selectedFile || desc.length < 300) return;
        setIsSubmitting(true);
        try {
            // Upload image first
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!uploadRes.ok) {
                const errorData = await uploadRes.json();
                alert(errorData.error || 'Upload failed');
                setIsSubmitting(false);
                return;
            }
            
            const uploadData = await uploadRes.json();
            const finalPhotoUrl = uploadData.url;

            const res = await fetch('/api/user-nodes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: node.id,
                    fields: {
                        name: name,
                        description: desc,
                        photoUrl: finalPhotoUrl,
                        state: 'observable'
                    }
                })
            });
            if (res.ok) {
                const updatedList = await res.json();
                const updatedCmd = updatedList.find((n: UserNode) => n.id === node.id);
                if (updatedCmd) onUpdateNode(updatedCmd);
            }
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleObserve = async () => {
        if (!currentUser) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/user-nodes/observe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nodeId: node.id,
                    observerId: currentUser.id
                })
            });
            if (res.ok) {
                const updatedNode = await res.json();
                onUpdateNode(updatedNode);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            onDeleteNode(node.id);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="relative w-full">

        {isSuperpositionOwner && (
            <div className={`pointer-events-auto absolute ${isMobile ? '-top-9' : '-top-10'} right-0 z-[101] flex justify-end`}>
                <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (closePhase === 0) setClosePhase(1); // 1st press: overlay 사라짐, 모달 유지
                        else onClose();                          // 2nd press: 모달 닫힘
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                        closePhase === 1
                            ? 'text-white/20 bg-white/5 hover:text-white/40'
                            : 'text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <span className={`font-mono tracking-widest uppercase ${isMobile ? 'text-[7px]' : 'text-[9px]'}`}>close</span>
                    <X size={isMobile ? 11 : 13} />
                </motion.button>
            </div>
        )}

        <motion.div
            key="user-node-modal-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            drag={isDeleting || isSubmitting || isRegistration ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.03}
            onDragEnd={(e, info) => {
                if (isDeleting || isSubmitting || isRegistration) return;
                if (info.offset.x > 50 && onNext) onNext();
                else if (info.offset.x < -50 && onPrev) onPrev();
            }}
            className={`pointer-events-auto bg-[#0b1617]/95 backdrop-blur-xl rounded ${isMobile ? 'p-4 w-full h-[550px]' : 'p-8 w-[400px] h-[650px]'} flex flex-col items-center text-center shadow-[0_0_80px_rgba(0,0,0,0.8)] z-[100] relative overflow-hidden`}
            onClick={(e) => {
                e.stopPropagation();
                if (closePhase === 1) {
                    setClosePhase(0);
                }
            }}
            onMouseDown={() => {
                if (closePhase === 1) {
                    setClosePhase(0);
                }
            }}
            onTouchStart={() => {
                if (closePhase === 1) {
                    setClosePhase(0);
                }
            }}
        >

            <AnimatePresence mode="wait">
                {/* 1. Superposition (Owner Only) -> Tutorial overlay & Form to Upload */}
                {node.state === 'superposition' && isOwner && (
                    showTutorial ? (
                        <motion.div key="tutorial" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full h-full flex flex-col pt-4 items-center justify-center">
                            <div className="text-[#3b82f6] text-[10px] font-mono tracking-[0.2em] mb-6 uppercase font-bold text-center">System Guide</div>
                            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-6 text-center leading-tight tracking-[-0.03em]`}>파동의 붕괴를<br/>시작하시겠습니까?</h2>
                            <div className="w-full bg-black/40 border border-white/10 rounded p-5 mb-8 text-left space-y-4 shadow-inner">
                                <p className="text-white text-sm leading-relaxed tracking-wide font-medium">
                                    방금 띄우신 푸른 별은 아직 우주에 완전히 <strong className="text-[#60a5fa]">실체화되지 않은 확률 구름 상태</strong>입니다.
                                </p>
                                <p className="text-white/70 text-xs leading-relaxed tracking-wide">
                                    오프라인에서 흙으로 자신만의 울림통을 빚은 뒤, 그 사진과 이야기를 이곳에 기록해주세요.
                                    기록이 업로드되면 이 별은 비로소 <strong>다른 사람들에게 관측 가능한 상태</strong>가 됩니다.
                                </p>
                                <p className="text-white/70 text-xs leading-relaxed tracking-wide">
                                    이후, 우주를 여행하던 다른 누군가가 이 별을 발견하고 <span className="text-[#60a5fa] font-bold">맨 처음 관측하는 순간</span>...별이 완전히 빛을 내며 서로 연락할 수 있는 <strong>통신망(메신저)</strong>이 열리게 됩니다!
                                </p>
                            </div>
                            
                            <button
                                onClick={handleAckTutorial}
                                className={`w-full ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} bg-[#3b82f6] hover:bg-[#60a5fa] text-white font-bold tracking-[0.2em] rounded transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] shadow-[#3b82f6]/50`}
                            >
                                START RECORDING
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full h-full flex flex-col pt-4">
                            <div className="text-[#3b82f6] text-[10px] font-mono tracking-[0.2em] mb-2 uppercase font-bold">Unstable Node Detected</div>
                            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-white mb-4`}>Materialize Your Oolimtong</h2>
                            <p className="text-white/60 text-xs mb-6 text-left border-l border-white/20 pl-2">Upload a photo and description of your physical creation to anchor it in this coordinate.</p>
                            
                            <input
                                type="text"
                                placeholder="별 이름"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded p-3 text-white text-sm mb-4 outline-none focus:border-[#3b82f6]"
                            />

                            <div className="w-full mb-4">
                                <input
                                    type="file"
                                    id="file-upload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setSelectedFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                <label 
                                    htmlFor="file-upload" 
                                    className={`w-full flex items-center justify-center p-3 border rounded cursor-pointer transition-colors ${selectedFile ? 'border-[#3b82f6] text-[#3b82f6] bg-[#3b82f6]/10' : 'border-white/20 text-white/50 bg-black/50 hover:border-[#3b82f6]'}`}
                                >
                                    <span className="text-sm truncate px-4">
                                        {selectedFile ? selectedFile.name : "browse & upload photo"}
                                    </span>
                                </label>
                            </div>

                            <div className="w-full mb-6 relative">
                                <textarea
                                    placeholder="당신의 창작물에 얽힌 이야기를 들려주세요 (최소 300자)..."
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    className="w-full h-32 bg-black/50 border border-white/20 rounded p-3 text-white text-sm outline-none focus:border-[#3b82f6] resize-none"
                                />
                                <div className={`absolute bottom-2 right-2 text-xs font-mono font-bold ${desc.length < 300 ? 'text-red-400' : 'text-green-400'}`}>
                                    {desc.length} / 300
                                </div>
                            </div>

                            <button
                                onClick={handleUploadSubmit}
                                disabled={isSubmitting || !name || !selectedFile || desc.length < 300}
                                className={`mt-auto w-full ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} bg-[#3b82f6] text-white hover:bg-[#60a5fa] disabled:opacity-50 font-bold tracking-[0.2em] rounded transition-all uppercase`}
                            >
                                {isSubmitting ? "TRANSMITTING..." : "BROADCAST TO NETWORK"}
                            </button>

                            {/* Delete Button for owner */}
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className={`mt-3 w-full ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} text-red-400/60 hover:text-red-400 font-mono tracking-[0.15em] transition-colors uppercase`}
                            >
                                DISSOLVE STAR
                            </button>
                        </motion.div>
                    )
                )}

                {/* 2. Observable (Others) -> Click to Observe */}
                {node.state === 'observable' && !isOwner && (
                    <motion.div key="observe" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full h-full flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                            <div className="w-16 h-16 rounded-full bg-[#60a5fa]/10 blur-md"></div>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2 tracking-widest">UNOBSERVED NODE</h2>
                        <p className="text-white/50 text-xs mb-8">This node exists in a state of probability. Your observation will collapse the wave function and materialize its form.</p>
                        
                        <button
                            onClick={handleObserve}
                            disabled={isSubmitting}
                            className={`w-full ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white font-bold tracking-[0.2em] rounded transition-all uppercase`}
                        >
                            {isSubmitting ? "COLLAPSING..." : "OBSERVE NODE"}
                        </button>
                    </motion.div>
                )}

                {/* 3. Materialized (or Observable by Owner) -> Full view */}
                {(node.state === 'materialized' || (node.state === 'observable' && isOwner)) && (
                    <motion.div key="view" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full h-full flex flex-col">
                        {/* 1. Header Section (Fixed) */}
                        <div className="flex-none pointer-events-none">
                            <div className="flex gap-2 mb-2 justify-center py-2 relative z-20 pointer-events-auto">
                                {swipeableNodes?.map((n) => (
                                    <div key={n.id} className="relative cursor-pointer group" onClick={() => onSelectNode && onSelectNode(n)}>
                                        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${node.id === n.id
                                            ? 'bg-[#3b82f6] shadow-[0_0_10px_#3b82f6]'
                                            : 'bg-white/10 group-hover:bg-white/30'
                                            }`} />
                                    </div>
                                ))}
                            </div>

                            <div className="w-full flex flex-col items-center mb-1">
                                <h2 className={`${isMobile ? 'text-lg' : 'text-3xl'} font-bold text-white tracking-tighter leading-tight`}>{node.name || "User Node"}</h2>
                            </div>
                            <p className={`${isMobile ? 'text-[8px] mb-2' : 'text-[10px] mb-3'} text-white/70 font-mono border-b border-white/20 pb-2 w-full uppercase`}>
                                {node.state === 'materialized' ? "MATERIALIZED NODE" : "AWAITING OBSERVATION"}
                            </p>
                        </div>

                        {/* 2. Image Section (Fixed) */}
                        <div className="flex-none pointer-events-none">
                            <div className={`w-full ${isMobile ? 'h-32 mb-3' : 'h-48 mb-4'} overflow-hidden rounded border border-white/10 bg-black/40`}>
                                {node.photoUrl ? (
                                    <motion.img
                                        key={node.photoUrl}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.8 }}
                                        src={node.photoUrl}
                                        alt="Oolimtong"
                                        className="w-full h-full object-cover pointer-events-none"
                                        draggable="false"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px] font-mono tracking-widest">
                                        INITIALIZING_VISUAL...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Description Section (Scrollable) */}
                        <div className="flex-1 overflow-y-auto px-1 mb-3 scrollbar-hide text-left min-h-0" style={{ touchAction: 'pan-y' }}>
                            <p className={`text-white/90 ${isMobile ? 'text-[10px]' : 'text-[12px]'} leading-relaxed tracking-normal border-l-2 border-white/20 py-1 pl-3 whitespace-pre-wrap break-words`}>
                                {node.description}
                            </p>
                        </div>
                        
                        {/* 5. Buttons Section (Fixed) */}
                        <div className="flex-none w-full flex flex-col gap-2 pointer-events-auto mb-2">
                            {(node.state === 'materialized' || (node.state === 'observable' && isOwner)) && (
                                <button
                                    onClick={onEnterGame}
                                    className={`w-full ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} bg-[#3b82f6] text-white hover:bg-[#60a5fa] font-bold tracking-[0.25em] rounded transition-all uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.35)]`}
                                >
                                    <span>ENTER BLUE FREQUENCY ✦</span>
                                </button>
                            )}

                            {isOwner && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className={`w-full ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} bg-transparent text-red-400/60 font-bold tracking-[0.2em] rounded border border-white/10 hover:bg-red-500/10 hover:text-red-400 transition-all uppercase`}
                                >
                                    DISSOLVE STAR
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Overlay */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded flex flex-col items-center justify-center z-10 p-6"
                    >
                        <div className="w-16 h-16 rounded-full border-2 border-red-500/50 flex items-center justify-center mb-6">
                            <motion.div
                                className="w-3 h-3 rounded-full bg-red-500"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2 tracking-widest">NODE DISSOLUTION</h3>
                        <p className="text-white/50 text-xs mb-8 leading-relaxed text-center">
                            이 별을 소멸시키면 되돌릴 수 없습니다.<br/>
                            우주에서 완전히 사라지게 됩니다.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className={`flex-1 ${isMobile ? 'py-2 text-[10px]' : 'py-2.5 text-xs'} border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-bold tracking-[0.2em] rounded transition-all uppercase`}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className={`flex-1 ${isMobile ? 'py-2 text-[10px]' : 'py-2.5 text-xs'} bg-red-600/80 hover:bg-red-500 text-white font-bold tracking-[0.2em] rounded transition-all uppercase shadow-[0_0_20px_rgba(220,38,38,0.3)]`}
                            >
                                {isDeleting ? "DISSOLVING..." : "CONFIRM"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
        </div>
    );
};
