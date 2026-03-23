import React, { useState, useEffect } from 'react';
import Square from './Square';
import { useSound } from '../hooks/useSound';
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
    avatarConfig?: any,
    endTime?: string
}> = ({ user, onUpdateUser, sessionCode, sessionScore, onSessionScoreUpdate, avatarConfig, endTime }) => {
    const { playSFX } = useSound();
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

    useEffect(() => {
        if (!endTime) return;
        
        const timer = setInterval(() => {
            const now = new Date();
            const end = new Date(endTime);
            const diff = end.getTime() - now.getTime();
            
            if (diff <= 0) {
                setTimeLeft("0:00");
                clearInterval(timer);
            } else {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
            }
        }, 1000);
        
        return () => clearInterval(timer);
    }, [endTime]);
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

  const [quizQuestion, setQuizQuestion] = useState<{id: number, question_text: string, options: any[], image_data?: string} | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  
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
        playSFX('VICTORY');
        setTimeout(() => setShowCheer(false), 3000);
    }
    if (winner) {
        localStorage.removeItem(storageKey);
    }
  }, [winner, storageKey]);

  // Remove local calculateWinner and checkWinnerForMove logic as it's now on backend

    const isProcessing = React.useRef(false);

    const handleClick = async (i: number) => {
        if (board[i] || winner || !isXNext || quizQuestion || loading || isProcessing.current || timeLeft === "0:00") return;
        
        isProcessing.current = true;
        setLoading(true);
        try {
            playSFX('CLICK');
            const response: any = await makeMove(i, sessionCode);
            
            if (response.state) {
                setBoard(response.state.board);
                setIsXNext(response.state.is_x_next);
            }
            
            if (response.user) {
                onUpdateUser(response.user);
            }
            
            if (response.result) {
                setWinner(response.result === 'win' ? 'X' : response.result === 'lose' ? 'O' : 'Draw');
            }
            
            if (response.question) {
                setQuizQuestion(response.question);
                setQuizStartTime(Date.now());
            }

            if (response.session_score !== undefined && onSessionScoreUpdate) {
                onSessionScoreUpdate(response.session_score);
            }
        } catch (e) {
            console.error("Move failed", e);
        } finally {
            setLoading(false);
            isProcessing.current = false;
        }
    };

  // Bot move is now handled by backend makeMove call
  
  const handleQuizAnswer = async (index: number) => {
      if (!quizQuestion) return;
      try {
          const answerText = quizQuestion.options[index];
          // Calculate actual quiz time
          const timeSpent = quizStartTime ? (Date.now() - quizStartTime) / 1000 : 0;
          const response: any = await submitQuizAnswer(quizQuestion.id, answerText, timeSpent, sessionCode);
          if (response.user) onUpdateUser(response.user);
          
          if (response.session_score !== undefined && onSessionScoreUpdate) {
               onSessionScoreUpdate(response.session_score);
          }
          if (response.is_correct) {
              playSFX('CORRECT');
          } else {
              playSFX('WRONG');
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
    setQuizStartTime(null);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={3} sx={{ perspective: '1000px' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper elevation={0} className="glass-card" sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(255,255,255,0.3)' }}>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>
                    {winner ? (winner === 'Draw' ? "🤝 It's a Draw!" : `🎉 Winner: ${winner === 'X' ? 'You' : 'Bot'}!`) : (isXNext ? "👉 Your Turn (X)" : "🤖 Bot Thinking...")}
                </Typography>
            </Paper>
            {timeLeft && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: '#FFEBEE', color: '#D32F2F', display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="900">⏱️ {timeLeft}</Typography>
                </Paper>
            )}
        </Box>
      
      <Box sx={{ 
          width: 320, 
          height: 320, 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 1.5,
          p: 2,
          bgcolor: 'rgba(55, 71, 79, 0.8)', // Semi-transparent dark
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s ease'
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
              fontSize: '1.2rem',
              borderRadius: 3,
              px: 4,
              boxShadow: '0 8px 16px rgba(78, 205, 196, 0.4)'
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
                    elevation={0} 
                    className="glass-card"
                    sx={{ 
                        p: 1, 
                        px: 2, 
                        mb: 1, 
                        borderRadius: 4, 
                        bgcolor: 'rgba(255, 107, 107, 0.9) !important', 
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

      <Paper elevation={0} className="glass-card" sx={{ 
          width: '100%', 
          maxWidth: 400, 
          p: 3, 
          pt: 4, 
          textAlign: 'center', 
          borderRadius: 4,
        }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.05)', borderRadius: 3 }}>
                 <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" fontWeight={700} letterSpacing={1}>Score</Typography>
                 <Typography variant="h4" color="primary" fontWeight={900}>
                    {sessionCode && sessionScore !== undefined ? sessionScore : user.score}
                 </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'rgba(233, 30, 99, 0.05)', borderRadius: 3 }}>
                 <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" fontWeight={700} letterSpacing={1}>Streak</Typography>
                 <Typography variant="h4" color="secondary" fontWeight={900} className={user.current_streak >= 3 ? "fire-effect" : ""}>
                     {user.current_streak} {user.current_streak >= 3 ? "🔥" : "✨"}
                 </Typography>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Chip 
                    label={`Bot Difficulty: Level ${user.bot_difficulty || 1}`} 
                    color="primary" 
                    variant="outlined" 
                    sx={{ mt: 1, fontWeight: 'bold', borderRadius: 2 }} 
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
            className: "glass-card",
            sx: { borderRadius: 6, p: 0, overflow: 'hidden' }
        }}
      >
        <Box sx={{ height: 6, bgcolor: '#FF6B6B', animation: 'progress-shrink 15s linear forwards' }} />
        <DialogTitle sx={{ textAlign: 'center', color: '#FF6B6B', fontWeight: 900, fontSize: '1.8rem', pt: 4 }}>
            🎁 Bonus Question! 🎁
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
            {quizQuestion?.image_data && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <img 
                        src={quizQuestion.image_data} 
                        alt="Question" 
                        style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 20, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }} 
                    />
                </Box>
            )}
            <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 4, fontWeight: 800, color: '#333' }}>
                {quizQuestion?.question_text}
            </Typography>
         
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: (quizQuestion?.options.some((opt: any) => typeof opt !== 'string' && opt.image_data)) ? 'repeat(2, 1fr)' : '1fr', 
                gap: 2 
            }}>
                {quizQuestion?.options.map((opt: any, idx: number) => {
                    const isObject = typeof opt !== 'string';
                    const text = isObject ? opt.text : opt;
                    const img = isObject ? opt.image_data : null;

                    return (
                        <Button 
                            key={idx}
                            variant="outlined" 
                            fullWidth 
                            onClick={() => handleQuizAnswer(idx)}
                            sx={{ 
                                display: 'flex',
                                flexDirection: img ? 'column' : 'row',
                                alignItems: img ? 'center' : 'center',
                                justifyContent: img ? 'center' : 'flex-start',
                                textAlign: img ? 'center' : 'left',
                                borderRadius: 4,
                                p: img ? 2 : 1.5,
                                borderWidth: 2,
                                borderColor: 'rgba(0,0,0,0.08)',
                                transition: 'all 0.2s',
                                '&:hover': { borderWidth: 2, bgcolor: 'rgba(78, 205, 196, 0.1)', borderColor: '#4ECDC4', transform: 'translateY(-2px)' }
                            }}
                        >
                            {!img && (
                                <Box component="span" sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    borderRadius: '50%', 
                                    bgcolor: 'rgba(0,0,0,0.05)', 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    mr: 2,
                                    color: '#777',
                                    fontWeight: 800
                                }}>
                                    {String.fromCharCode(65 + idx)}
                                </Box>
                            )}
                            {img && (
                                <Box sx={{ mb: 1.5 }}>
                                    <img src={img} alt="" style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover' }} />
                                </Box>
                            )}
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                {text}
                            </Typography>
                        </Button>
                    );
                })}
            </Box>
             <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 4, color: '#999', fontStyle: 'italic' }}>
                💡 Be quick! Response time counts towards your bonus score.
            </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Game;
