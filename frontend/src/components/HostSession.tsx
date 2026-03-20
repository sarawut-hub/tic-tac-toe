import React, { useState, useEffect } from 'react';
import { useSound } from '../hooks/useSound';
import { 
    Box, 
    Button, 
    Typography, 
    TextField, 
    List, 
    ListItem, 
    ListItemText, 
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip
} from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import { 
    fetchQuestions, fetchQuestionSets, createSession, getSession, getSessionPlayers, 
    startSession, endSession, getWebSocket, getSessionHistory 
} from '../api';
import Podium from './Podium';

const HostSession: React.FC = () => {
    const { playSFX } = useSound();
    const [timeLimit, setTimeLimit] = useState(5);
    const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
    const [allQuestions, setAllQuestions] = useState<any[]>([]);
    const [questionSets, setQuestionSets] = useState<any[]>([]);
    const [selectedSet, setSelectedSet] = useState<number | ''>('');
    const [session, setSession] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [sessionName, setSessionName] = useState('');
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [showPodium, setShowPodium] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [qData, sData] = await Promise.all([
                    fetchQuestions(),
                    fetchQuestionSets()
                ]);
                setAllQuestions(qData);
                setQuestionSets(sData);
            } catch (e) {
                console.error("Failed to load hosting data", e);
            }
        };
        load();

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
        if (session && session.status !== 'ENDED') {
            const fetchPlayers = () => getSessionPlayers(session.code).then(setPlayers);
            fetchPlayers();

            const ws = getWebSocket(session.code);
            ws.onmessage = (event: any) => {
                const message = JSON.parse(event.data);
                if (message.type === 'PLAYER_JOINED') {
                    playSFX('JOIN');
                    fetchPlayers();
                } else if (message.type === 'SCORE_UPDATE') {
                    setPlayers((prev: any[]) => prev.map(p => 
                        p.user.id === message.data.user_id 
                        ? { ...p, session_score: message.data.score } 
                        : p
                    ));
                } else if (message.type === 'SESSION_STARTED') {
                    playSFX('START');
                    setSession((prev: any) => ({ 
                        ...prev, 
                        status: 'ACTIVE', 
                        start_time: message.data.start_time, 
                        end_time: message.data.end_time 
                    }));
                } else if (message.type === 'SESSION_ENDED') {
                    setSession((prev: any) => ({ ...prev, status: 'ENDED' }));
                    setShowPodium(true);
                }
            };
            return () => ws.close();
        }
    }, [session?.code]);

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
                name: sessionName,
                time_limit_minutes: timeLimit,
                question_ids: selectedSet ? [] : selectedQuestions,
                question_set_id: selectedSet || undefined
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
                <Paper className="glass-card" sx={{ p: { xs: 3, sm: 5 }, borderRadius: 6 }} elevation={0}>
                  <Typography variant="h4" gutterBottom textAlign="center" fontWeight={900} color="primary" sx={{ mb: 4, letterSpacing: -0.5 }}>
                      Host Private Game 🎮
                  </Typography>
                   <TextField 
                      label="Session Name (for Report)" 
                      placeholder="e.g., Monthly Team Quiz"
                      value={sessionName} 
                      onChange={(e) => setSessionName(e.target.value)} 
                      fullWidth 
                      margin="normal" 
                      InputProps={{ sx: { borderRadius: 4, bgcolor: 'rgba(255,255,255,0.5)' } }}
                  />
                  <TextField 
                      label="Time Limit (Minutes)" 
                      type="number" 
                      value={timeLimit} 
                      onChange={(e) => setTimeLimit(parseInt(e.target.value))} 
                      fullWidth 
                      margin="normal" 
                      InputProps={{ sx: { borderRadius: 4, bgcolor: 'rgba(255,255,255,0.5)' } }}
                  />
                  
                  <FormControl fullWidth margin="normal">
                      <InputLabel>Select Category (Question Set)</InputLabel>
                      <Select
                          value={selectedSet}
                          onChange={(e) => {
                                const val = e.target.value;
                                setSelectedSet(val as number);
                                if (val) {
                                    // Optionally clear specific questions or pre-select them
                                    setSelectedQuestions([]); 
                                }
                          }}
                          sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.5)' }}
                          label="Select Category (Question Set)"
                      >
                          <MenuItem value=""><em>None - Select Manual Questions</em></MenuItem>
                          {questionSets.map((set) => (
                              <MenuItem key={set.id} value={set.id}>
                                  {set.name} ({set.questions.length} Questions)
                              </MenuItem>
                          ))}
                      </Select>
                  </FormControl>

                  {!selectedSet && (
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Select Questions (Manual)</InputLabel>
                        <Select
                            multiple
                            value={selectedQuestions}
                            onChange={(e) => setSelectedQuestions(e.target.value as number[])}
                            sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.5)' }}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={`Q${value}`} size="small" sx={{ borderRadius: 2, fontWeight: 'bold' }} />
                                    ))}
                                </Box>
                            )}
                        >
                            {allQuestions.map((q) => (
                                <MenuItem key={q.id} value={q.id}>
                                    {q.question_text.substring(0, 40)}...
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                  )}

                  <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleCreate} 
                      fullWidth 
                      sx={{ 
                          mt: 4, 
                          py: 2, 
                          fontSize: '1.2rem', 
                          fontWeight: 800, 
                          borderRadius: 4,
                          boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)',
                          textTransform: 'none'
                      }}
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
                className="glass-card"
                sx={{ 
                    display: 'inline-flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: { xs: 4, sm: 6 }, 
                    borderRadius: 8, 
                    mb: 4, 
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
                }}
            >
                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1.2rem' }, mb: 1, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
                    Join with Code
                </Typography>
                <Typography 
                    variant="h2" 
                    color="primary" 
                    sx={{ 
                        letterSpacing: { xs: 4, sm: 10 }, 
                        fontWeight: 900,
                        fontSize: { xs: '3rem', sm: '5rem' },
                        lineHeight: 1,
                        wordBreak: 'break-all',
                        textShadow: '0 4px 20px rgba(33, 150, 243, 0.2)'
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
                        className="glass-card"
                        sx={{ 
                            p: 3, 
                            borderRadius: 5, 
                            border: '1px solid rgba(255,255,255,0.5)',
                            transition: 'transform 0.3s ease',
                            '&:hover': { transform: 'scale(1.02)' }
                        }}
                    >
                        <QRCodeCanvas 
                            value={window.location.origin.includes('github.io') 
                                ? `${window.location.origin}/tic-tac-toe/?join=${session.code}`
                                : `${window.location.origin}/?join=${session.code}`
                            }
                            size={180} 
                            level="H" 
                            style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                        />
                    </Paper>
                    <Typography mt={2} variant="body2" color="text.secondary" fontWeight={600}>Scan QR to Join Instantly 📱</Typography>
                </Box>
            )}

            <Box sx={{ width: '100%', maxWidth: 450, mx: 'auto', textAlign: 'left' }}>
                <Typography variant="h6" mb={2} fontWeight={800} color="text.primary" textAlign="center">
                    Players Joined ({players.length})
                </Typography>
                
                <Paper 
                    className="glass-card"
                    elevation={0}
                    sx={{ 
                        borderRadius: 5,
                        border: '1px solid rgba(255,255,255,0.4)',
                        overflow: 'hidden',
                        height: 350,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Typography variant="subtitle1" sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.03)', fontWeight: 800, textAlign: 'center', letterSpacing: 1 }}>
                        LOBBY ({players.length} Players)
                    </Typography>
                    {players.length === 0 ? (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                             <Typography color="text.secondary" fontStyle="italic" fontWeight={500}>Waiting for participants... ⏳</Typography>
                        </Box>
                    ) : (
                        <List sx={{ overflow: 'auto', py: 0 }}>
                            {players.map((p, index) => (
                                <ListItem 
                                    key={p.user.id} 
                                    divider={index !== players.length - 1}
                                    sx={{ px: 4, py: 2, borderColor: 'rgba(0,0,0,0.05)' }}
                                >
                                    <ListItemText 
                                        primary={
                                            <Typography fontWeight={700} color="text.primary" fontSize="1.1rem">
                                                {p.user.username}
                                            </Typography>
                                        }
                                    />
                                    <Chip label={`${p.session_score} pts`} size="small" color="primary" sx={{ fontWeight: 800, borderRadius: 2 }} />
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

            <Box mt={8} mb={6} sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
                <Button 
                    variant="text" 
                    onClick={async () => {
                        const data = await getSessionHistory();
                        setHistory(data);
                        setShowHistory(!showHistory);
                    }}
                    sx={{ mb: 2 }}
                >
                    {showHistory ? "Hide History 🕒" : "Show Recent Sessions 🕒"}
                </Button>

                {showHistory && (
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.5)' }}>
                        <Typography variant="h6" mb={2} fontWeight={700}>Session Reports</Typography>
                        {history.length === 0 ? (
                            <Typography color="text.secondary">No past sessions found.</Typography>
                        ) : (
                            <List>
                                {history.map((h) => (
                                    <ListItem 
                                        key={h.id} 
                                        sx={{ 
                                            bgcolor: 'white', 
                                            mb: 1, 
                                            borderRadius: 2,
                                            border: '1px solid #eee' 
                                        }}
                                    >
                                        <ListItemText 
                                            primary={h.name || `Session ${h.code}`} 
                                            secondary={`Status: ${h.status} | Code: ${h.code}`} 
                                        />
                                        <Button size="small" variant="contained" onClick={() => {
                                            setSession(h);
                                            setShowHistory(false);
                                        }}>
                                            View Report
                                        </Button>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default HostSession;
