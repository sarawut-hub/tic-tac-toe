import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, List, ListItem, ListItemText, Button } from '@mui/material';
import Game from './Game';
import Podium from './Podium';
import CharacterCustomizer from './CharacterCustomizer';
import Character, { AvatarConfig } from './Character';
import { getSession, getSessionPlayers, updateAvatar, joinSession, getWebSocket } from '../api';

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
        
        // Join session immediately
        joinSession(sessionCode).catch(e => {
            console.error("Failed to join session initially", e);
            if (e.response && e.response.status === 400) {
                 alert("Cannot join session: " + e.response.data.detail);
                 // Maybe redirect back?
            }
        });

    }, [user.id, sessionCode]);

    const fetchSessionData = async () => {
        try {
            const s = await getSession(sessionCode);
            setSession(s);
            const p = await getSessionPlayers(sessionCode);
            setPlayers(p);
            
            const myPlayer = p.find((pl: any) => pl.user.id === user.id);
            if (myPlayer) {
                setLocalSessionScore(myPlayer.session_score);
            }
            setLoading(false);
        } catch (e) {
            console.error("Session load failed", e);
            setLoading(false);
        }
    };

    useEffect(() => {
        setLocalSessionScore(0);
        fetchSessionData();

        const ws = getWebSocket(sessionCode);
        ws.onmessage = (event: any) => {
            const message = JSON.parse(event.data);
            console.log("WS Message:", message);
            
            if (message.type === 'PLAYER_JOINED') {
                fetchPlayers();
            } else if (message.type === 'SESSION_STARTED') {
                setSession((prev: any) => ({ 
                    ...prev, 
                    status: 'ACTIVE', 
                    start_time: message.data.start_time, 
                    end_time: message.data.end_time 
                }));
            } else if (message.type === 'SESSION_ENDED') {
                setSession((prev: any) => ({ ...prev, status: 'ENDED' }));
            } else if (message.type === 'SCORE_UPDATE') {
                setPlayers((prev: any[]) => prev.map(p => 
                    p.user.id === message.data.user_id 
                    ? { ...p, session_score: message.data.score } 
                    : p
                ));
                if (message.data.user_id === user.id) {
                    setLocalSessionScore(message.data.score);
                }
            }
        };

        const fetchPlayers = async () => {
             const p = await getSessionPlayers(sessionCode);
             setPlayers(p);
        };

        // Auto-end timer check
        const timer = setInterval(() => {
            if (session?.status === 'ACTIVE' && session?.end_time) {
                const now = new Date().getTime();
                const endTimeStr = session.end_time.endsWith('Z') ? session.end_time : session.end_time + 'Z';
                const end = new Date(endTimeStr).getTime();
                if (now >= end) {
                    setSession((prev: any) => ({ ...prev, status: 'ENDED' }));
                    clearInterval(timer);
                }
            }
        }, 3000); // Check every 3s

        return () => {
            ws.close();
            clearInterval(timer);
        };
    }, [sessionCode, user.id, session?.status, session?.end_time]);
    
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
                <Typography variant="h3" gutterBottom fontWeight={900} color="primary" sx={{ textShadow: '0 4px 12px rgba(33, 150, 243, 0.2)' }}>
                    Ready to Play? 🎮
                </Typography>
                
                <Paper 
                    elevation={0} 
                    className="glass-card"
                    sx={{ p: 1, px: 4, mb: 4, borderRadius: 5, color: '#006064', fontWeight: 800, fontSize: '1.2rem' }}
                >
                    Room Code: {sessionCode}
                </Paper>

                {avatarConfig && (
                    <Box mb={4} position="relative" sx={{ transition: 'transform 0.3s ease', '&:hover': { transform: 'scale(1.05)' } }}>
                        <Character config={avatarConfig} size={160} />
                        <Box mt={2}>
                            <Button 
                                variant="contained" 
                                color="inherit"
                                onClick={() => setIsCustomizing(true)}
                                sx={{ 
                                    borderRadius: 4, 
                                    px: 4, 
                                    bgcolor: 'rgba(255,255,255,0.8)', 
                                    backdropFilter: 'blur(5px)',
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                Edit Character ✏️
                            </Button>
                        </Box>
                    </Box>
                )}

                <Paper className="glass-card" sx={{ width: '100%', maxWidth: 450, mt: 1, maxHeight: 400, overflow: 'hidden', borderRadius: 5 }} elevation={0}>
                    <Typography variant="subtitle1" sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.03)', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Lobby ({players.length} Players) 👥
                    </Typography>
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {players.map(p => (
                             <ListItem key={p.user.id} divider sx={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <ListItemText 
                                    primary={p.user.username} 
                                    secondary={p.user.id === user.id ? "✨ You" : ""}
                                    primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
                                    secondaryTypographyProps={{ color: 'primary', fontWeight: 'bold' }}
                                />
                                {p.avatar_config && Object.keys(p.avatar_config).length > 0 && (
                                     <Box sx={{ transform: 'scale(0.5)', transformOrigin: 'right center', mr: -1 }}>
                                         <Character config={p.avatar_config} size={60} />
                                     </Box>
                                 )}
                            </ListItem>
                        ))}
                    </List>
                </Paper>
                <Typography variant="caption" sx={{ mt: 3, opacity: 0.7, fontWeight: 500 }}>
                    The game will start as soon as the host is ready! 🚀
                </Typography>
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
                    endTime={session.end_time}
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
