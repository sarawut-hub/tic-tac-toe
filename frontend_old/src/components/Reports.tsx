import React, { useEffect, useState } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Button, Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { getSessionHistory, getSessionPlayers } from '../api';
import Podium from './Podium';

const Reports: React.FC = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const data = await getSessionHistory();
        setHistory(data);
    };

    const handleViewReport = async (session: any) => {
        setLoading(true);
        try {
            const playersData = await getSessionPlayers(session.code);
            setPlayers(playersData);
            setSelectedSession(session);
        } catch (error) {
            console.error("Error loading report", error);
        } finally {
            setLoading(false);
        }
    };

    if (selectedSession) {
        return (
            <Box>
                <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight={900}>Report: {selectedSession.name || selectedSession.code}</Typography>
                    <Button variant="outlined" onClick={() => setSelectedSession(null)} sx={{ borderRadius: 3 }}>Back to List</Button>
                </Box>
                <Podium players={players} isAdmin onClose={() => setSelectedSession(null)} />
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 4, width: '100%', maxWidth: 1000, mx: 'auto' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                <Box display="flex" alignItems="center">
                    <AssessmentIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h4" fontWeight={900} color="primary">Session Reports 📊</Typography>
                </Box>
                <Button 
                    variant="outlined" 
                    onClick={loadHistory}
                    disabled={loading}
                    sx={{ borderRadius: 3, fontWeight: 'bold' }}
                >
                    Refresh 🔄
                </Button>
            </Box>

            <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: 5, overflow: 'hidden' }} elevation={0}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                            <TableCell sx={{ fontWeight: 800 }}>Session Name / Code</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Players</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    No reports found. Host a game to see results here!
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((session) => (
                                <TableRow key={session.id} hover sx={{ transition: 'background-color 0.2s' }}>
                                    <TableCell>
                                        <Typography fontWeight={700}>{session.name || 'Untitled Session'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{session.code}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(session.created_at).toLocaleDateString()} {new Date(session.created_at).toLocaleDateString() === new Date().toLocaleDateString() ? '(Today)' : ''}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={session.status} 
                                            size="small" 
                                            color={session.status === 'ENDED' ? 'default' : session.status === 'ACTIVE' ? 'success' : 'primary'}
                                            sx={{ fontWeight: 700, borderRadius: 2 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {session.players?.length || 0} Registered
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button 
                                            variant="contained" 
                                            size="small"
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => handleViewReport(session)}
                                            disabled={loading}
                                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                                        >
                                            View Results
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Reports;
