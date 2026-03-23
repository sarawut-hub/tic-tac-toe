import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Button
} from '@mui/material';
import { fetchLeaderboard, resetGameStats } from '../api';

const Leaderboard: React.FC<{ user: any, refreshKey?: number, onReset?: () => void }> = ({ user, refreshKey, onReset }) => {
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchLeaderboard().then(setUsers);
    }, [refreshKey]);

    const handleReset = async () => {
        if(confirm("Are you sure you want to reset the leaderboard for EVERYONE?")) {
            await resetGameStats();
            if (onReset) onReset();
            else fetchLeaderboard().then(setUsers);
        }
    }

    return (
        <Box sx={{ mt: 4, width: '100%', maxWidth: 650, mx: 'auto' }}>
            <Typography variant="h4" component="h2" gutterBottom align="center" fontWeight={900} color="primary" sx={{ mb: 4, letterSpacing: -0.5 }}>
                Hall of Fame 🏆
            </Typography>
            <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: 5, overflow: 'hidden' }} elevation={0}>
                <Table aria-label="leaderboard table">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                            <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Rank</TableCell>
                            <TableCell align="left" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Player</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Score</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Streak</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((u, idx) => {
                            const isTop3 = idx < 3;
                            const badge = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                            return (
                                <TableRow key={u.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell align="center">
                                        {badge ? (
                                            <Typography variant="h5" component="span">{badge}</Typography>
                                        ) : (
                                            <Typography variant="body1" fontWeight={700} color="text.secondary">{idx + 1}</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="left">
                                        <Typography variant="body1" fontWeight={isTop3 ? 800 : 700} color={isTop3 ? "primary" : "text.primary"}>
                                            {u.username}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body1" fontWeight={800} color="secondary">{u.score}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                            {u.current_streak} {u.current_streak >= 3 ? "🔥" : "✨"}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            {user && user.is_admin && (
                <Box mt={4} display="flex" justifyContent="center">
                    <Button variant="text" color="error" onClick={handleReset} sx={{ fontWeight: 700, borderRadius: 2 }}>
                        Clear All Stats 🛑
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default Leaderboard;
