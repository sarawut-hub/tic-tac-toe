import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@emotion/react';

export interface AvatarConfig {
    seed: string;
    style: string; // 'adventurer' | 'lorelei' | 'notionists' | 'avataaars' | 'bottts'
    backgroundColor?: string;
    options?: Record<string, string>; // { hair: 'long01', eyes: 'variant04' } etc.
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
    // Default to 'adventurer' if style is missing or old config is passed
    const style = config.style || 'adventurer';
    const seed = config.seed || 'Felix';
    
    // Build query params including custom options
    const params = new URLSearchParams();
    params.append('seed', seed);
    if (config.backgroundColor) {
        params.append('backgroundColor', config.backgroundColor.replace('#', ''));
    }
    
    // Append any extra options if present
    if (config.options) {
        Object.entries(config.options).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
    }

    // Construct DiceBear URL
    // Using version 9.x which is stable
    const avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?${params.toString()}`;

    return (
        <Box
            sx={{
                width: size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: cheering ? `${cheer} 1s infinite ease-in-out` : `${bounce} 3s infinite ease-in-out`,
                filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))',
                transition: 'all 0.3s ease'
            }}
        >
            <img 
                src={avatarUrl} 
                alt="Avatar" 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    borderRadius: style === 'bottts' ? '10%' : '0' // Bottts look nice with rounded corners
                }} 
            />
        </Box>
    );
};

export default Character;
