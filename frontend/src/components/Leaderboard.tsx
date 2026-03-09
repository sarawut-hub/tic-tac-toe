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
        <Box sx={{ mt: 4, width: '100%', maxWidth: 600 }}>
            <Typography variant="h5" component="h2" gutterBottom align="center">
                Leaderboard
            </Typography>
            <TableContainer component={Paper}>
                <Table aria-label="leaderboard table">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>User</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Score</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Streak</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((u, idx) => (
                            <TableRow key={u.id}>
                                <TableCell align="center">{idx + 1}</TableCell>
                                <TableCell align="center">{u.username}</TableCell>
                                <TableCell align="center">{u.score}</TableCell>
                                <TableCell align="center">{u.current_streak}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {user && user.is_admin && (
                <Box mt={2} display="flex" justifyContent="center">
                    <Button variant="contained" color="secondary" onClick={handleReset}>
                        Reset Leaderboard
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default Leaderboard;
