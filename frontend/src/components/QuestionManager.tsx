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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchQuestions, createQuestion, deleteQuestion } from '../api';

const QuestionManager: React.FC = () => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        question_text: '',
        options: ['', '', '', ''],
        correct_answer_index: 0
    });

    const loadQuestions = () => {
        fetchQuestions().then(setQuestions).catch(console.error);
    };

    useEffect(() => {
        loadQuestions();
    }, []);

    const handleCreate = async () => {
        if (!newQuestion.question_text || newQuestion.options.some(opt => !opt)) {
            alert("Please fill in all fields");
            return;
        }
        try {
            await createQuestion(newQuestion);
            setOpen(false);
            setNewQuestion({
                question_text: '',
                options: ['', '', '', ''],
                correct_answer_index: 0
            });
            loadQuestions();
        } catch (e) {
            console.error(e);
            alert("Failed to create question");
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Delete this question?")) {
            try {
                await deleteQuestion(id);
                loadQuestions();
            } catch (e) {
                console.error(e);
                alert("Failed to delete question");
            }
        }
    };

    const handleOptionChange = (idx: number, value: string) => {
        const newOptions = [...newQuestion.options];
        newOptions[idx] = value;
        setNewQuestion({ ...newQuestion, options: newOptions });
    };

    return (
        <Box sx={{ mt: 4, width: '100%', maxWidth: 800 }}>
             <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" component="h2">
                    Question Management
                </Typography>
                <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
                    Add Question
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Question</TableCell>
                            <TableCell>Options</TableCell>
                            <TableCell>Answer</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {questions.map((q) => (
                            <TableRow key={q.id}>
                                <TableCell>{q.question_text}</TableCell>
                                <TableCell>
                                    <ul>
                                        {q.options.map((opt: string, idx: number) => (
                                            <li key={idx} style={{ 
                                                fontWeight: idx === q.correct_answer_index ? 'bold' : 'normal',
                                                color: idx === q.correct_answer_index ? 'green' : 'inherit'
                                            }}>
                                                {opt}
                                            </li>
                                        ))}
                                    </ul>
                                </TableCell>
                                <TableCell>Option {q.correct_answer_index + 1}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleDelete(q.id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {questions.length === 0 && (
                             <TableRow>
                                 <TableCell colSpan={4} align="center">No questions found</TableCell>
                             </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Question</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField 
                            label="Question Text" 
                            fullWidth 
                            value={newQuestion.question_text}
                            onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                        />
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Options (Select the correct answer)</FormLabel>
                            <RadioGroup 
                                value={newQuestion.correct_answer_index} 
                                onChange={(e) => setNewQuestion({...newQuestion, correct_answer_index: parseInt(e.target.value)})}
                            >
                                {newQuestion.options.map((opt, idx) => (
                                    <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
                                        <FormControlLabel value={idx} control={<Radio />} label="" sx={{ mr: 0 }} />
                                        <TextField 
                                            label={`Option ${idx + 1}`} 
                                            fullWidth 
                                            size="small"
                                            value={opt}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        />
                                    </Box>
                                ))}
                            </RadioGroup>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} variant="contained" color="primary">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default QuestionManager;
