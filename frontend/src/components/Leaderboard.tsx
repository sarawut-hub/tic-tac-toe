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
  Box
} from '@mui/material';
import { fetchLeaderboard } from '../api';

const Leaderboard: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchLeaderboard().then(setUsers);
    }, [refreshKey]);

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
        </Box>
    );
};

export default Leaderboard;
