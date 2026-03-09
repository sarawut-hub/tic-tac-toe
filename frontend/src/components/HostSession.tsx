import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Button, 
    Typography, 
    TextField, 
    List, 
    ListItem, 
    ListItemText, 
    Divider,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    CircularProgress
} from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import { createSession, getSession, getSessionPlayers, startSession, endSession, fetchQuestions } from '../api';
import Podium from './Podium';

const HostSession: React.FC = () => {
    const [timeLimit, setTimeLimit] = useState(5);
    const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
    const [allQuestions, setAllQuestions] = useState<any[]>([]);
    const [session, setSession] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [showPodium, setShowPodium] = useState(false);

    useEffect(() => {
        fetchQuestions().then(setAllQuestions);
        const savedCode = localStorage.getItem('host_session_code');
        if (savedCode) {
            getSession(savedCode).then(data => {
                if (data.status !== 'ENDED') {
                    setSession(data);
                } else {
                    localStorage.removeItem('host_session_code');
                }
            }).catch(() => {
                localStorage.removeItem('host_session_code');
            });
        }
    }, []);

    useEffect(() => {
        let interval: any;
        if (session && session.status !== 'ENDED') {
            const poll = () => {
                getSession(session.code).then(data => {
                    setSession((prev: any) => ({ ...prev, ...data })); // Merge to keep older properties if needed
                    if (data.status === 'ENDED') {
                         clearInterval(interval);
                         setShowPodium(true);
                    }
                });
                getSessionPlayers(session.code).then(setPlayers);
            };
            poll(); // Initial call
            interval = setInterval(poll, 3000);
        }
        return () => clearInterval(interval);
    }, [session?.code]); // Only restart if code changes, but internal logic checks status

    // Timer logic
    useEffect(() => {
        let timer: any;
        if (session?.status === 'ACTIVE' && session.end_time) {
            timer = setInterval(() => {
                const now = new Date().getTime();
                // Ensure backend time is treated as UTC
                const endTimeStr = session.end_time.endsWith('Z') ? session.end_time : session.end_time + 'Z';
                const endTime = new Date(endTimeStr).getTime();
                const diff = endTime - now;
                
                if (diff <= 0) {
                    setTimeLeft('00:00');
                    // Check if we should auto-transition to podium (backend should update status eventually or we can force fetch)
                     if (session.status !== 'ENDED') {
                         // Optional: could manually trigger a check
                     }
                } else {
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                }
            }, 1000);
        } else {
            setTimeLeft('');
        }
        return () => clearInterval(timer);
    }, [session?.status, session?.end_time]);

    const handleCreate = async () => {
        try {
            const newSession = await createSession({
                time_limit_minutes: timeLimit,
                question_ids: selectedQuestions
            });
            setSession(newSession);
            localStorage.setItem('host_session_code', newSession.code);
        } catch (e) {
            alert("Failed to create session");
        }
    };

    const handleStart = async () => {
        try {
            const updatedSession = await startSession(session.code);
            setSession(updatedSession);
        } catch (e) {
            console.error("Failed to start session", e);
            alert("Failed to start session");
        }
    };

    const handleEnd = async () => {
        try {
            await endSession(session.code);
            setSession({ ...session, status: 'ENDED' });
            setShowPodium(true);
            localStorage.removeItem('host_session_code');
        } catch (e) {
            console.error("Failed to end session", e);
            alert("Failed to end session");
        }
    };

    if (showPodium) {
        return (
            <Podium players={players} isAdmin onClose={() => setShowPodium(false)} />
        );
    }

    if (!session) {
        return (
            <Box sx={{ maxWidth: { xs: '100%', sm: 500 }, mx: 'auto', mt: { xs: 2, sm: 4 }, px: { xs: 2, sm: 0 } }}>
                <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, bgcolor: '#FFFFFF' }} elevation={0}>
                  <Typography variant="h5" gutterBottom textAlign="center" fontWeight={800} color="primary" sx={{ fontSize: { xs: '1.5rem', sm: '1.8rem' } }}>
                      🎮 Host Private Game
                  </Typography>
                  <TextField 
                      label="Time Limit (Minutes)" 
                      type="number" 
                      value={timeLimit} 
                      onChange={(e) => setTimeLimit(parseInt(e.target.value))} 
                      fullWidth 
                      margin="normal" 
                      InputProps={{ sx: { borderRadius: 3 } }}
                  />
                  
                  <FormControl fullWidth margin="normal">
                      <InputLabel>Select Questions (Optional)</InputLabel>
                      <Select
                          multiple
                          value={selectedQuestions}
                          onChange={(e) => setSelectedQuestions(e.target.value as number[])}
                          sx={{ borderRadius: 3 }}
                          renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => (
                                      <Chip key={value} label={`Q${value}`} sx={{ borderRadius: 2 }} />
                                  ))}
                              </Box>
                          )}
                      >
                          {allQuestions.map((q) => (
                              <MenuItem key={q.id} value={q.id}>
                                  {q.question_text.substring(0, 30)}...
                              </MenuItem>
                          ))}
                      </Select>
                  </FormControl>

                  <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleCreate} 
                      fullWidth 
                      sx={{ mt: 3, py: 1.5, fontSize: '1.1rem' }}
                  >
                      Create Session ✨
                  </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box 
            textAlign="center" 
            mt={{ xs: 2, sm: 6 }} 
            px={2}
            sx={{ 
                maxWidth: 600, 
                mx: 'auto',
                width: '100%'
            }}
        >
            <Paper 
                elevation={0} 
                sx={{ 
                    display: 'inline-flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: { xs: 3, sm: 5 }, 
                    borderRadius: 6, 
                    mb: 4, 
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                }}
            >
                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1.2rem' }, mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Use Code to Join
                </Typography>
                <Typography 
                    variant="h2" 
                    color="primary" 
                    sx={{ 
                        letterSpacing: { xs: 2, sm: 6 }, 
                        fontWeight: 900,
                        fontSize: { xs: '2.5rem', sm: '4rem' },
                        lineHeight: 1,
                        wordBreak: 'break-all'
                    }}
                >
                    {session.code}
                </Typography>
            </Paper>

            <Box mb={4}>
                <Chip 
                    label={`Status: ${session.status}${timeLeft ? ` • ⏳ ${timeLeft}` : ''}`}
                    color={session.status === 'ACTIVE' ? "success" : "default"}
                    sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '1rem', 
                        py: 2.5, 
                        px: 1, 
                        borderRadius: 4 
                    }} 
                />
            </Box>
            
            {session.status === 'WAITING' && (
                <Box my={4} display="flex" flexDirection="column" alignItems="center">
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: 2, 
                            borderRadius: 4, 
                            bgcolor: '#fff',
                            border: '1px solid #eee'
                        }}
                    >
                        <QRCodeCanvas 
                            value={`${window.location.origin}/?join=${session.code}`} 
                            size={160} 
                            level="H" 
                            style={{ maxWidth: '100%', height: 'auto' }}
                        />
                    </Paper>
                    <Typography mt={2} variant="body2" color="text.secondary">Scan QR to Join</Typography>
                </Box>
            )}

            <Box sx={{ width: '100%', maxWidth: 450, mx: 'auto', textAlign: 'left' }}>
                <Typography variant="h6" mb={2} fontWeight={800} color="text.primary" textAlign="center">
                    Players Joined ({players.length})
                </Typography>
                
                <Paper 
                    elevation={0}
                    sx={{ 
                        bgcolor: 'rgba(255,255,255,0.6)', 
                        backdropFilter: 'blur(10px)',
                        borderRadius: 4,
                        border: '1px solid rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                        height: 300,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {players.length === 0 ? (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                             <Typography color="text.secondary" fontStyle="italic">Waiting for players...</Typography>
                        </Box>
                    ) : (
                        <List sx={{ overflow: 'auto', py: 0 }}>
                            {players.map((p, index) => (
                                <ListItem 
                                    key={p.user.id} 
                                    divider={index !== players.length - 1}
                                    sx={{ px: 3, py: 1.5 }}
                                >
                                    <ListItemText 
                                        primary={
                                            <Typography fontWeight="bold" color="text.primary">
                                                {p.user.username}
                                            </Typography>
                                        }
                                    />
                                    <Chip label={`${p.session_score} pts`} size="small" color="primary" variant="outlined" />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>
            </Box>

            <Box mt={4} mb={6}>
                {session.status === 'WAITING' && (
                    <Button 
                        variant="contained" 
                        color="secondary" 
                        size="large" 
                        onClick={handleStart} 
                        fullWidth
                        sx={{ 
                            maxWidth: 300,
                            py: 2, 
                            fontSize: '1.2rem', 
                            borderRadius: 3,
                            boxShadow: '0 8px 16px rgba(78, 205, 196, 0.3)' 
                        }}
                    >
                        START GAME 🚀
                    </Button>
                )}

                {session.status === 'ACTIVE' && (
                     <Button 
                        variant="contained" 
                        color="error" 
                        size="large" 
                        onClick={handleEnd} 
                        fullWidth
                        sx={{ 
                            maxWidth: 300,
                            py: 2,
                            borderRadius: 3
                        }}
                    >
                        END GAME 🛑
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default HostSession;
