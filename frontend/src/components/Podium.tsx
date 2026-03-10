import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar, Button } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { keyframes } from '@emotion/react';
import Character from './Character';

interface PodiumProps {
    players: any[];
    onClose?: () => void;
    isAdmin?: boolean;
}

const popIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  80% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const getAvatarConfig = (user: any) => {
    try {
        return user.avatar_config ? JSON.parse(user.avatar_config) : { seed: user.username };
    } catch {
        return { seed: user.username };
    }
};

const Podium: React.FC<PodiumProps> = ({ players, onClose, isAdmin }) => {
    // Sort descending by score
    const sortedPlayers = [...players].sort((a, b) => b.session_score - a.session_score);
    const top3 = sortedPlayers.slice(0, 3);
    const others = sortedPlayers.slice(3);

    return (
        <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            sx={{ mt: 4, width: '100%', maxWidth: 700, mx: 'auto', px: 2 }}
        >
            <Typography 
                variant="h3" 
                gutterBottom 
                color="primary" 
                fontWeight={900} 
                sx={{ 
                    textShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                    fontSize: { xs: '2rem', sm: '3rem' },
                    textAlign: 'center'
                }}
            >
                🏆 Final Results 🏆
            </Typography>

            {/* Podium Blocks */}
            <Box display="flex" alignItems="flex-end" justifyContent="center" gap={{ xs: 1, sm: 3 }} my={{ xs: 3, sm: 6 }} sx={{ height: { xs: 280, sm: 360 }, width: '100%' }}>
                
                {/* 2nd Place */}
                <Box 
                    display="flex" 
                    flexDirection="column" 
                    alignItems="center" 
                    sx={{ width: '30%', animation: `${popIn} 0.6s ease-out 0.2s backwards` }}
                >
                    {top3[1] ? (
                        <>
                            <Box sx={{ mb: -2, zIndex: 1 }}>
                                <Character config={getAvatarConfig(top3[1].user)} size={80} cheering />
                            </Box>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: '100%', fontSize: { xs: '0.8rem', sm: '1rem' }, mb: 0.5, zIndex: 2, bgcolor: 'rgba(255,255,255,0.8)', px: 1, borderRadius: 1 }}>{top3[1].user.username}</Typography>
                            <Paper 
                                elevation={0}
                                sx={{ 
                                    width: '100%', 
                                    height: { xs: 100, sm: 140 }, 
                                    bgcolor: '#E8E8E8', // Silverish
                                    borderTopLeftRadius: { xs: 10, sm: 16 },
                                    borderTopRightRadius: { xs: 10, sm: 16 },
                                    position: 'relative',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'column',
                                    pb: 2
                                }} 
                            >
                                <Typography variant="h4" fontWeight={900} color="text.secondary">2</Typography>
                                <Typography variant="caption" fontWeight="bold">{top3[1].session_score} pts</Typography>
                            </Paper>
                        </>
                    ) : (
                        <Box sx={{ height: 140, width: '100%' }} /> 
                    )}
                </Box>

                {/* 1st Place */}
                <Box 
                    display="flex" 
                    flexDirection="column" 
                    alignItems="center" 
                    sx={{ width: '34%', zIndex: 2, animation: `${popIn} 0.6s ease-out` }}
                >
                     {top3[0] ? (
                        <>
                            <EmojiEventsRoundedIcon sx={{ fontSize: { xs: 30, sm: 40 }, color: '#FFD700', filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.1))', animation: `${float} 3s ease-in-out infinite`, mb: -1 }} />
                            <Box sx={{ mb: -3, zIndex: 2 }}>
                                <Character config={getAvatarConfig(top3[0].user)} size={120} cheering />
                            </Box>
                            <Typography variant="subtitle1" fontWeight={900} noWrap sx={{ maxWidth: '100%', fontSize: { xs: '0.9rem', sm: '1.2rem' }, mb: 0.5, zIndex: 3, bgcolor: 'rgba(255,255,255,0.9)', px: 1.5, borderRadius: 1 }}>{top3[0].user.username}</Typography>
                            
                            <Paper 
                                elevation={4}
                                sx={{ 
                                    width: '100%', 
                                    height: { xs: 140, sm: 180 }, 
                                    background: 'linear-gradient(180deg, #FFD700 0%, #FFC400 100%)', // Gold gradient
                                    borderTopLeftRadius: { xs: 10, sm: 16 },
                                    borderTopRightRadius: { xs: 10, sm: 16 },
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'column',
                                    pb: 2,
                                    boxShadow: '0 10px 20px rgba(255, 215, 0, 0.3)'
                                }} 
                            >
                                <Typography variant="h3" fontWeight={900} color="white">1</Typography>
                                <Typography variant="body1" fontWeight="bold" color="white">{top3[0].session_score} pts</Typography>
                            </Paper>
                        </>
                    ) : (
                        <Box sx={{ height: 180, width: '100%' }} />
                    )}
                </Box>

                {/* 3rd Place */}
                <Box 
                    display="flex" 
                    flexDirection="column" 
                    alignItems="center" 
                    sx={{ width: '30%', animation: `${popIn} 0.6s ease-out 0.4s backwards` }}
                >
                    {top3[2] ? (
                        <>
                             <Box sx={{ mb: -2, zIndex: 1 }}>
                                <Character config={getAvatarConfig(top3[2].user)} size={80} cheering />
                            </Box>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: '100%', fontSize: { xs: '0.8rem', sm: '1rem' }, mb: 0.5, zIndex: 2, bgcolor: 'rgba(255,255,255,0.8)', px: 1, borderRadius: 1 }}>{top3[2].user.username}</Typography>
                            <Paper 
                                elevation={0}
                                sx={{ 
                                    width: '100%', 
                                    height: { xs: 70, sm: 100 }, 
                                    bgcolor: '#F0D0B0', // Bronze-ish
                                    borderTopLeftRadius: { xs: 10, sm: 16 },
                                    borderTopRightRadius: { xs: 10, sm: 16 },
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'column',
                                    pb: 2
                                }} 
                            >
                                <Typography variant="h4" fontWeight={900} color="text.secondary">3</Typography>
                                <Typography variant="caption" fontWeight="bold">{top3[2].session_score} pts</Typography>
                            </Paper>
                        </>
                    ) : (
                        <Box sx={{ height: 100, width: '100%' }} />
                    )}
                </Box>
            </Box>

            {/* List of others */}
            {others.length > 0 && (
                <Paper sx={{ width: '100%', mb: 4, borderRadius: 4, overflow: 'hidden' }} elevation={0}>
                    <List disablePadding>
                        <ListItem sx={{ bgcolor: 'secondary.main', color: 'white', py: 1 }}>
                            <ListItemText primary="Honorable Mentions" primaryTypographyProps={{ fontWeight: 'bold', align: 'center', variant: 'subtitle1' }} />
                        </ListItem>
                        {others.map((p, index) => (
                            <ListItem key={p.user.id} divider sx={{ px: 2 }}>
                                <ListItemAvatar>
                                    <Box sx={{ width: 40, height: 40, overflow: 'hidden', borderRadius: '50%', border: '1px solid #eee', position: 'relative' }}>
                                        <Character config={getAvatarConfig(p.user)} size={40} />
                                        <Box sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 10, px: 0.5, borderRadius: 1 }}>{index + 4}</Box>
                                    </Box>
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={p.user.username} 
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                                />
                                <Typography fontWeight="bold" color="primary" variant="body2">{p.session_score} pts</Typography>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            {isAdmin && onClose && (
                <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    onClick={onClose}
                    sx={{ px: 6, fontSize: { xs: '1rem', sm: '1.2rem' }, width: { xs: '100%', sm: 'auto' } }}
                >
                    New Game 🔄
                </Button>
            )}
        </Box>
    );
};

export default Podium;
