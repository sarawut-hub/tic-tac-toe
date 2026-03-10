import React, { useState } from 'react';
import { Box, Button, Typography, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Character, { AvatarConfig } from './Character';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FaceIcon from '@mui/icons-material/Face';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface CharacterCustomizerProps {
    onSave: (config: AvatarConfig) => void;
    initialConfig?: AvatarConfig;
}

const STYLES = [
    { value: 'adventurer', label: 'Adventurer', icon: <AccountCircleIcon /> },
    { value: 'lorelei', label: 'Lorelei', icon: <FaceIcon /> },
    { value: 'notionists', label: 'Notion', icon: <EmojiEmotionsIcon /> },
    { value: 'bottts', label: 'Bot', icon: <SmartToyIcon /> },
];

const BG_COLORS = ['transparent', '#FFD1DC', '#ADD8E6', '#90EE90', '#FCFAAC', '#DDA0DD'];

// Options specifically for 'adventurer' style
const ADVENTURER_PART_OPTIONS = {
    hair: [
        'short01', 'short02', 'short03', 'short04', 'short05', 'short06', 'short07', 'short08',
        'long01', 'long02', 'long03', 'long04', 'long05', 'long06', 'long07', 'long08',
        'curly01', 'curly02', 'curly03'
    ],
    eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09'],
    mouth: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07']
};

interface PartSelectorProps {
    label: string;
    value?: string;
    options: string[];
    onChange: (newValue: string) => void;
}

const PartSelector: React.FC<PartSelectorProps> = ({ label, value, options, onChange }) => {
    const idx = value ? options.indexOf(value) : 0;
    
    // Safety check - if value isn't in options, default to 0
    const safeIdx = idx === -1 ? 0 : idx;

    const handleNext = () => {
        const nextIdx = (safeIdx + 1) % options.length;
        onChange(options[nextIdx]);
    };

    const handlePrev = () => {
        const prevIdx = (safeIdx - 1 + options.length) % options.length;
        onChange(options[prevIdx]);
    };

    return (
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 1, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight="bold">{label}</Typography>
            <Box display="flex" alignItems="center">
                <Button size="small" onClick={handlePrev} sx={{ minWidth: 30, p: 0 }}><ArrowBackIosNewIcon sx={{ fontSize: 16 }} /></Button>
                <Typography variant="caption" sx={{ width: 60, textAlign: 'center', fontFamily: 'monospace' }}>
                    {value || 'Auto'}
                </Typography>
                <Button size="small" onClick={handleNext} sx={{ minWidth: 30, p: 0 }}><ArrowForwardIosIcon sx={{ fontSize: 16 }} /></Button>
            </Box>
        </Box>
    );
};

const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({ onSave, initialConfig }) => {
    // Migrate old config if necessary
    const getInitialConfig = (): AvatarConfig => {
        if (!initialConfig) {
             return { seed: 'Felix', style: 'adventurer', backgroundColor: 'transparent' };
        }
        if ('face' in initialConfig || !initialConfig.style) {
             return { seed: 'Migration' + Math.random(), style: 'adventurer', backgroundColor: 'transparent' };
        }
        return initialConfig;
    };

    const [config, setConfig] = useState<AvatarConfig>(getInitialConfig());

    const handleRandomize = () => {
        setConfig({ 
            ...config, 
            seed: Math.random().toString(36).substring(7),
            options: undefined // Reset Manual overrides on total random
        });
    };

    const handleStyleChange = (_event: React.MouseEvent<HTMLElement>, newStyle: string) => {
        if (newStyle) {
            setConfig({ ...config, style: newStyle, options: undefined });
        }
    };

    const handleBgChange = (color: string) => {
         setConfig({ ...config, backgroundColor: color === 'transparent' ? undefined : color });
    };

    const handleOptionChange = (key: string, value: string) => {
        setConfig({
            ...config,
            options: {
                ...config.options,
                [key]: value
            }
        });
    };

    const handleSave = () => {
        onSave(config);
    };

    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: '#FFFFFF', textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">Customize Your Look!</Typography>
            
            <Box display="flex" justifyContent="center" mb={2} height={200} alignItems="center" sx={{ overflow: 'hidden' }}>
                <Character config={config} size={180} />
            </Box>

            <Box mb={3}>
                 <Button 
                    variant="contained" 
                    color="secondary" 
                    startIcon={<ShuffleIcon />} 
                    onClick={handleRandomize}
                    fullWidth
                    sx={{ borderRadius: 3, mb: 2, textTransform: 'none', fontWeight: 'bold' }}
                >
                    Randomize All
                </Button>

                <Typography variant="caption" color="text.secondary" gutterBottom display="block">Avatar Style</Typography>
                <ToggleButtonGroup
                    value={config.style}
                    exclusive
                    onChange={handleStyleChange}
                    aria-label="avatar style"
                    size="small"
                    sx={{ mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}
                >
                    {STYLES.map((style) => (
                        <ToggleButton key={style.value} value={style.value} aria-label={style.label}>
                            {style.icon}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>

                {config.style === 'adventurer' && (
                    <Box sx={{ mt: 2, mb: 2, textAlign: 'left' }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom display="block" align="center">Manual Details</Typography>
                        <PartSelector 
                            label="Hair" 
                            value={config.options?.hair} 
                            options={ADVENTURER_PART_OPTIONS.hair} 
                            onChange={(v) => handleOptionChange('hair', v)} 
                        />
                        <PartSelector 
                            label="Eyes" 
                            value={config.options?.eyes} 
                            options={ADVENTURER_PART_OPTIONS.eyes} 
                            onChange={(v) => handleOptionChange('eyes', v)} 
                        />
                         <PartSelector 
                            label="Mouth" 
                            value={config.options?.mouth} 
                            options={ADVENTURER_PART_OPTIONS.mouth} 
                            onChange={(v) => handleOptionChange('mouth', v)} 
                        />
                    </Box>
                )}

                <Typography variant="caption" color="text.secondary" gutterBottom display="block">Background</Typography>
                <Box display="flex" justifyContent="center" gap={1} mb={2} flexWrap="wrap">
                    {BG_COLORS.map((c) => (
                        <Box
                            key={c}
                            onClick={() => handleBgChange(c)}
                            sx={{
                                width: 28,
                                height: 28,
                                bgcolor: c === 'transparent' ? '#eee' : c,
                                borderRadius: '50%',
                                cursor: 'pointer',
                                border: (config.backgroundColor === c || (c === 'transparent' && !config.backgroundColor)) ? '3px solid #333' : '1px solid #ddd',
                                position: 'relative'
                            }}
                        >
                            {c === 'transparent' && (
                                <Box sx={{ 
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(45deg)',
                                    width: '2px', height: '100%', bgcolor: 'red'
                                }}/>
                            )}
                        </Box>
                    ))}
                </Box>
            </Box>

            <Button variant="contained" color="primary" fullWidth onClick={handleSave} sx={{ borderRadius: 3, py: 1.5, fontWeight: 'bold' }}>
                Save & Ready! ✨
            </Button>
        </Paper>
    );
};

export default CharacterCustomizer;