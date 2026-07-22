import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, X } from "lucide-react"
import dynamic from 'next/dynamic'
import { GatewayLocation } from "@/lib/gateway-data"
import { OnlineRitualContainer } from "./ritual/online/OnlineRitualContainer";
import { OfflineRitualContainer } from "./ritual/offline/OfflineRitualContainer";
import { SEOUL, DRAG_THRESHOLD_PX } from "@/lib/constants"

// Module-level image cache — persists across re-mounts, avoids re-fetching
const imageCache = new Map<string, string>();

// Dynamically import our custom LeafletMap component to solve SSR window error
const LeafletMap = dynamic(() => import('./LeafletMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-black animate-pulse flex items-center justify-center text-[#CCFF00] font-mono text-[10px]">INITIALIZING MAP_ENGINE...</div>
});

interface GatewayModalProps {
    selectedLocation: GatewayLocation;
    locations: GatewayLocation[];
    onNext: () => void;
    onPrev: () => void;
    setSelectedLocation: (loc: GatewayLocation | null) => void;
    onSync: (id: string, p: number, s: number) => Promise<void>;
    onEnter: () => void;
    isMobile: boolean;
    isLoading?: boolean;
    isLoggedIn?: boolean;
    user?: { nickname: string } | null;
    onLock?: (locked: boolean) => void;
    onClose?: () => void;
}

// Modal Component
export const GatewayModal = ({
    selectedLocation,
    locations,
    onNext,
    onPrev,
    setSelectedLocation,
    onSync,
    onEnter,
    isMobile,
    isLoading,
    isLoggedIn,
    user,
    onLock,
    onClose
}: GatewayModalProps) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [viewMode, setViewMode] = useState<'info' | 'nav' | 'participation' | 'sync'>('info');
    const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
    const [isImgPreloading, setIsImgPreloading] = useState(false);
    const [closePhase, setClosePhase] = useState<0 | 1>(0);

    // Reset closePhase when viewMode changes
    useEffect(() => {
        setClosePhase(0);
    }, [viewMode]);

    // Notify parent of lock state
    useEffect(() => {
        const isGame = viewMode === 'participation' || viewMode === 'sync';
        if (onLock) onLock(isGame && closePhase === 0);
    }, [viewMode, closePhase, onLock]);

    // Internal state to hold the 'best' version of the location data to prevent flickering
    // when parent passes a 'summary' object (missing image/desc) for the same ID.
    const [displayLocation, setDisplayLocation] = useState(selectedLocation);

    useEffect(() => {
        setDisplayLocation(prev => {
            // If completely new location, switch immediately
            if (selectedLocation.id !== prev.id) {
                return selectedLocation;
            }
            // If same location, merge to preserve rich data (desc, imageUrl) 
            // while updating stats (participation, sync)
            return {
                ...selectedLocation,
                imageUrl: selectedLocation.imageUrl || prev.imageUrl,
                desc: selectedLocation.desc || prev.desc
            };
        });
    }, [selectedLocation]);

    const isUnlocked = displayLocation.participation >= 100;
    const isPeak = isUnlocked && displayLocation.sync >= 100;
    const isLocked = viewMode === 'participation' || viewMode === 'sync';

    const startPos = { lat: SEOUL.lat, lng: SEOUL.lng, address: SEOUL.address };
    const targetPos = { lat: displayLocation.lat, lng: displayLocation.lng };

    // Image loading with module-level cache — avoids re-fetching already-seen images
    useEffect(() => {
        const url = displayLocation.imageUrl;
        if (!url) {
            setLocalImageUrl(null);
            setIsImgPreloading(false);
            return;
        }
        // Serve from cache instantly
        if (imageCache.has(url)) {
            setLocalImageUrl(url);
            setIsImgPreloading(false);
            return;
        }
        setIsImgPreloading(true);
        const img = new Image();
        img.src = url;
        img.onload = () => {
            imageCache.set(url, url);
            setLocalImageUrl(url);
            setIsImgPreloading(false);
        };
        img.onerror = () => setIsImgPreloading(false);
    }, [displayLocation.id, displayLocation.imageUrl]);

    // Approximation of real-world distance
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    const distanceKm = useMemo(
        () => getDistance(startPos.lat, startPos.lng, targetPos.lat, targetPos.lng).toFixed(1),
        [displayLocation.lat, displayLocation.lng]  // stable primitives, not object reference
    );
    const etaMin = useMemo(() => Math.round(parseFloat(distanceKm) * 1.5 + 5), [distanceKm]);

    return (
        <div className="relative w-full">
            {/* External navigation buttons */}
            <AnimatePresence>
                <div className={`pointer-events-auto absolute ${isMobile ? '-top-9 left-0 right-0' : '-top-10 left-0 right-0'} z-[101] flex justify-between`}>
                    {isLocked ? (
                        <motion.button
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            onClick={() => setViewMode('info')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all`}
                        >
                            <ArrowLeft size={isMobile ? 11 : 13} />
                            <span className={`font-mono tracking-widest uppercase ${isMobile ? 'text-[7px]' : 'text-[9px]'}`}>back</span>
                        </motion.button>
                    ) : <div />}
                    {isLocked && (
                        <motion.button
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (closePhase === 0) setClosePhase(1);
                                else if (onClose) onClose();
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
                    )}
                </div>
            </AnimatePresence>

            <motion.div
                key="gateway-modal-content"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                drag={isLocked ? false : "x"} // Disable drag if locked
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.03} // Extremely reduced for minimal movement
                onDragEnd={(e, info) => {
                    if (isLocked) return;
                    // Direction Swapped: Right swipe (offset > 0) -> Next, Left swipe (offset < 0) -> Prev
                    if (info.offset.x > DRAG_THRESHOLD_PX) onNext();
                    else if (info.offset.x < -DRAG_THRESHOLD_PX) onPrev();
                }}
                className={`pointer-events-auto bg-[#0b1617]/95 backdrop-blur-xl rounded ${isMobile ? (isLocked ? 'px-4 pt-2 pb-2 w-full h-[550px]' : 'p-4 w-full h-[550px]') : (isLocked ? 'px-8 pt-4 pb-4 w-[400px] h-[650px]' : 'p-8 w-[400px] h-[650px]')} flex flex-col items-center text-center z-[100] relative overflow-hidden transition-shadow duration-500 ${isLocked ? 'shadow-[0_0_60px_rgba(204,255,0,0.08),0_0_120px_rgba(0,0,0,0.9)]' : 'shadow-[0_0_80px_rgba(0,0,0,0.8)]'}`}
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
                {viewMode === 'info' ? (
                    <motion.div
                        key="info-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0 } }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full flex flex-col"
                    >
                        {/* 1. Header Section (Fixed) */}
                        <div className="flex-none pointer-events-none">
                            <div className="flex gap-2 mb-2 justify-center py-2 relative z-20 pointer-events-auto">
                                {locations.map((loc, idx) => (
                                    <div key={loc.id} className="relative cursor-pointer group" onClick={() => setSelectedLocation(loc)}>
                                        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${displayLocation.name === loc.name
                                            ? 'bg-[#CCFF00] shadow-[0_0_10px_#CCFF00]'
                                            : 'bg-white/10 group-hover:bg-white/30'
                                            }`} />
                                    </div>
                                ))}
                            </div>

                            <div className="w-full flex flex-col items-center mb-1">
                                <h2 className={`${isMobile ? 'text-lg' : 'text-3xl'} font-bold text-white tracking-tighter leading-tight`}>{displayLocation.name}</h2>
                            </div>
                            <p className={`${isMobile ? 'text-[8px] mb-2' : 'text-[10px] mb-3'} text-white/70 font-mono border-b border-white/20 pb-2 w-full`}>{displayLocation.address}</p>
                        </div>

                        {/* 2. Image Section (Fixed) - pointer-events-none to let drag through */}
                        <div className="flex-none pointer-events-none">
                            {(isLoading || isImgPreloading || !localImageUrl) && displayLocation.imageUrl ? (
                                <div className={`w-full ${isMobile ? 'h-32 mb-3' : 'h-48 mb-4'} rounded border border-white/10 bg-white/5 animate-pulse flex items-center justify-center`}>
                                    <span className="text-[8px] font-mono text-white/20 tracking-widest uppercase">INITIALIZING_VISUAL...</span>
                                </div>
                            ) : localImageUrl ? (
                                <div className={`w-full ${isMobile ? 'h-32 mb-3' : 'h-48 mb-4'} overflow-hidden rounded border border-white/10 bg-black/40`}>
                                    <motion.img
                                        key={localImageUrl}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.8 }}
                                        src={localImageUrl}
                                        alt={displayLocation.name}
                                        className="w-full h-full object-cover pointer-events-none"
                                        draggable="false"
                                    />
                                </div>
                            ) : null}
                        </div>

                        {/* 3. Description Section (Scrollable) - touch-action: pan-y to allow horizontal drag */}
                        <div className="flex-1 overflow-y-auto px-1 mb-3 scrollbar-hide text-left min-h-0" style={{ touchAction: 'pan-y' }}>
                            {isLoading ? (
                                <div className="w-full space-y-2 py-2">
                                    <div className="h-2 w-full bg-white/10 rounded animate-pulse" />
                                    <div className="h-2 w-4/5 bg-white/10 rounded animate-pulse" />
                                </div>
                            ) : (
                                <p className={`text-white/90 ${isMobile ? 'text-[10px]' : 'text-[12px]'} leading-relaxed tracking-normal border-l-2 border-[#CCFF00]/30 py-1 pl-3 whitespace-pre-wrap break-words`}>
                                    {displayLocation.desc}
                                </p>
                            )}
                        </div>

                        <div className={`flex-none w-full ${isMobile ? 'space-y-[2px] mb-4' : 'space-y-[8px] mb-6'}`}>
                            {/* Stage 01: Participation Button */}
                            <div
                                className="group cursor-pointer p-1 rounded hover:bg-white/5 transition-all"
                                onClick={() => setViewMode('participation')}
                            >
                                <div className={`flex justify-between items-center ${isMobile ? 'text-[7px]' : 'text-[9px]'} font-mono mb-1.5 px-1`}>
                                    <span className="text-white/60 group-hover:text-white transition-colors">PARTICIPATION</span>
                                    <span className={displayLocation.participation === 100 ? "text-[#CCFF00] font-semibold" : "text-white/80"}>
                                        {displayLocation.participation === 100 ? "COMPLETED" : `${displayLocation.participation}%`}
                                    </span>
                                </div>
                                <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden transition-all">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${displayLocation.participation}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-[#CCFF00]"
                                        style={{ boxShadow: displayLocation.participation > 0 ? '0 0 10px #CCFF00' : 'none' }}
                                    />
                                </div>
                            </div>

                            {/* Stage 02: Synchronization Button */}
                            <div
                                className={`group p-1 rounded transition-all ${!isUnlocked ? "opacity-30 cursor-default" : "cursor-pointer hover:bg-white/5"}`}
                                onClick={() => isUnlocked && setViewMode('sync')}
                            >
                                <div className={`flex justify-between items-center ${isMobile ? 'text-[7px]' : 'text-[9px]'} font-mono mb-1.5 px-1`}>
                                    <span className={`transition-colors ${!isUnlocked ? 'text-white/40' : 'text-white/60 group-hover:text-white'}`}>SYNCHRONIZATION</span>
                                    <span className={displayLocation.sync === 100 ? "text-[#CCFF00] font-semibold" : "text-white/80"}>
                                        {!isUnlocked ? "LOCKED" : (displayLocation.sync === 100 ? "COMPLETED" : `${displayLocation.sync}%`)}
                                    </span>
                                </div>
                                <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden transition-all">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${displayLocation.sync}%` }}
                                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                                        className="h-full bg-[#CCFF00]"
                                        style={{ boxShadow: displayLocation.sync > 0 ? '0 0 10px #CCFF00' : 'none' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 5. Buttons Section (Fixed) */}
                        <div className="flex-none w-full flex flex-col gap-2 pointer-events-auto">
                            {/* Sequential or Dual Choice Action Button */}
                            {isPeak ? (
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={() => setViewMode('participation')}
                                        className={`flex-1 ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} bg-white/5 text-white/60 font-medium tracking-widest rounded border border-white/10 hover:bg-white/20 hover:text-white transition-all`}
                                        title="Practice Online Ritual (No extra contribution)"
                                    >
                                        ONLINE (DONE)
                                    </button>
                                    <button
                                        onClick={() => setViewMode('sync')}
                                        className={`flex-1 ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} bg-white/5 text-white/60 font-medium tracking-widest rounded border border-white/10 hover:bg-white/20 hover:text-white transition-all`}
                                        title="Practice Offline Ritual (No extra contribution)"
                                    >
                                        OFFLINE (DONE)
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (!isUnlocked) {
                                            setViewMode('participation'); // Stage 1: Online
                                        } else {
                                            setViewMode('sync'); // Stage 2: Offline
                                        }
                                    }}
                                    disabled={isSyncing}
                                    className={`w-full ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} bg-white/10 text-white font-semibold tracking-[0.2em] rounded flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/20 disabled:opacity-50`}
                                >
                                    {isSyncing
                                        ? "SYNCHRONIZING..."
                                        : !isUnlocked
                                            ? "PRACTICE SYNC (ONLINE)"
                                            : "RESONANCE SYNC (OFFLINE)"
                                    }
                                </button>
                            )}

                            {/* Mainstream Entry Button */}
                            {isLoggedIn && isPeak ? (
                                <button
                                    onClick={onEnter}
                                    className={`w-full ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:bg-[#b3ff00] font-semibold tracking-[0.2em] rounded flex items-center justify-center gap-2 transition-all uppercase border border-transparent`}
                                >
                                    START MAINSTREAM
                                </button>
                            ) : (
                                <button
                                    onClick={onEnter}
                                    disabled={!isPeak}
                                    className={`w-full ${isMobile ? 'py-1.5 text-[8.5px]' : 'py-2 text-[9.5px]'} ${isPeak ? 'bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:bg-[#b3ff00] border border-transparent' : 'bg-white/5 text-white/20 cursor-default border border-white/10'} font-semibold tracking-[0.2em] rounded flex items-center justify-center gap-2 transition-all uppercase`}
                                >
                                    {isPeak ? "ENTER GATEWAY" : "LOCKED (THRESHOLD_PENDING)"}
                                </button>
                            )}

                            <div className={`px-4 ${isMobile ? 'py-1.5 text-[7px]' : 'py-2 text-[9px]'} rounded font-mono tracking-widest border transition-all duration-500 flex items-center justify-center gap-2 ${isPeak
                                ? 'bg-[#CCFF00]/5 border-[#CCFF00]/30 text-[#CCFF00]/80'
                                : 'bg-white/5 border-white/10 text-white/40'
                                }`}>
                                <span className="uppercase">MAINSTREAM [{displayLocation?.mainstream || 0}%]</span>
                                <span className="uppercase ml-4">[{startPos.address || 'UNKNOWN'}]</span>
                            </div>
                        </div>
                    </motion.div>
                ) : viewMode === 'nav' ? (
                    <motion.div
                        key="nav-view"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="w-full h-full flex flex-col"
                    >
                        <div className="text-[#CCFF00] text-[10px] font-mono tracking-[0.2em] mb-4 uppercase font-medium text-left">Tactical Navigator (Real Engine)</div>

                        {/* Address HUD */}
                        <div className="w-full bg-white/5 border-l-2 border-[#CCFF00] p-3 mb-4 text-left space-y-2">
                            <div className="flex flex-col">
                                <span className="text-[7px] text-[#CCFF00]/60 font-mono uppercase">Starting point</span>
                                <span className="text-[11px] text-white font-medium truncate">{startPos.address}</span>
                            </div>
                            <div className="w-full h-[1px] bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[7px] text-[#CCFF00]/60 font-mono uppercase">Destination</span>
                                <span className="text-[11px] text-white font-medium truncate">{displayLocation.address}</span>
                            </div>
                        </div>

                        {/* Real Map Container */}
                        <div className="flex-1 bg-black/60 border border-white/10 rounded overflow-hidden relative mb-2 group/map" style={{ minHeight: isMobile ? "120px" : "200px" }}>
                            <div className="w-full h-full z-10 relative">
                                <LeafletMap
                                    startPos={startPos}
                                    targetPos={targetPos}
                                    gatewayName={displayLocation.name}
                                />
                                <div className="absolute inset-0 pointer-events-none border border-[#CCFF00]/10 z-[1000]" />
                            </div>
                        </div>

                        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2 mb-3' : 'grid-cols-2 gap-3 mb-6'}`}>
                            <div className={`${isMobile ? 'p-2' : 'p-3'} bg-white/5 rounded border border-white/10`}>
                                <span className="text-[7px] text-[#CCFF00]/60 font-mono mb-0.5 uppercase">Distance</span>
                                <span className={`${isMobile ? 'text-base' : 'text-xl'} font-semibold text-white tracking-widest`}>{distanceKm}<span className="text-[8px] ml-1 text-white/50">KM</span></span>
                            </div>
                            <div className={`${isMobile ? 'p-2' : 'p-3'} bg-white/5 rounded border border-white/10`}>
                                <span className="text-[7px] text-[#CCFF00]/60 font-mono mb-0.5 uppercase">Travel Time</span>
                                <span className={`${isMobile ? 'text-base' : 'text-xl'} font-semibold text-[#CCFF00] tracking-widest`}>{etaMin}<span className="text-[8px] ml-1 text-[#CCFF00]/50">MIN</span></span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-auto">
                            <button
                                onClick={() => setViewMode('info')}
                                className={`w-full ${isMobile ? 'py-2 text-[8px]' : 'py-3 text-[10px]'} bg-transparent border border-white/20 text-white/70 font-medium tracking-[0.2em] rounded hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 uppercase`}
                            >
                                Terminate Guide
                            </button>
                        </div>
                    </motion.div>
                ) : viewMode === 'participation' ? (
                    <motion.div
                        key="participation-view"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full h-full"
                    >
                        <OnlineRitualContainer
                            gatewayId={displayLocation.id}
                            gatewayName={displayLocation.name}
                            gatewayLat={displayLocation.lat}
                            gatewayLng={displayLocation.lng}
                            onBack={() => setViewMode('info')}
                            onComplete={() => {
                                // Only add points if not already complete (prevent spamming on auto-close)
                                if (displayLocation.participation < 100) {
                                    onSync(displayLocation.id, 1, 0);
                                }
                                setViewMode('info');
                            }}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sync-view"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full h-full"
                    >
                        <OfflineRitualContainer
                            location={displayLocation}
                            onBack={() => setViewMode('info')}
                            onComplete={() => {
                                // Only add points if not already complete
                                if (displayLocation.sync < 100) {
                                    onSync(displayLocation.id, 0, 1);
                                }
                                setViewMode('info');
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
        </div>
    );
};
