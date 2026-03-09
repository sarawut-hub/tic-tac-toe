import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, List, ListItem, ListItemText, Button, Avatar } from '@mui/material';
import Game from './Game';
import Podium from './Podium';
import CharacterCustomizer from './CharacterCustomizer';
import Character, { AvatarConfig } from './Character';
import { getSession, getSessionPlayers, updateAvatar } from '../api';

interface JoinSessionProps {
    sessionCode: string;
    user: any;
    onUpdateUser: (u: any) => void;
}

const JoinSession: React.FC<JoinSessionProps> = ({ sessionCode, user, onUpdateUser }) => {
    const [session, setSession] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Track session score locally to pass to Game without waiting for poll
    const [localSessionScore, setLocalSessionScore] = useState<number>(0); 
    
    // Avatar State
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
    const [isCustomizing, setIsCustomizing] = useState(false);

    useEffect(() => {
        // Load avatar from storage
        const saved = localStorage.getItem(`avatar_${user.id}`);
        if (saved) {
            setAvatarConfig(JSON.parse(saved));
        } else {
            setIsCustomizing(true); // Default to customizing if new
        }
    }, [user.id]);

    useEffect(() => {
        // Reset local session score on session code change
        setLocalSessionScore(0);
        let interval: any;
        const poll = async () => {
            try {
                const s = await getSession(sessionCode);
                setSession(s);
                const p = await getSessionPlayers(sessionCode);
                setPlayers(p);
                
                // Sync local session score from server poll if available
                const myPlayer = p.find((pl: any) => pl.user.id === user.id);
                if (myPlayer) {
                    setLocalSessionScore(myPlayer.session_score);
                    // If we have an avatar config but server doesn't, sync it aggressively?
                    // Or relies on user saving it.
                }

                setLoading(false);
                
                if (s.status === 'ENDED') {
                    // Stop polling if needed
                }
            } catch (e) {
                console.error("Session load failed", e);
                setLoading(false);
            }
        };
        poll();
        interval = setInterval(poll, 3000);
        return () => clearInterval(interval);
    }, [sessionCode, user.id]);
    
    const handleSaveAvatar = async (config: AvatarConfig) => {
        setAvatarConfig(config);
        setIsCustomizing(false);
        localStorage.setItem(`avatar_${user.id}`, JSON.stringify(config));
        try {
            await updateAvatar(sessionCode, user.id, JSON.stringify(config));
        } catch (e) {
            console.error("Failed to sync avatar", e);
        }
    };

    if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

    if (!session) return <Typography color="error" textAlign="center" mt={4}>Session not found or invalid code.</Typography>;

    if (session.status === 'WAITING') {
        if (isCustomizing) {
            return (
                <Box mt={4} maxWidth={500} mx="auto">
                    <CharacterCustomizer onSave={handleSaveAvatar} initialConfig={avatarConfig || undefined} />
                </Box>
            );
        }

        return (
            <Box textAlign="center" mt={4} display="flex" flexDirection="column" alignItems="center">
                <Typography variant="h4" gutterBottom fontWeight={900} color="primary">Waiting for Host...</Typography>
                
                <Paper 
                    elevation={0} 
                    sx={{ p: 1, px: 3, mb: 4, borderRadius: 4, bgcolor: '#E0F7FA', color: '#006064', fontWeight: 'bold' }}
                >
                    Session: {sessionCode}
                </Paper>

                {avatarConfig && (
                    <Box mb={4} position="relative">
                        <Character config={avatarConfig} size={150} />
                        <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => setIsCustomizing(true)}
                            sx={{ mt: 2, borderRadius: 4, px: 3, bgcolor: 'white' }}
                        >
                            Customize Avatar ✏️
                        </Button>
                    </Box>
                )}

                <Paper sx={{ width: '100%', maxWidth: 400, mt: 1, maxHeight: 300, overflow: 'auto', borderRadius: 4 }} elevation={0}>
                    <Typography variant="subtitle1" sx={{ p: 2, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Players Joined ({players.length})</Typography>
                    <List>
                        {players.map(p => (
                             <ListItem key={p.user.id} divider>
                                <ListItemText 
                                    primary={p.user.username} 
                                    secondary={p.user.id === user.id ? "(You)" : ""}
                                    primaryTypographyProps={{ fontWeight: 600 }}
                                />
                                {p.avatar_config && Object.keys(p.avatar_config).length > 0 && (
                                     <Box sx={{ transform: 'scale(0.4)', transformOrigin: 'right center', mr: -2 }}>
                                         <Character config={p.avatar_config} size={60} />
                                     </Box>
                                )}
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Box>
        );
    }

    if (session.status === 'ACTIVE') {
        return (
            <Box>
                 <Box display="flex" justifyContent="center" mb={2}>
                     <Paper elevation={0} sx={{ px: 3, py: 0.5, borderRadius: 4, bgcolor: '#FFEBEE', color: '#D32F2F' }}>
                        <Typography variant="subtitle2" fontWeight="bold">Time Remaining: {session.time_limit_minutes}m</Typography>
                     </Paper>
                 </Box>
                <Game 
                    user={user} 
                    onUpdateUser={onUpdateUser} 
                    sessionCode={sessionCode} 
                    sessionScore={localSessionScore}
                    onSessionScoreUpdate={(newScore) => setLocalSessionScore(newScore)}
                    avatarConfig={avatarConfig}
                />
            </Box>
        );
    }

    if (session.status === 'ENDED') {
        return <Podium players={players} />;
    }

    // Fallback for unknown status
    return null;
};

export default JoinSession;
