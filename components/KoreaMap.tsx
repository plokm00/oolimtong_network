import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import dynamic from 'next/dynamic'
import { IdentityPortal } from "./IdentityPortal"
import { MainstreamGame } from "./MainstreamGame"
import { UserNodeGame } from "./UserNodeGame"
import { getGateways, getGatewayDetail, incrementResonance, GatewayLocation } from "@/lib/gateway-data"
import {
    USER_NODE_Z_MIN, USER_NODE_Z_RANGE,
    USER_NODE_SPAWN_MARGIN, USER_NODE_SPAWN_WIDTH,
    GATEWAY_EXCLUSION_RADIUS, SPAWN_ATTEMPTS
} from "@/lib/constants"
import { getUserNodes, addUserNode, deleteUserNode, UserNode } from "@/lib/user-node-data"
import { UserNodeModal } from "./UserNodeModal"

import { GatewayModal } from "./GatewayModal"



import { ResonanceMap } from "./ResonanceMap"
import { CinematicTransition } from "./CinematicTransition"
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebase-client'
import { getFirebaseProfile } from '@/lib/firebase-profile'

// Types
// Star and NebulaCloud interfaces moved to ResonanceMap
// StarfieldCanvas and ResonanceWave components moved to ResonanceMap



export default function KoreaMap({ bearing = 0 }: { bearing?: number }) {
    const [selectedLocation, setSelectedLocation] = useState<GatewayLocation | null>(null)
    const [selectedUserNode, setSelectedUserNode] = useState<UserNode | null>(null)
    const [isLoadingDetail, setIsLoadingDetail] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // User Identity State
    const [currentUser, setCurrentUser] = useState<{ id: string; nickname: string; ninnikTitle: string } | null>(null);
    const [showIdentityPortal, setShowIdentityPortal] = useState(false);
    const [entryStep, setEntryStep] = useState<'none' | 'text' | 'vortex' | 'game' | 'user-game'>('none');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showTransitionText, setShowTransitionText] = useState(false);

    // Track active selection ID to prevent race conditions during lazy loading
    const activeSelectedId = useRef<string | null>(null);

    const [isModalLocked, setIsModalLocked] = useState(false);
    const [newNodeId, setNewNodeId] = useState<string | null>(null);

    const handleSetSelected = useCallback((loc: GatewayLocation | null) => {
        if (loc === null && isModalLocked) return; // Prevent unlock/close if locked
        activeSelectedId.current = loc?.id || null;
        setSelectedLocation(loc);
        if (loc !== null) setSelectedUserNode(null);
    }, [isModalLocked]);

    const handleUserNodeSelect = useCallback((node: UserNode | null) => {
        if (node === null && isModalLocked) return;
        setSelectedUserNode(node);
        if (node !== null) setSelectedLocation(null);
    }, [isModalLocked]);

    const handleGatewaySelect = useCallback(async (loc: GatewayLocation | null) => {
        handleSetSelected(loc);

        if (loc && !loc.imageUrl) {
            setIsLoadingDetail(true);
            const detail = await getGatewayDetail(loc.id);
            if (detail && activeSelectedId.current === loc.id) {
                setSelectedLocation(detail);
            }
            setIsLoadingDetail(false);
        }
    }, [handleSetSelected]);

    const handleSync = useCallback(async (id: string, pInc: number, sInc: number) => {
        const updated = await incrementResonance(id, pInc, sInc);
        if (updated) {
            // Update the main locations list (summary)
            setLocations(prev => prev.map(loc => loc.id === id ? { ...loc, participation: updated.participation, sync: updated.sync } : loc));
            // Update the currently selected detail
            if (selectedLocation?.id === id) {
                setSelectedLocation(prev => prev ? { ...prev, participation: updated.participation, sync: updated.sync } : null);
            }
        }
    }, [selectedLocation]);

    // Manage locations dynamically
    const [locations, setLocations] = useState<GatewayLocation[]>([]);
    const [userNodes, setUserNodes] = useState<UserNode[]>([]);

    // Restore only profiles that belong to an active Firebase Authentication session.
    useEffect(() => {
        return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
            if (!firebaseUser) {
                localStorage.removeItem('ninnik_user');
                setCurrentUser(null);
                return;
            }

            try {
                const profile = await getFirebaseProfile(firebaseUser.uid);
                if (!profile) {
                    localStorage.removeItem('ninnik_user');
                    setCurrentUser(null);
                    return;
                }
                localStorage.setItem('ninnik_user', JSON.stringify(profile));
                setCurrentUser(profile);
            } catch (error) {
                console.error('Failed to restore Firebase user session', error);
                setCurrentUser(null);
            }
        });
    }, []);

    useEffect(() => {
        // Fetch dynamic gateways and user nodes on mount from server
        const loadData = async () => {
            const [gatewayData, userNodeData] = await Promise.all([
                getGateways(),
                getUserNodes()
            ]);
            setLocations(gatewayData);
            setUserNodes(userNodeData);
        };
        loadData();
    }, []);

    const handleEnterGateway = (isInitialLogin: boolean = false, userOverride?: any) => {
        const user = userOverride || currentUser;
        if (!user) {
            setShowIdentityPortal(true);
            return;
        }

        if (isInitialLogin) {
            // Restore original login welcome message flow
            // Restore original login welcome message flow
            setEntryStep('text');
            // Maintain selectedLocation so modal reappears/stays after welcome text (and video)
        } else {
            // Mainstream Entry Sequence (RPG Mode)
            setIsTransitioning(true);
            setShowTransitionText(true);

            // Give extra reading time when there is story subText
            const hasSubText = !!selectedLocation;
            const readDuration = hasSubText ? 5500 : 3000;
            const textFadeOutDelay = readDuration - 800; // fade text out a little before the screen closes

            // 1. Fade out the text first
            setTimeout(() => {
                setShowTransitionText(false);
            }, textFadeOutDelay);

            // 2. Then close the blackout overlay and reveal the game
            setTimeout(() => {
                setEntryStep('game');
                setIsTransitioning(false);
            }, readDuration);
        }
    };

    const handleLogout = async () => {
        await signOut(firebaseAuth);
        localStorage.removeItem('ninnik_user');
        setCurrentUser(null);
        setEntryStep('none');
    };

    const handleCreateNode = async () => {
        if (!currentUser) return;

        // Avoid spawning near gateway nodes
        let x = USER_NODE_SPAWN_MARGIN + Math.random() * USER_NODE_SPAWN_WIDTH;
        let y = USER_NODE_SPAWN_MARGIN + Math.random() * USER_NODE_SPAWN_WIDTH;
        for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt++) {
            const cx = USER_NODE_SPAWN_MARGIN + Math.random() * USER_NODE_SPAWN_WIDTH;
            const cy = USER_NODE_SPAWN_MARGIN + Math.random() * USER_NODE_SPAWN_WIDTH;
            const tooClose = locations.some(
                loc => Math.abs(loc.x - cx) < GATEWAY_EXCLUSION_RADIUS && Math.abs(loc.y - cy) < GATEWAY_EXCLUSION_RADIUS
            );
            if (!tooClose) { x = cx; y = cy; break; }
        }
        const z = USER_NODE_Z_MIN + Math.random() * USER_NODE_Z_RANGE;

        const updated = await addUserNode({
            ownerId: currentUser.id,
            x, y, z,
            state: 'superposition',
        });
        
        if (updated && updated.length > 0) {
            const prevIds = new Set(userNodes.map(n => n.id));
            setUserNodes(updated);
            const spawned = updated.find(n => !prevIds.has(n.id));
            if (spawned) setNewNodeId(spawned.id);
        }
    };

    // Clear new-node pulse when user clicks the spawned star, or after 30 s
    useEffect(() => {
        if (selectedUserNode?.id === newNodeId) setNewNodeId(null);
    }, [selectedUserNode, newNodeId]);

    useEffect(() => {
        if (!newNodeId) return;
        const t = setTimeout(() => setNewNodeId(null), 30000);
        return () => clearTimeout(t);
    }, [newNodeId]);

    const handleDeleteNode = async (nodeId: string) => {
        const updated = await deleteUserNode(nodeId);
        setUserNodes(updated);
        setSelectedUserNode(null);
    };

    // Handle initial sizing and resize listeners
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)

        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return (
        <>
            <ResonanceMap
                locations={locations}
                userNodes={userNodes}
                currentUser={currentUser}
                selectedLocation={selectedLocation}
                onSelectLocation={handleGatewaySelect}
                selectedUserNode={selectedUserNode}
                onSelectUserNode={handleUserNodeSelect}
                isMobile={isMobile}
            />

            {/* Interaction Lock Blocker — visible overlay signals "fixed window" */}
            <AnimatePresence>
                {isModalLocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
            </AnimatePresence>

            {/* Mainstream/Blue-star Game Blackout Overlay */}
            <AnimatePresence>
                {(entryStep === 'game' || entryStep === 'user-game') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="fixed inset-0 z-40 bg-black/95 backdrop-blur-3xl"
                    />
                )}
            </AnimatePresence>

            {/* Modal Overlay Layer - Separate from backdrop/content to prevent darkening */}
            <AnimatePresence>
                {selectedUserNode && (
                    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                        <motion.div
                            key="user-node-modal-static-portal"
                            initial={isMobile ? { opacity: 0, scale: 0.9 } : { opacity: 0, x: 20 }}
                            animate={isMobile ? { opacity: 1, scale: 1 } : { opacity: 1, x: 0 }}
                            exit={isMobile ? { opacity: 0, scale: 0.9 } : { opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className={`pointer-events-none select-none ${entryStep === 'user-game'
                                ? (!isMobile ? 'fixed inset-0 flex items-center justify-center z-[50]' : 'fixed left-1/2 -translate-x-1/2 top-[140px] w-[90vw] max-w-[340px] z-[50]')
                                : (!isMobile ? 'fixed right-[265px] top-[calc(55%+5px)] -translate-y-1/2 w-[400px]' : 'fixed left-1/2 -translate-x-1/2 top-[140px] w-[90vw] max-w-[340px]')}`}
                        >
                            <div className="pointer-events-auto h-full w-full flex justify-center items-center">
                                {entryStep === 'user-game' ? (
                                    <UserNodeGame
                                        node={selectedUserNode}
                                        user={currentUser}
                                        userNodes={userNodes}
                                        onClose={() => {
                                            setEntryStep('none');
                                        }}
                                        isMobile={isMobile}
                                        onSwitchToMainstream={() => {
                                            const targetLoc = selectedLocation || locations[0];
                                            if (targetLoc) {
                                                setSelectedLocation(targetLoc);
                                                setSelectedUserNode(null);
                                                setEntryStep('game');
                                            }
                                        }}
                                    />
                                ) : (
                                    <UserNodeModal
                                        node={selectedUserNode}
                                        currentUser={currentUser}
                                        isMobile={isMobile}
                                        onClose={() => {
                                            setIsModalLocked(false);
                                            setSelectedUserNode(null);
                                        }}
                                        onUpdateNode={(updatedNode) => {
                                            setUserNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
                                            setSelectedUserNode(updatedNode);
                                        }}
                                        onDeleteNode={handleDeleteNode}
                                        onNext={() => {
                                            if (!currentUser) return;
                                            const swipeableList = userNodes.filter(n => n.state !== 'superposition' && (n.ownerId === currentUser.id || n.observers?.includes(currentUser.id) || n.id === selectedUserNode.id));
                                            if (swipeableList.length <= 1) return;
                                            const currentIndex = swipeableList.findIndex(n => n.id === selectedUserNode.id);
                                            if (currentIndex === -1) return;
                                            handleUserNodeSelect(swipeableList[(currentIndex + 1) % swipeableList.length]);
                                        }}
                                        onPrev={() => {
                                            if (!currentUser) return;
                                            const swipeableList = userNodes.filter(n => n.state !== 'superposition' && (n.ownerId === currentUser.id || n.observers?.includes(currentUser.id) || n.id === selectedUserNode.id));
                                            if (swipeableList.length <= 1) return;
                                            const currentIndex = swipeableList.findIndex(n => n.id === selectedUserNode.id);
                                            if (currentIndex === -1) return;
                                            handleUserNodeSelect(swipeableList[(currentIndex - 1 + swipeableList.length) % swipeableList.length]);
                                        }}
                                        onSelectNode={handleUserNodeSelect}
                                        swipeableNodes={
                                            currentUser ? userNodes.filter(n => n.state !== 'superposition' && (n.ownerId === currentUser.id || n.observers?.includes(currentUser.id) || n.id === selectedUserNode.id)) : []
                                        }
                                        onLock={setIsModalLocked}
                                        onEnterGame={() => {
                                            setEntryStep('user-game');
                                        }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
                {selectedLocation && (
                    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                        <motion.div
                            key="gateway-modal-static-portal" // Static key prevents card-level fade on gateway switch
                            initial={isMobile ? { opacity: 0, scale: 0.9 } : { opacity: 0, x: 20 }}
                            animate={isMobile ? { opacity: 1, scale: 1 } : { opacity: 1, x: 0 }}
                            exit={isMobile ? { opacity: 0, scale: 0.9 } : { opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className={`pointer-events-none select-none ${entryStep === 'game'
                                ? (!isMobile ? 'fixed inset-0 flex items-center justify-center z-[50]' : 'fixed left-1/2 -translate-x-1/2 top-[140px] w-[90vw] max-w-[340px] z-[50]')
                                : (!isMobile ? 'fixed right-[265px] top-[calc(55%+5px)] -translate-y-1/2 w-[400px]' : 'fixed left-1/2 -translate-x-1/2 top-[140px] w-[90vw] max-w-[340px]')}`}
                        >
                            <div className="pointer-events-auto h-full w-full flex justify-center items-center">
                                {entryStep === 'game' ? (
                                    <MainstreamGame
                                        user={currentUser}
                                        location={selectedLocation}
                                        userNodes={userNodes}
                                        onClose={() => {
                                            setEntryStep('none');
                                        }}
                                        isMobile={isMobile}
                                        onSwitchToBlue={() => {
                                            const playableNodes = userNodes.filter(n => n.state === 'materialized' || (n.state === 'observable' && n.ownerId === currentUser?.id));
                                            if (playableNodes.length > 0) {
                                                setSelectedUserNode(playableNodes[0]);
                                                setSelectedLocation(null);
                                                setEntryStep('user-game');
                                            } else {
                                                alert("연결 가능한 파란별이 없습니다. 먼저 지도에서 파란별을 생성하고 관측(Observe)하여 실체화하십시오.");
                                            }
                                        }}
                                    />
                                ) : (
                                    <GatewayModal
                                        selectedLocation={selectedLocation}
                                        locations={locations}
                                        isLoading={isLoadingDetail}
                                        onNext={() => {
                                            const currentIndex = locations.findIndex(l => l.name === selectedLocation.name);
                                            const nextIndex = (currentIndex + 1) % locations.length;
                                            handleGatewaySelect(locations[nextIndex]);
                                        }}
                                        onPrev={() => {
                                            const currentIndex = locations.findIndex(l => l.name === selectedLocation.name);
                                            const prevIndex = (currentIndex - 1 + locations.length) % locations.length;
                                            handleGatewaySelect(locations[prevIndex]);
                                        }}
                                        setSelectedLocation={handleGatewaySelect}
                                        onSync={handleSync}
                                        onEnter={() => handleEnterGateway(false)}
                                        isMobile={isMobile}
                                        isLoggedIn={!!currentUser}
                                        user={currentUser}
                                        onLock={setIsModalLocked}
                                        onClose={() => {
                                            setIsModalLocked(false);
                                            handleGatewaySelect(null);
                                        }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* User Identity Status UI (Left Side) */}
            <AnimatePresence>
                {currentUser && entryStep === 'none' && (
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`fixed ${isMobile ? 'left-2 top-[93px]' : 'left-[23px] top-[155px]'} z-[20000] flex flex-col items-start gap-2 pointer-events-auto`}
                    >
                        <div className="flex flex-col items-start px-0 py-3 bg-transparent">
                            <div className="flex flex-row items-baseline gap-2">
                                <span className={`text-[#CCFF00] font-mono ${isMobile ? 'text-[8px]' : 'text-[14px]'} opacity-70 tracking-[-0.05em]`} style={{ wordSpacing: '-3px' }}>[{currentUser.ninnikTitle}]</span>
                                <span className={`text-white font-bold ${isMobile ? 'text-[8px]' : 'text-[16px]'} tracking-[-0.03em] shadow-black drop-shadow-md`}>{currentUser.nickname}</span>
                            </div>
                            {(!isMobile || (!selectedLocation && !selectedUserNode)) && (
                            <div className="mt-2 flex flex-col items-start gap-1">
                                <motion.button
                                    onClick={handleCreateNode}
                                    animate={newNodeId ? {
                                        borderColor: ['rgba(96,165,250,1)', 'rgba(59,130,246,0.25)', 'rgba(96,165,250,1)'],
                                        boxShadow: ['0 0 10px rgba(96,165,250,0.5)', '0 0 2px rgba(59,130,246,0.1)', '0 0 10px rgba(96,165,250,0.5)'],
                                        color: ['rgba(96,165,250,1)', 'rgba(59,130,246,0.6)', 'rgba(96,165,250,1)'],
                                    } : {}}
                                    transition={newNodeId ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
                                    className={`${isMobile ? 'px-2 py-1 text-[8px]' : 'px-3 py-1.5 text-[10px]'} border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white font-bold tracking-[0.2em] rounded transition-colors uppercase flex items-center gap-1.5`}
                                >
                                    <span className="text-lg leading-none mt-[-2px]">+</span> MATERIALIZE STAR
                                </motion.button>
                                <AnimatePresence>
                                    {newNodeId && (
                                        <motion.span
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.3 }}
                                            className={`font-mono tracking-widest uppercase text-[#60a5fa] ${isMobile ? 'text-[6px]' : 'text-[8px]'}`}
                                        >
                                            ★ star spawned — click it to record
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className={`${isMobile ? 'mt-2 ml-[1px] text-[6px] font-normal' : 'mt-3 ml-[2px] text-[10px] font-bold'} text-white/30 hover:text-white/60 transition-colors uppercase tracking-tight`}
                            >
                                logout to the earth
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Identity Portal Overlay */}
            <AnimatePresence>
                {showIdentityPortal && (
                    <IdentityPortal
                        onClose={() => setShowIdentityPortal(false)}
                        onComplete={(user) => {
                            setCurrentUser(user);
                            setShowIdentityPortal(false);
                            // Directly trigger login welcome message with the new user object
                            handleEnterGateway(true, user);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Cinematic Entry & Transition Effects (Modularized) */}
            <CinematicTransition
                mode={entryStep}
                user={currentUser}
                isMobile={isMobile}
                isTransitioning={isTransitioning}
                showTransitionText={showTransitionText}
                subText={
                    selectedLocation?.id === 'gateway-1' || selectedLocation?.name === 'WAMORA'
                        ? `${currentUser?.ninnikTitle || '불꽃의 예언자'} ${currentUser?.nickname || '니닉'}님, 미누가 어떻게 자신들의 두 분신을 만들었는지, 그 마법에 대해서 알아보시겠어요?`
                        : selectedLocation
                            ? `${currentUser?.ninnikTitle || ''} ${currentUser?.nickname || ''}님, ${selectedLocation.desc}`
                            : undefined
                }
                onComplete={() => setEntryStep('none')}
            />
        </>
    )
}
