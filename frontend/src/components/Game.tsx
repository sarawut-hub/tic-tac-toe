import React, { useState, useEffect } from 'react';
import Square from './Square';
import { recordGameResult } from '../api';
import { Box, Typography, Button, Paper } from '@mui/material';

const Game: React.FC<{ user: any, onUpdateUser: (user: any) => void }> = ({ user, onUpdateUser }) => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (!isXNext && !winner) {
      const timer = setTimeout(() => {
        makeBotMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, board]); 

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

  const handleClick = (i: number) => {
    if (board[i] || winner || !isXNext) return;
    const newBoard = [...board];
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
    checkGameStatus(newBoard);
  };

  const makeBotMove = () => {
    if (calculateWinner(board) || !board.includes(null)) return;

    const availableMoves = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
    if (availableMoves.length === 0) return;
    
    // Simple random AI
    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    
    const newBoard = [...board];
    newBoard[randomMove] = 'O';
    setBoard(newBoard);
    setIsXNext(true);
    checkGameStatus(newBoard);
  };

  const checkGameStatus = (currentBoard: (string | null)[]) => {
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
    let apiResult: 'win' | 'lose' | 'draw' = 'draw';
    if (result === 'X') apiResult = 'win';
    if (result === 'O') apiResult = 'lose';
    
    const updatedUser = await recordGameResult(apiResult);
    onUpdateUser(updatedUser);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsXNext(true);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Typography variant="h5" gutterBottom>
        {winner ? (winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner}`) : `Current Turn: ${isXNext ? 'You (X)' : 'Bot (O)'}`}
      </Typography>
      
      <Box sx={{ width: 250, height: 250, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {board.map((val, idx) => (
          <Square key={idx} value={val} onClick={() => handleClick(idx)} />
        ))}
      </Box>

      {winner && (
        <Button
          variant="contained"
          color="primary"
          onClick={resetGame}
          sx={{ mt: 2 }}
        >
          Play Again
        </Button>
      )}

      <Paper elevation={3} sx={{ mt: 3, p: 2, minWidth: 200, textAlign: 'center' }}>
          <Typography variant="body1">Your Score: {user.score}</Typography>
          <Typography variant="body1">Current Streak: {user.current_streak}</Typography>
      </Paper>
    </Box>
  );
};

export default Game;
