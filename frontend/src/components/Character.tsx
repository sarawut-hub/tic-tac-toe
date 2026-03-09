import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@emotion/react';

export interface AvatarConfig {
    color: string;
    face: string;
    accessory: string;
}

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const cheer = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-5deg); }
  75% { transform: scale(1.1) rotate(5deg); }
`;

interface CharacterProps {
    config: AvatarConfig;
    size?: number;
    cheering?: boolean;
}

const Character: React.FC<CharacterProps> = ({ config, size = 100, cheering = false }) => {
    const { color, face, accessory } = config;

    return (
        <Box
            sx={{
                width: size,
                height: size * 1.2,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: cheering ? `${cheer} 1s infinite ease-in-out` : `${bounce} 3s infinite ease-in-out`,
                filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.1))'
            }}
        >
            {/* Body */}
            <Box
                sx={{
                    width: '80%',
                    height: '80%',
                    bgcolor: color,
                    borderRadius: '40% 40% 45% 45%', // Egg shape
                    position: 'absolute',
                    bottom: 0,
                    zIndex: 1,
                    border: '3px solid rgba(0,0,0,0.1)'
                }}
            />

            {/* Face */}
            <Box
                sx={{
                    position: 'absolute',
                    zIndex: 2,
                    top: '40%',
                    fontSize: size * 0.35,
                    lineHeight: 1,
                    userSelect: 'none'
                }}
            >
                {face}
            </Box>

            {/* Accessory */}
            {accessory !== 'none' && (
                <Box
                    sx={{
                        position: 'absolute',
                        zIndex: 3,
                        top: '10%',
                        fontSize: size * 0.4,
                        lineHeight: 1,
                        userSelect: 'none'
                    }}
                >
                    {accessory === 'crown' && '👑'}
                    {accessory === 'bow' && '🎀'}
                    {accessory === 'glasses' && '👓'}
                    {accessory === 'hat' && '🧢'}
                    {accessory === 'flower' && '🌸'}
                </Box>
            )}

            {/* Hands (Simple circles) */}
            <Box
                sx={{
                    position: 'absolute',
                    width: size * 0.2,
                    height: size * 0.2,
                    bgcolor: color,
                    borderRadius: '50%',
                    left: '-5%',
                    top: '55%',
                    zIndex: 0,
                    animation: cheering ? `${bounce} 0.5s infinite alternate` : 'none'
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: size * 0.2,
                    height: size * 0.2,
                    bgcolor: color,
                    borderRadius: '50%',
                    right: '-5%',
                    top: '55%',
                    zIndex: 0,
                    animation: cheering ? `${bounce} 0.5s infinite alternate-reverse` : 'none'
                }}
            />
        </Box>
    );
};

export default Character;
