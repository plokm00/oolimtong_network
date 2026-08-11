"use client";

import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    getHangulInitialAnchorId,
    HANGUL_INITIALS,
    HangulInitial,
} from '@/lib/hangul-initial';
import type { DictionaryBodyView } from './DictionaryGrid';

interface DictionaryInitialIndexProps {
    availableInitials: HangulInitial[];
    viewMode: DictionaryBodyView;
    onViewModeChange: (mode: DictionaryBodyView) => void;
}

const DictionaryInitialIndex = ({
    availableInitials,
    viewMode,
    onViewModeChange,
}: DictionaryInitialIndexProps) => {
    const available = useMemo(
        () => new Set<HangulInitial>(availableInitials),
        [availableInitials],
    );
    const [currentInitial, setCurrentInitial] = useState<HangulInitial | null>(
        availableInitials[0] ?? null,
    );
    const [fixedTop, setFixedTop] = useState<number | null>(null);
    const navRef = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
        if (viewMode === 'pebbles') return;

        const nav = navRef.current;
        const firstAvailableInitial = HANGUL_INITIALS.find(initial =>
            available.has(initial),
        );
        if (!nav || !firstAvailableInitial) return;

        const target = document.getElementById(
            getHangulInitialAnchorId(firstAvailableInitial),
        );
        const firstWordName =
            target?.querySelector<HTMLElement>('.dictionary-word-name');
        const firstLink =
            nav.querySelector<HTMLAnchorElement>('a:not(.is-disabled)');
        if (!firstWordName || !firstLink) return;

        let animationFrame = 0;
        let isActive = true;

        const alignIndex = () => {
            animationFrame = 0;
            if (!isActive) return;

            const wordBounds = firstWordName.getBoundingClientRect();
            const linkBounds = firstLink.getBoundingClientRect();
            const nextTop = Math.max(
                16,
                Math.round(
                    wordBounds.top +
                    window.scrollY +
                    wordBounds.height / 2 -
                    linkBounds.height / 2,
                ),
            );

            setFixedTop(current => current === nextTop ? current : nextTop);
        };

        const scheduleAlignment = () => {
            if (animationFrame) window.cancelAnimationFrame(animationFrame);
            animationFrame = window.requestAnimationFrame(alignIndex);
        };

        alignIndex();
        window.addEventListener('resize', scheduleAlignment);

        const resizeObserver = new ResizeObserver(scheduleAlignment);
        resizeObserver.observe(firstWordName);
        resizeObserver.observe(nav);

        document.fonts?.ready.then(scheduleAlignment).catch(() => undefined);

        return () => {
            isActive = false;
            window.removeEventListener('resize', scheduleAlignment);
            resizeObserver.disconnect();
            if (animationFrame) window.cancelAnimationFrame(animationFrame);
        };
    }, [available, viewMode]);

    useEffect(() => {
        let animationFrame = 0;

        const updateCurrentInitial = () => {
            animationFrame = 0;
            const targets = availableInitials
                .map(initial => ({
                    initial,
                    element: document.getElementById(
                        getHangulInitialAnchorId(initial),
                    ),
                }))
                .filter(
                    (
                        target,
                    ): target is {
                        initial: HangulInitial;
                        element: HTMLElement;
                    } => Boolean(target.element),
                );

            if (targets.length === 0) {
                setCurrentInitial(null);
                return;
            }

            const readingLine =
                (navRef.current?.getBoundingClientRect().top ?? 80) + 18;
            let nextInitial = targets[0].initial;

            if (
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 4
            ) {
                nextInitial = targets[targets.length - 1].initial;
            } else {
                targets.forEach(target => {
                    if (
                        target.element.getBoundingClientRect().top <= readingLine
                    ) {
                        nextInitial = target.initial;
                    }
                });
            }

            setCurrentInitial(nextInitial);
        };

        const scheduleUpdate = () => {
            if (animationFrame) return;
            animationFrame = window.requestAnimationFrame(updateCurrentInitial);
        };

        updateCurrentInitial();
        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate);

        return () => {
            window.removeEventListener('scroll', scheduleUpdate);
            window.removeEventListener('resize', scheduleUpdate);
            if (animationFrame) window.cancelAnimationFrame(animationFrame);
        };
    }, [availableInitials]);

    const navigateToInitial = (initial: HangulInitial) => {
        const targetId = getHangulInitialAnchorId(initial);
        const target = document.getElementById(targetId);
        const link =
            navRef.current?.querySelector<HTMLAnchorElement>(
                `[data-initial="${initial}"]`,
            );
        const firstWordName =
            target?.querySelector<HTMLElement>('.dictionary-word-name');
        if (!target || !link || !firstWordName) return;

        setCurrentInitial(initial);
        const wordBounds = firstWordName.getBoundingClientRect();
        const linkBounds = link.getBoundingClientRect();
        const nextScrollTop =
            window.scrollY +
            wordBounds.top +
            wordBounds.height / 2 -
            (linkBounds.top + linkBounds.height / 2);
        const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        window.scrollTo({
            top: Math.max(0, nextScrollTop),
            behavior: reduceMotion ? 'auto' : 'smooth',
        });

        const nextAddress = new URL(window.location.href);
        nextAddress.hash = targetId;
        window.history.replaceState(
            window.history.state,
            '',
            `${nextAddress.pathname}${nextAddress.search}${nextAddress.hash}`,
        );
    };

    const selectInitial = (initial: HangulInitial) => {
        if (viewMode === 'list') {
            navigateToInitial(initial);
            return;
        }

        onViewModeChange('list');
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => navigateToInitial(initial));
        });
    };

    return (
        <nav
            ref={navRef}
            className={`dictionary-initial-index ${
                viewMode === 'pebbles' ? 'is-node-view' : ''
            }`}
            aria-label="한글 자음별 용어 이동"
            style={
                viewMode === 'pebbles' || fixedTop === null
                    ? undefined
                    : {
                        top: fixedTop,
                        maxHeight: `calc(100vh - ${fixedTop}px - 1rem)`,
                    }
            }
        >
            {HANGUL_INITIALS.map(initial => {
                const isAvailable = available.has(initial);
                const isCurrent = currentInitial === initial;

                return (
                    <a
                        key={initial}
                        href={
                            isAvailable
                                ? `#${getHangulInitialAnchorId(initial)}`
                                : undefined
                        }
                        className={[
                            isCurrent ? 'active' : '',
                            !isAvailable ? 'is-disabled' : '',
                        ].filter(Boolean).join(' ')}
                        data-initial={initial}
                        aria-current={isCurrent ? 'location' : undefined}
                        aria-disabled={!isAvailable || undefined}
                        aria-label={`${initial}으로 이동`}
                        onClick={event => {
                            event.preventDefault();
                            if (isAvailable) selectInitial(initial);
                        }}
                    >
                        <span>{initial}</span>
                    </a>
                );
            })}
            <button
                type="button"
                className={`dictionary-pebble-view-toggle ${
                    viewMode === 'pebbles' ? 'active' : ''
                }`}
                aria-label={
                    viewMode === 'pebbles'
                        ? '단어 목록 보기로 전환'
                        : '우주 노드 보기로 전환'
                }
                aria-pressed={viewMode === 'pebbles'}
                title={
                    viewMode === 'pebbles'
                        ? '단어 목록 보기'
                        : '우주 노드 보기'
                }
                onClick={() =>
                    onViewModeChange(
                        viewMode === 'pebbles' ? 'list' : 'pebbles',
                    )
                }
            >
                <span className="dictionary-pebble-view-toggle-stone" />
            </button>
        </nav>
    );
};

export default DictionaryInitialIndex;
