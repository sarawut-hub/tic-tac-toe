import React, { useEffect, useState } from 'react';
import { loginWithGitHub, fetchUser } from './api';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import { 
  Container, 
  CssBaseline, 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Paper,
  ThemeProvider,
  createTheme
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';

const theme = createTheme({
    palette: {
        mode: 'light',
    },
});

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
        localStorage.setItem('access_token', token);
        window.history.replaceState({}, document.title, "/");
    }

    fetchUser().then((u) => {
      setUser(u);
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

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
    setLeaderboardRefreshKey(prev => prev + 1);
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
                        <Button
                            variant="contained"
                            startIcon={<GitHubIcon />}
                            onClick={loginWithGitHub}
                            sx={{ 
                                backgroundColor: '#24292e', 
                                '&:hover': { backgroundColor: '#1a1f24' },
                                mt: 2
                            }}
                        >
                            Login with GitHub
                        </Button>
                    </Paper>
                ) : (
                    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="h6" gutterBottom>
                            Welcome, {user.username}!
                        </Typography>
                        <Game user={user} onUpdateUser={handleUserUpdate} />
                        <Leaderboard refreshKey={leaderboardRefreshKey} />
                    </Box>
                )}
            </Box>
        </Container>
    </ThemeProvider>
  );
}

export default App;
