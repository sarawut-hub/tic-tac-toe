import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Character, { AvatarConfig } from './Character';

interface CharacterCustomizerProps {
    onSave: (config: AvatarConfig) => void;
    initialConfig?: AvatarConfig;
}

const COLORS = ['#FFD1DC', '#ADD8E6', '#90EE90', '#FCFAAC', '#DDA0DD', '#F4A460']; // Pastel Pink, Blue, Green, Yellow, Purple, Tan
const FACES = ['😊', '😎', '😜', '🤩', '🤓', '🥳', '😡']; // Emojis as faces
const ACCESSORIES = ['none', 'crown', 'bow', 'glasses', 'hat', 'flower'];

const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({ onSave, initialConfig }) => {
    const [config, setConfig] = useState<AvatarConfig>(initialConfig || {
        color: COLORS[0],
        face: FACES[0],
        accessory: 'none'
    });

    const handleSave = () => {
        onSave(config);
    };

    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: '#FFFFFF', textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">Create Your Avatar!</Typography>
            
            <Box display="flex" justifyContent="center" mb={4} height={150}>
                <Character config={config} size={120} />
            </Box>

            <Typography variant="caption" display="block" color="text.secondary" mb={1}>Choose Color</Typography>
            <Box display="flex" justifyContent="center" gap={1} mb={2} flexWrap="wrap">
                {COLORS.map((c) => (
                    <Box
                        key={c}
                        onClick={() => setConfig({ ...config, color: c })}
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: c,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            border: config.color === c ? '3px solid #333' : '3px solid transparent',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    />
                ))}
            </Box>

            <Typography variant="caption" display="block" color="text.secondary" mb={1}>Choose Mood</Typography>
            <ToggleButtonGroup
                value={config.face}
                exclusive
                onChange={(_, newFace) => newFace && setConfig({ ...config, face: newFace })}
                sx={{ mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}
            >
                {FACES.map((f) => (
                    <ToggleButton key={f} value={f} sx={{ border: 'none', fontSize: '1.5rem', borderRadius: '50% !important' }}>
                        {f}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>

            <Typography variant="caption" display="block" color="text.secondary" mb={1}>Accessory</Typography>
             <ToggleButtonGroup
                value={config.accessory}
                exclusive
                onChange={(_, newAcc) => newAcc && setConfig({ ...config, accessory: newAcc })}
                sx={{ mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}
            >
                {ACCESSORIES.map((a) => (
                    <ToggleButton key={a} value={a} sx={{ border: 'none', px: 2, borderRadius: 3 }}>
                        {a === 'none' ? 'None' : 
                         a === 'crown' ? '👑' : 
                         a === 'bow' ? '🎀' : 
                         a === 'glasses' ? '👓' : 
                         a === 'hat' ? '🧢' : '🌸'}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>

            <Button variant="contained" color="secondary" fullWidth onClick={handleSave} sx={{ borderRadius: 3, py: 1.5 }}>
                Save & Ready! ✨
            </Button>
        </Paper>
    );
};

export default CharacterCustomizer;