import React, { useState, useEffect } from 'react';
import Square from './Square';
import { recordGameResult, submitQuizAnswer } from '../api';
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
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [showCheer, setShowCheer] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [quizQuestion, setQuizQuestion] = useState<{id: number, question: string, options: string[]} | null>(null);
  const [gameDuration, setGameDuration] = useState<number>(0);
  
  // Trigger cheer on win
  useEffect(() => {
    if (winner === 'X') {
        setShowCheer(true);
        setTimeout(() => setShowCheer(false), 3000);
    }
  }, [winner]);

  useEffect(() => {
    if (!isXNext && !winner && !quizQuestion) {
      const timer = setTimeout(() => {
        makeBotMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, board, quizQuestion]); 

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const checkWinnerForMove = (squares: (string | null)[], player: string) => {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
      ];
      for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] === player && squares[b] === player && squares[c] === null) return c;
        if (squares[a] === player && squares[c] === player && squares[b] === null) return b;
        if (squares[b] === player && squares[c] === player && squares[a] === null) return a;
      }
      return null;
  };

  const handleClick = (i: number) => {
    if (board[i] || winner || !isXNext || quizQuestion) return;
    const newBoard = [...board];
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
    checkGameStatus(newBoard, false);
  };

  const makeBotMove = () => {
    if (calculateWinner(board) || !board.includes(null)) return;
    const availableMoves = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
    if (availableMoves.length === 0) return;
    
    let move: number | null = null;
    const diff = user.bot_difficulty || 1;

    // Level 2+: Block
    if (diff >= 2) {
       move = checkWinnerForMove(board, 'X');
    }
    // Level 3+: Try directly to win
    if (diff >= 3 && move === null) {
       move = checkWinnerForMove(board, 'O');
    }

    // Default Random
    if (move === null) {
        move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    
    const newBoard = [...board];
    newBoard[move] = 'O';
    setBoard(newBoard);
    setIsXNext(true);
    checkGameStatus(newBoard, true);
  };

  const checkGameStatus = (currentBoard: (string | null)[], isBot: boolean) => {
    const win = calculateWinner(currentBoard);
    if (win) {
      setWinner(win);
      handleGameEnd(win);
    } else if (!currentBoard.includes(null)) {
      setWinner('Draw');
      handleGameEnd('Draw');
    }
  };

  const handleGameEnd = async (result: string) => {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    setGameDuration(duration);

    let apiResult: 'win' | 'lose' | 'draw' = 'draw';
    if (result === 'X') apiResult = 'win';
    if (result === 'O') apiResult = 'lose';
    
    try {
        const response: any = await recordGameResult(apiResult, duration, sessionCode);
        
        // Always update user stats
        if (response.user) {
            onUpdateUser(response.user);
        }

        if (response.question) {
            setQuizQuestion(response.question);
        }
        
        // Update session score if provided (might be undefined if question triggered)
        if (response.session_score !== undefined && response.session_score !== null && onSessionScoreUpdate) {
             onSessionScoreUpdate(response.session_score);
        }
    } catch (e) {
        console.error("Failed to record game", e);
    }
  };

  const handleQuizAnswer = async (index: number) => {
      if (!quizQuestion) return;
      try {
          const response: any = await submitQuizAnswer(quizQuestion.id, index, gameDuration, sessionCode);
          onUpdateUser(response.user);
          if (response.session_score !== undefined && onSessionScoreUpdate) {
               onSessionScoreUpdate(response.session_score);
          }
          setQuizQuestion(null);
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
          bgcolor: '#FFE66D', // Bright yellow backplate
          borderRadius: 4,
          boxShadow: '0 8px 0px rgba(0,0,0,0.1)' 
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
