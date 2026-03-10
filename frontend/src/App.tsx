import { useEffect, useState } from 'react';
import { loginWithGitHub, loginWithGoogle, loginWithEmployee, fetchUser, logout } from './api';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import HostSession from './components/HostSession';
import JoinSession from './components/JoinSession';
import QuestionManager from './components/QuestionManager';
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
  Divider
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
const theme = createTheme({
    palette: {
        mode: 'light',
    },
});

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const [employeeId, setEmployeeId] = useState('');
  const [view, setView] = useState('game');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
        localStorage.setItem('access_token', token);
        window.history.replaceState({}, document.title, "/");
    }

    // Try fetch user anyway (cookie might exist even if no localStorage token)
    fetchUser().then((u) => {
        if (u) {
            setUser(u);
        } else {
            localStorage.removeItem('access_token');
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
                    <Paper elevation={3} sx={{ p: 4, textAlign: 'center', mt: 4 }}>
                        <Typography variant="body1" paragraph>
                            Please login to play and save your score.
                        </Typography>
                        <Stack spacing={2} direction="column" alignItems="center" mt={2}>
                            <Button
                                variant="contained"
                                startIcon={<GitHubIcon />}
                                onClick={loginWithGitHub}
                                sx={{ 
                                    backgroundColor: '#24292e', 
                                    '&:hover': { backgroundColor: '#1a1f24' },
                                    width: '100%',
                                    maxWidth: 300
                                }}
                            >
                                Login with GitHub
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<GoogleIcon />}
                                onClick={loginWithGoogle}
                                sx={{ 
                                    backgroundColor: '#db4437', 
                                    '&:hover': { backgroundColor: '#c53929' },
                                    width: '100%',
                                    maxWidth: 300
                                }}
                            >
                                Login with Google
                            </Button>

                            <Divider flexItem sx={{ my: 2 }}>OR</Divider>

                            <Box component="form" onSubmit={(e: any) => { e.preventDefault(); handleEmployeeLogin(); }} width="100%" maxWidth={300}>
                                <TextField 
                                    label="Employee ID (รหัสพนักงาน)"
                                    variant="outlined"
                                    fullWidth
                                    value={employeeId} 
                                    onChange={(e) => setEmployeeId(e.target.value)} 
                                    sx={{ mb: 1 }}
                                />
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    fullWidth
                                    startIcon={<AccountCircleIcon />}
                                    onClick={handleEmployeeLogin}
                                    disabled={!employeeId}
                                >   
                                    Login with Employee ID
                                </Button>
                            </Box>
                        </Stack>
                    </Paper>
                ) : (
                    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
                        <Stack direction="row" spacing={1} mb={3} flexWrap="wrap" justifyContent="center">
                            <Button 
                                variant={view === 'game' ? "contained" : "outlined"} 
                                onClick={() => setView('game')}
                            >
                                Play Solo
                            </Button>
                            <Button 
                                variant={view === 'join' ? "contained" : "outlined"} 
                                onClick={() => setView('join')}
                            >
                                Join Game
                            </Button>
                            {user.is_admin && (
                                <>
                                    <Button 
                                        variant={view === 'host' ? "contained" : "outlined"} 
                                        onClick={() => setView('host')}
                                    >
                                        Host Game
                                    </Button>
                                    <Button 
                                        variant={view === 'questions' ? "contained" : "outlined"} 
                                        onClick={() => setView('questions')}
                                    >
                                        Questions
                                    </Button>
                                </>
                            )}
                        </Stack>

                        <Button 
                            variant="outlined" 
                            size="small" 
                            color="inherit" 
                            onClick={handleLogout}
                            sx={{ mb: 2 }}
                        >
                            Logout
                        </Button>

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

                        {view === 'join' && (
                            !joinCode ? (
                                <Box mt={4} display="flex" flexDirection="column" alignItems="center" gap={2}>
                                    <Typography variant="h6">Enter Session Code</Typography>
                                    <TextField 
                                        label="Code" 
                                        variant="outlined" 
                                        value={joinCode} 
                                        onChange={(e: any) => setJoinCode(e.target.value.toUpperCase())} 
                                    />
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        disabled={joinCode.length < 6}
                                        onClick={() => {}} // JoinSession handles polling, just passing code
                                    >
                                        Enter
                                    </Button>
                                </Box>
                            ) : (
                                <Box mt={2} width="100%">
                                    <Button onClick={() => setJoinCode('')} sx={{ mb: 2 }}>Back</Button>
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

export default App;
