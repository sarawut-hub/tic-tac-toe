import React, { useEffect, useState } from 'react';
import { 
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
    IconButton, Chip, Checkbox, FormControlLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { fetchQuestionSets, createQuestionSet, updateQuestionSet, deleteQuestionSet, fetchQuestions } from '../api';

const QuestionSetManager: React.FC = () => {
    const [sets, setSets] = useState<any[]>([]);
    const [allQuestions, setAllQuestions] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [editingSet, setEditingSet] = useState<any>(null);
    const [newSet, setNewSet] = useState({ name: '', description: '', question_ids: [] as number[] });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [setsData, questionsData] = await Promise.all([
            fetchQuestionSets(),
            fetchQuestions()
        ]);
        setSets(setsData);
        setAllQuestions(questionsData);
    };

    const handleOpen = (set: any = null) => {
        if (set) {
            setEditingSet(set);
            setNewSet({ 
                name: set.name, 
                description: set.description || '', 
                question_ids: set.questions.map((q: any) => q.id) 
            });
        } else {
            setEditingSet(null);
            setNewSet({ name: '', description: '', question_ids: [] });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingSet(null);
    };

    const handleSave = async () => {
        try {
            if (editingSet) {
                await updateQuestionSet(editingSet.id, newSet);
            } else {
                await createQuestionSet(newSet);
            }
            loadData();
            handleClose();
        } catch (error) {
            console.error("Error saving question set", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this set?")) {
            await deleteQuestionSet(id);
            loadData();
        }
    };

    const toggleQuestion = (id: number) => {
        setNewSet(prev => {
            const isSelected = prev.question_ids.includes(id);
            if (isSelected) {
                return { ...prev, question_ids: prev.question_ids.filter(qid => qid !== id) };
            } else {
                return { ...prev, question_ids: [...prev.question_ids, id] };
            }
        });
    };

    return (
        <Box sx={{ mt: 4, width: '100%', maxWidth: 900, mx: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight={900} color="primary">Question Categories 📚</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: 3, fontWeight: 700 }}>
                    Create New Set
                </Button>
            </Box>

            <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: 5, overflow: 'hidden' }} elevation={0}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                            <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Questions</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sets.map((set) => (
                            <TableRow key={set.id}>
                                <TableCell sx={{ fontWeight: 700 }}>{set.name}</TableCell>
                                <TableCell color="text.secondary">{set.description || '-'}</TableCell>
                                <TableCell>
                                    <Chip label={`${set.questions.length} Questions`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => handleOpen(set)}><EditIcon /></IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(set.id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 5, p: 2 } }}>
                <DialogTitle sx={{ fontWeight: 900 }}>{editingSet ? 'Edit Category' : 'New Category'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Set Name"
                        fullWidth
                        variant="outlined"
                        value={newSet.name}
                        onChange={(e) => setNewSet({ ...newSet, name: e.target.value })}
                        sx={{ mt: 2, mb: 2 }}
                        InputProps={{ sx: { borderRadius: 3 } }}
                    />
                    <TextField
                        margin="dense"
                        label="Description (Optional)"
                        fullWidth
                        variant="outlined"
                        value={newSet.description}
                        onChange={(e) => setNewSet({ ...newSet, description: e.target.value })}
                        sx={{ mb: 3 }}
                        InputProps={{ sx: { borderRadius: 3 } }}
                    />
                    
                    <Typography variant="subtitle1" fontWeight={800} mb={1}>Select Questions:</Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 3, p: 2 }}>
                        {allQuestions.map(q => (
                            <FormControlLabel
                                key={q.id}
                                control={
                                    <Checkbox 
                                        checked={newSet.question_ids.includes(q.id)} 
                                        onChange={() => toggleQuestion(q.id)} 
                                    />
                                }
                                label={q.question_text}
                                sx={{ display: 'block', mb: 1 }}
                            />
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleClose} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={!newSet.name} sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}>
                        {editingSet ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default QuestionSetManager;
