import React, { useState, useEffect } from 'react';
import Square from './Square';
import { submitQuizAnswer, makeMove } from '../api';
import { Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, Chip } from '@mui/material';
import { keyframes } from '@emotion/react';
import Character from './Character';

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-20px);}
  60% {transform: translateY(-10px);}
`;

const Game: React.FC<{ 
    user: any, 
    onUpdateUser: (user: any) => void, 
    sessionCode?: string, 
    sessionScore?: number,
    onSessionScoreUpdate?: (score: number) => void,
    avatarConfig?: any
}> = ({ user, onUpdateUser, sessionCode, sessionScore, onSessionScoreUpdate, avatarConfig }) => {
  const storageKey = `ttt_game_state_${user.id}_${sessionCode || 'solo'}`;

  const [board, setBoard] = useState<(string | null)[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        try {
            return JSON.parse(saved).board;
        } catch (e) {
            console.error("Failed to parse saved board", e);
        }
    }
    return Array(9).fill(null);
  });
  
  const [isXNext, setIsXNext] = useState<boolean>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        try {
            return JSON.parse(saved).isXNext;
        } catch (e) {
            console.error("Failed to parse saved turn", e);
        }
    }
    return true;
  });

  const [winner, setWinner] = useState<string | null>(null);
  const [showCheer, setShowCheer] = useState(false);
  
  const [startTime, setStartTime] = useState<number>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        try {
            return JSON.parse(saved).startTime || Date.now();
        } catch (e) {
            console.error("Failed to parse saved startTime", e);
        }
    }
    return Date.now();
  });

  const [quizQuestion, setQuizQuestion] = useState<{id: number, question: string, options: string[]} | null>(null);
  
  const [loading, setLoading] = useState(false);

  // Save state on change
  useEffect(() => {
    if (!winner && !quizQuestion) {
        localStorage.setItem(storageKey, JSON.stringify({ board, isXNext, startTime }));
    }
  }, [board, isXNext, startTime, winner, quizQuestion, storageKey]);

  // Trigger cheer on win
  useEffect(() => {
    if (winner === 'X') {
        setShowCheer(true);
        setTimeout(() => setShowCheer(false), 3000);
    }
    if (winner) {
        localStorage.removeItem(storageKey);
    }
  }, [winner, storageKey]);

  // Remove local calculateWinner and checkWinnerForMove logic as it's now on backend

  const handleClick = async (i: number) => {
    if (board[i] || winner || !isXNext || quizQuestion || loading) return;
    
    setLoading(true);
    try {
        const response: any = await makeMove(i, sessionCode);
        
        if (response.state) {
            setBoard(response.state.board);
            setIsXNext(response.state.is_x_next);
        } else {
            // Game ended (response contains user, question, session_score)
            // Need to deduce board state from 'X' move OR backend should return final board
            // Let's assume backend returns board even on end in future, 
            // but for now let's manually update board for player move at least
            const newBoard = [...board];
            newBoard[i] = 'X';
            setBoard(newBoard);
            
            if (response.result) {
                setWinner(response.result === 'win' ? 'X' : response.result === 'lose' ? 'O' : 'Draw');
            }

            if (response.question) {
                setQuizQuestion(response.question);
            }
        }

        if (response.user) onUpdateUser(response.user);
        if (response.session_score !== undefined && onSessionScoreUpdate) {
            onSessionScoreUpdate(response.session_score);
        }
    } catch (e) {
        console.error("Move failed", e);
    } finally {
        setLoading(false);
    }
  };

  // Bot move is now handled by backend makeMove call
  
  const handleQuizAnswer = async (index: number) => {
      if (!quizQuestion) return;
      try {
          const answerText = quizQuestion.options[index];
          // Use gameDuration as timeTaken for simplicity or calculate actual quiz time
          const timeSpent = (Date.now() - startTime) / 1000;
          const response: any = await submitQuizAnswer(quizQuestion.id, answerText, timeSpent, sessionCode);
          if (response.user) onUpdateUser(response.user);
          
          if (response.session_score !== undefined && onSessionScoreUpdate) {
               onSessionScoreUpdate(response.session_score);
          }
          setQuizQuestion(null);
          // Reload page or reset game? 
          setWinner('Match Ended'); // Trigger end
      } catch (e) {
          console.error("Quiz submission failed", e);
          setQuizQuestion(null);
      }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsXNext(true);
    setStartTime(Date.now());
    setQuizQuestion(null);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: '#fff', border: '2px dashed #eee' }}>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>
            {winner ? (winner === 'Draw' ? "🤝 It's a Draw!" : `🎉 Winner: ${winner === 'X' ? 'You' : 'Bot'}!`) : (isXNext ? "👉 Your Turn (X)" : "🤖 Bot Thinking...")}
          </Typography>
      </Paper>
      
      <Box sx={{ 
          width: 320, 
          height: 320, 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 1.5,
          p: 2,
          bgcolor: '#37474f', // Darker to contrast
          borderRadius: 4,
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)' 
      }}>
        {board.map((val, idx) => (
          <Square key={idx} value={val} onClick={() => handleClick(idx)} />
        ))}
      </Box>

      {winner && !quizQuestion && (
        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={resetGame}
          sx={{ 
              mt: 2, 
              animation: `${bounce} 1s infinite`,
              bgcolor: '#4ECDC4',
              color: 'white',
              fontSize: '1.2rem'
          }}
        >
          Play Again 🔄
        </Button>
      )}

      {/* Character Cheering */}
      {avatarConfig && (
        <Box 
            sx={{ 
                mt: 2, 
                mb: -3, 
                zIndex: 10, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
            }}
        >
            {showCheer && (
                <Paper 
                    elevation={4} 
                    sx={{ 
                        p: 1, 
                        px: 2, 
                        mb: 1, 
                        borderRadius: 4, 
                        bgcolor: '#FF6B6B', 
                        color: 'white', 
                        fontWeight: 'bold',
                        animation: `${bounce} 0.5s infinite`
                    }}
                >
                    Yay! You Won! 🎉
                </Paper>
            )}
            <Character config={avatarConfig} size={100} cheering={showCheer} />
        </Box>
      )}

      <Paper elevation={0} sx={{ 
          width: '100%', 
          maxWidth: 400, 
          p: 3, 
          pt: 4, // More padding top for character overlap 
          textAlign: 'center', 
          bgcolor: '#ffffff',
          borderRadius: 4,
          border: '1px solid #f0f0f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                 <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" letterSpacing={1}>Score</Typography>
                 <Typography variant="h4" color="primary">
                    {sessionCode && sessionScore !== undefined ? sessionScore : user.score}
                 </Typography>
              </Box>
              <Box>
                 <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" letterSpacing={1}>Streak</Typography>
                 <Typography variant="h4" color="secondary">
                     {user.current_streak} 🔥
                 </Typography>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Chip 
                    label={`Bot Difficulty: Level ${user.bot_difficulty || 1}`} 
                    color="primary" 
                    variant="outlined" 
                    sx={{ mt: 1, fontWeight: 'bold' }} 
                />
              </Box>
          </Box>
      </Paper>

      {/* Quiz Modal */}
      <Dialog 
        open={!!quizQuestion} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
            sx: { borderRadius: 4, p: 2 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', color: '#FF6B6B', fontWeight: 900, fontSize: '1.5rem' }}>
            🎁 Bonus Question! 🎁
        </DialogTitle>
        <DialogContent>
            <Typography variant="h6" gutterBottom textAlign="center" sx={{ mb: 3, fontWeight: 700 }}>
                {quizQuestion?.question}
            </Typography>
         
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {quizQuestion?.options.map((opt: string, idx: number) => (
                    <Button 
                        key={idx}
                        variant="outlined" 
                        fullWidth 
                        onClick={() => handleQuizAnswer(idx)}
                        sx={{ 
                            justifyContent: 'flex-start', 
                            textAlign: 'left',
                            borderRadius: 3,
                            py: 1.5,
                            borderWidth: 2,
                            '&:hover': { borderWidth: 2, bgcolor: '#F7FFF7' }
                        }}
                    >
                        <Box component="span" sx={{ 
                            width: 28, 
                            height: 28, 
                            borderRadius: '50%', 
                            bgcolor: '#eee', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mr: 2,
                            color: '#555',
                            fontWeight: 'bold'
                        }}>
                            {String.fromCharCode(65 + idx)}
                        </Box>
                        {opt}
                    </Button>
                ))}
            </Box>
             <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 3, color: '#aaa' }}>
                Correct (+100) | Incorrect (-1)
            </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Game;
