import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SOUNDS = {
    CLICK: 'https://www.ale-kea.dk/public/projectpool_examples/sounds/bib.m4a',
    CORRECT: 'https://www.ale-kea.dk/public/projectpool_examples/sounds/ding.mp3',
    WRONG: 'https://www.ale-kea.dk/public/projectpool_examples/sounds/buzz.mp3',
    VICTORY: 'https://www.ale-kea.dk/public/projectpool_examples/sounds/bell.m4a',
    START: 'https://www.ale-kea.dk/public/projectpool_examples/sounds/ding.mp3',
    JOIN: 'https://www.ale-kea.dk/public/projectpool_examples/sounds/bib.m4a'
};

interface SoundContextType {
    isMuted: boolean;
    toggleMute: () => void;
    playSFX: (soundKey: keyof typeof SOUNDS) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
    const [isMuted, setIsMuted] = useState(() => {
        const saved = localStorage.getItem('sound_muted');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sound_muted', isMuted.toString());
    }, [isMuted]);

    const playSFX = useCallback((soundKey: keyof typeof SOUNDS) => {
        if (isMuted) return;

        const audio = new Audio(SOUNDS[soundKey]);
        audio.volume = 0.4;
        audio.play().catch(err => console.log("Sound play error:", err));
    }, [isMuted]);

    const toggleMute = () => setIsMuted(prev => !prev);

    return (
        <SoundContext.Provider value={{ isMuted, toggleMute, playSFX }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};
