import { useState, useEffect, useRef, useCallback } from 'react';

export const useAudioInput = (active: boolean = false) => {
    const [volume, setVolume] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const requestRef = useRef<number | null>(null);

    const startListening = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8; // Smooth out the volume
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;
            source.connect(analyser);

            setIsListening(true);
            analyze();
        } catch (err: any) {
            console.error("Microphone access denied or error:", err);
            setError("Check microphone permissions");
            setIsListening(false);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }

        if (audioContextRef.current) {
            if (audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
            audioContextRef.current = null;
        }

        setIsListening(false);
        setVolume(0);
    }, []);

    const analyze = () => {
        if (!analyserRef.current || !active) return; // Stop if not active

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Normalize to 0-1 range
        setVolume(average / 255);

        requestRef.current = requestAnimationFrame(analyze);
    };

    const toggle = useCallback(async () => {
        if (isListening) {
            stopListening();
        } else {
            await startListening();
        }
    }, [isListening, startListening, stopListening]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopListening();
        };
    }, [stopListening]);

    return { volume, isListening, error, start: startListening, stop: stopListening, toggle };
};
