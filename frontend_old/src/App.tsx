import { useEffect, useState } from 'react';
import { loginWithGitHub, loginWithGoogle, loginWithEmployee, fetchUser, logout } from './api';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import HostSession from './components/HostSession';
import JoinSession from './components/JoinSession';
import QuestionManager from './components/QuestionManager';
import QuestionSetManager from './components/QuestionSetManager';
import Reports from './components/Reports';
import { 
  Container, 
  CssBaseline, 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Paper,
  ThemeProvider,
  createTheme,
  Stack,
  TextField,
  Divider,
  IconButton
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { SoundProvider, useSound } from './hooks/useSound';

const SoundToggle = () => {
    const { isMuted, toggleMute } = useSound();
    return (
        <IconButton 
            onClick={toggleMute} 
            sx={{ 
                bgcolor: 'rgba(255,255,255,0.7)', 
                backdropFilter: 'blur(5px)',
                borderRadius: 3,
                p: 1
            }}
        >
            {isMuted ? <VolumeOffIcon color="error" /> : <VolumeUpIcon color="primary" />}
        </IconButton>
    );
};

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#2196F3' },
        secondary: { main: '#4ECDC4' },
    },
    typography: {
        fontFamily: "'Inter', sans-serif",
    }
});

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const [employeeId, setEmployeeId] = useState('');
  const [view, setView] = useState(localStorage.getItem('current_view') || 'game');
  const [joinCode, setJoinCode] = useState(localStorage.getItem('current_join_code') || '');

  useEffect(() => {
    localStorage.setItem('current_view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('current_join_code', joinCode);
  }, [joinCode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const joinCodeParam = params.get('join');
    const basePath = import.meta.env.BASE_URL || '/';

    if (token) {
        localStorage.setItem('access_token', token);
        // Clean URL but keep base path
        window.history.replaceState({}, document.title, basePath);
        
        // Check for pending join
        const pendingJoin = localStorage.getItem('pending_join_code');
        if (pendingJoin) {
             setJoinCode(pendingJoin);
             setView('join');
             localStorage.removeItem('pending_join_code');
        }
    }

    if (joinCodeParam) {
        // If logged in, use it immediately
        localStorage.setItem('pending_join_code', joinCodeParam);
        setJoinCode(joinCodeParam);
        setView('join');
        window.history.replaceState({}, document.title, basePath);
    }
    
    // Try fetch user anyway
    fetchUser().then((u) => {
        if (u) {
            setUser(u);
        } else {
            localStorage.removeItem('access_token');
            // If not logged in, maybe reset view? But let's keep it for now.
        }
        setLoading(false);
    });
  }, []);

  if (loading) {
      return (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
              <CircularProgress />
          </Box>
      );
  }

  const handleUserUpdate = (updatedUser?: any) => {
    if (updatedUser) {
        setUser(updatedUser);
    } else {
        fetchUser().then(u => setUser(u));
    }
    setLeaderboardRefreshKey(prev => prev + 1);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handleEmployeeLogin = async () => {
    if (!employeeId) return;
    try {
        const response: any = await loginWithEmployee(employeeId);
        if (response.access_token) {
             localStorage.setItem('access_token', response.access_token);
             const u = await fetchUser();
             setUser(u);
        }
    } catch (error) {
        console.error("Employee login error", error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="md">
            <Box py={5} display="flex" flexDirection="column" alignItems="center">
                <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" textAlign="center">
                    Tic-Tac-Toe Challenge
                </Typography>
                
                {!user ? (
                    <Paper className="glass-card" sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center', mt: 4, borderRadius: 6 }}>
                        <Typography variant="h5" fontWeight={800} gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Welcome 👋
                        </Typography>
                        <Typography variant="body1" paragraph color="text.secondary" sx={{ mb: 4 }}>
                            Login to join the ultimate Tic-Tac-Toe challenge.
                        </Typography>
                        <Stack spacing={3} direction="column" alignItems="center" mt={2} width="100%">
                            <Button
                                variant="contained"
                                startIcon={<GitHubIcon />}
                                onClick={loginWithGitHub}
                                sx={{ 
                                    backgroundColor: '#24292e', 
                                    '&:hover': { backgroundColor: '#1a1f24' },
                                    width: '100%',
                                    maxWidth: 320,
                                    py: 1.5,
                                    borderRadius: 4,
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    textTransform: 'none'
                                }}
                            >
                                Continue with GitHub
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<GoogleIcon />}
                                onClick={loginWithGoogle}
                                sx={{ 
                                    backgroundColor: '#ffffff', 
                                    color: '#757575',
                                    border: '1px solid #ddd',
                                    '&:hover': { backgroundColor: '#f5f5f5' },
                                    width: '100%',
                                    maxWidth: 320,
                                    py: 1.5,
                                    borderRadius: 4,
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    textTransform: 'none'
                                }}
                            >
                                Continue with Google
                            </Button>

                            <Divider flexItem sx={{ my: 2, '&::before, &::after': { borderColor: 'rgba(0,0,0,0.08)' } }}>
                                <Typography variant="caption" sx={{ color: '#aaa', fontWeight: 600 }}>OR USE ID</Typography>
                            </Divider>

                            <Box component="form" onSubmit={(e: any) => { e.preventDefault(); handleEmployeeLogin(); }} width="100%" maxWidth={320}>
                                <TextField 
                                    label="Employee ID / Player ID"
                                    variant="outlined"
                                    fullWidth
                                    value={employeeId} 
                                    onChange={(e) => setEmployeeId(e.target.value)} 
                                    sx={{ mb: 2 }}
                                    InputProps={{ sx: { borderRadius: 4, bgcolor: 'rgba(255,255,255,0.5)' } }}
                                />
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    fullWidth
                                    startIcon={<AccountCircleIcon />}
                                    onClick={handleEmployeeLogin}
                                    disabled={!employeeId}
                                    sx={{ py: 1.5, borderRadius: 4, fontWeight: 700, fontSize: '1rem', textTransform: 'none', boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)' }}
                                >   
                                    Login with ID
                                </Button>
                            </Box>
                        </Stack>
                    </Paper>
                ) : (
                    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
                         <Paper className="glass-card" sx={{ p: 1, borderRadius: 5, mb: 4, display: 'flex', gap: 1 }}>
                            <Button 
                                variant={view === 'game' ? "contained" : "text"} 
                                onClick={() => setView('game')}
                                sx={{ borderRadius: 4, px: 3, fontWeight: 700, textTransform: 'none' }}
                            >
                                Play Solo
                            </Button>
                            <Button 
                                variant={view === 'join' ? "contained" : "text"} 
                                onClick={() => setView('join')}
                                sx={{ borderRadius: 4, px: 3, fontWeight: 700, textTransform: 'none' }}
                            >
                                Join Room
                            </Button>
                            {user.is_admin && (
                                <>
                                    <Button 
                                        variant={view === 'host' ? "contained" : "text"} 
                                        onClick={() => setView('host')}
                                        sx={{ borderRadius: 4, px: 3, fontWeight: 700, textTransform: 'none' }}
                                    >
                                        Host
                                    </Button>
                                    <Button 
                                        variant={view === 'questions' ? "contained" : "text"} 
                                        onClick={() => setView('questions')}
                                        sx={{ borderRadius: 4, px: 3, fontWeight: 700, textTransform: 'none' }}
                                    >
                                        Questions
                                    </Button>
                                    <Button 
                                        variant={view === 'categories' ? "contained" : "text"} 
                                        onClick={() => setView('categories')}
                                        sx={{ borderRadius: 4, px: 3, fontWeight: 700, textTransform: 'none' }}
                                    >
                                        Sets
                                    </Button>
                                    <Button 
                                        variant={view === 'reports' ? "contained" : "text"} 
                                        onClick={() => setView('reports')}
                                        sx={{ borderRadius: 4, px: 3, fontWeight: 700, textTransform: 'none' }}
                                    >
                                        Reports
                                    </Button>
                                </>
                            )}
                        </Paper>

                        <Box sx={{ position: 'fixed', top: 20, right: 20, display: 'flex', gap: 1 }}>
                            <SoundToggle />
                            <Button 
                                variant="contained" 
                                color="inherit"
                                size="small" 
                                onClick={handleLogout}
                                sx={{ 
                                    borderRadius: 3, 
                                    bgcolor: 'rgba(255,255,255,0.7)', 
                                    backdropFilter: 'blur(5px)',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    color: '#666'
                                }}
                            >
                                Logout 🚪
                            </Button>
                        </Box>

                        {view === 'game' && (
                            <>
                                <Game user={user} onUpdateUser={handleUserUpdate} />
                                <Leaderboard user={user} refreshKey={leaderboardRefreshKey} onReset={handleUserUpdate} />
                            </>
                        )}
                        
                        {view === 'host' && user.is_admin && (
                             <HostSession />
                        )}

                         {view === 'questions' && user.is_admin && (
                             <QuestionManager />
                        )}

                        {view === 'categories' && user.is_admin && (
                             <QuestionSetManager />
                        )}

                        {view === 'reports' && user.is_admin && (
                             <Reports />
                        )}

                        {view === 'join' && (
                            !joinCode ? (
                                <Box mt={4} display="flex" flexDirection="column" alignItems="center" width="100%">
                                    <Paper className="glass-card" sx={{ p: 4, borderRadius: 6, width: '100%', maxWidth: 400, textAlign: 'center' }}>
                                        <Typography variant="h5" fontWeight={800} mb={3}>Enter Room Code 🔑</Typography>
                                        <TextField 
                                            label="Session Code" 
                                            variant="outlined" 
                                            fullWidth
                                            placeholder="XXXXXX"
                                            value={joinCode} 
                                            onChange={(e: any) => setJoinCode(e.target.value.toUpperCase())} 
                                            sx={{ mb: 3 }}
                                            InputProps={{ sx: { borderRadius: 4, fontSize: '1.5rem', textAlign: 'center', letterSpacing: 4, fontWeight: 900 } }}
                                        />
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            fullWidth
                                            size="large"
                                            disabled={joinCode.length < 6}
                                            onClick={() => {}} // JoinSession handles polling
                                            sx={{ borderRadius: 4, py: 1.5, fontWeight: 800, fontSize: '1.1rem' }}
                                        >
                                            Join Lobby 🚀
                                        </Button>
                                    </Paper>
                                </Box>
                            ) : (
                                <Box mt={2} width="100%">
                                    <Button onClick={() => setJoinCode('')} sx={{ mb: 2, fontWeight: 700 }}>⬅️ Change Room</Button>
                                    <JoinSession sessionCode={joinCode} user={user} onUpdateUser={handleUserUpdate}/>
                                </Box>
                            )
                        )}
                    </Box>
                )}
            </Box>
        </Container>
    </ThemeProvider>
  );
}

export default function Root() {
    return (
        <SoundProvider>
            <App />
        </SoundProvider>
    );
}
