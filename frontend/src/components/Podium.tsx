import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar, Button } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { keyframes } from '@emotion/react';

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
            <Box display="flex" alignItems="flex-end" justifyContent="center" gap={{ xs: 1, sm: 3 }} my={{ xs: 3, sm: 6 }} sx={{ height: { xs: 240, sm: 300 }, width: '100%' }}>
                
                {/* 2nd Place */}
                <Box 
                    display="flex" 
                    flexDirection="column" 
                    alignItems="center" 
                    sx={{ width: '30%', animation: `${popIn} 0.6s ease-out 0.2s backwards` }}
                >
                    {top3[1] ? (
                        <>
                            <Avatar sx={{ bgcolor: '#C0C0C0', width: { xs: 48, sm: 64 }, height: { xs: 48, sm: 64 }, mb: 1, border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                <Typography variant="h6" fontWeight="bold" color="white" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>2</Typography>
                            </Avatar>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: '100%', fontSize: { xs: '0.8rem', sm: '1rem' } }}>{top3[1].user.username}</Typography>
                            <Typography variant="caption" color="text.secondary" mb={1}>{top3[1].session_score} pts</Typography>
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
                                    alignItems: 'flex-end',
                                    pb: 2
                                }} 
                            >
                                <Typography variant="h2" fontWeight={900} color="rgba(0,0,0,0.05)" sx={{ fontSize: { xs: '3rem', sm: '3.75rem' } }}>2</Typography>
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
                            <EmojiEventsRoundedIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: '#FFD700', filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.1))', animation: `${float} 3s ease-in-out infinite` }} />
                            <Avatar sx={{ bgcolor: '#FFD700', width: { xs: 60, sm: 80 }, height: { xs: 60, sm: 80 }, mb: 1.5, border: '4px solid white', boxShadow: '0 8px 16px rgba(255, 215, 0, 0.4)' }}>
                                <Typography variant="h4" fontWeight="bold" color="white" sx={{ fontSize: { xs: '1.2rem', sm: '2rem' } }}>1</Typography>
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight={900} noWrap sx={{ maxWidth: '100%', fontSize: { xs: '0.9rem', sm: '1.2rem' } }}>{top3[0].user.username}</Typography>
                            <Typography variant="body2" color="primary" fontWeight="bold" mb={1}>{top3[0].session_score} pts</Typography>
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
                                    alignItems: 'flex-end',
                                    pb: 2,
                                    boxShadow: '0 10px 20px rgba(255, 215, 0, 0.3)'
                                }} 
                            >
                                <StarRoundedIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: 'rgba(255,255,255,0.3)' }} />
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
                            <Avatar sx={{ bgcolor: '#CD7F32', width: { xs: 48, sm: 64 }, height: { xs: 48, sm: 64 }, mb: 1, border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                <Typography variant="h6" fontWeight="bold" color="white" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>3</Typography>
                            </Avatar>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: '100%', fontSize: { xs: '0.8rem', sm: '1rem' } }}>{top3[2].user.username}</Typography>
                            <Typography variant="caption" color="text.secondary" mb={1}>{top3[2].session_score} pts</Typography>
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
                                    alignItems: 'flex-end',
                                    pb: 2
                                }} 
                            >
                                <Typography variant="h3" fontWeight={900} color="rgba(0,0,0,0.05)" sx={{ fontSize: { xs: '2.5rem', sm: '3rem' } }}>3</Typography>
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
                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.9rem', bgcolor: 'transparent', color: 'text.secondary', border: '2px solid #eee' }}>
                                        {index + 4}
                                    </Avatar>
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
