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
import EditIcon from '@mui/icons-material/Edit';
import { fetchQuestions, createQuestion, deleteQuestion, updateQuestion } from '../api';

const QuestionManager: React.FC = () => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newQuestion, setNewQuestion] = useState({
        question_text: '',
        image_data: '',
        options: [
            { text: '', image_data: '' },
            { text: '', image_data: '' },
            { text: '', image_data: '' },
            { text: '', image_data: '' }
        ],
        correct_answer_index: 0
    });

    const loadQuestions = () => {
        fetchQuestions().then(setQuestions).catch(console.error);
    };

    useEffect(() => {
        loadQuestions();
    }, []);

    const handleOpen = (q?: any) => {
        if (q) {
            setEditingId(q.id);
            // Migrate options from string to object if needed
            const migratedOptions = q.options.map((opt: any) => 
                typeof opt === 'string' ? { text: opt, image_data: '' } : opt
            );
            setNewQuestion({
                question_text: q.question_text,
                image_data: q.image_data || '',
                options: migratedOptions,
                correct_answer_index: q.correct_answer_index
            });
        } else {
            setEditingId(null);
            setNewQuestion({
                question_text: '',
                image_data: '',
                options: [
                    { text: '', image_data: '' },
                    { text: '', image_data: '' },
                    { text: '', image_data: '' },
                    { text: '', image_data: '' }
                ],
                correct_answer_index: 0
            });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        if (!newQuestion.question_text || newQuestion.options.some(opt => !opt)) {
            alert("Please fill in all fields");
            return;
        }
        try {
            if (editingId) {
                await updateQuestion(editingId, newQuestion);
            } else {
                await createQuestion(newQuestion);
            }
            setOpen(false);
            loadQuestions();
        } catch (e) {
            console.error(e);
            alert("Failed to save question");
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

    const handleOptionTextChange = (idx: number, value: string) => {
        const newOptions = [...newQuestion.options];
        newOptions[idx] = { ...newOptions[idx], text: value };
        setNewQuestion({ ...newQuestion, options: newOptions });
    };

    const handleOptionImageChange = (idx: number, file?: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const newOptions = [...newQuestion.options];
            newOptions[idx] = { ...newOptions[idx], image_data: reader.result as string };
            setNewQuestion({ ...newQuestion, options: newOptions });
        };
        reader.readAsDataURL(file);
    };

    const handleOptionImageReset = (idx: number) => {
        const newOptions = [...newQuestion.options];
        newOptions[idx] = { ...newOptions[idx], image_data: '' };
        setNewQuestion({ ...newQuestion, options: newOptions });
    };

    return (
        <Box sx={{ mt: 4, width: '100%', maxWidth: 900 }}>
             <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" component="h2" fontWeight={800} color="primary">
                    Manage Quiz Questions 📝
                </Typography>
                <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>
                    Add Question ✨
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Question</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Image</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Options</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Answer</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {questions.map((q) => (
                            <TableRow key={q.id}>
                                <TableCell sx={{ maxWidth: 200, verticalAlign: 'top' }}>
                                    <Typography variant="body2">{q.question_text}</Typography>
                                </TableCell>
                                <TableCell>
                                    {q.image_data ? (
                                        <img src={q.image_data} alt="Q" style={{ width: 50, height: 50, borderRadius: 4, objectFit: 'cover' }} />
                                    ) : '-'}
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                    <Box component="ul" sx={{ m: 0, p: 0, pl: 2, fontSize: '0.8rem' }}>
                                        {q.options.map((opt: any, idx: number) => {
                                            const optText = typeof opt === 'string' ? opt : opt.text;
                                            const optImage = typeof opt === 'string' ? '' : opt.image_data;
                                            return (
                                                <Box component="li" key={idx} sx={{ 
                                                    fontWeight: idx === q.correct_answer_index ? 'bold' : 'normal',
                                                    color: idx === q.correct_answer_index ? 'success.main' : 'inherit',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    mb: 0.5
                                                }}>
                                                    {optText}
                                                    {optImage && <img src={optImage} alt="" style={{ width: 24, height: 24, borderRadius: 2, objectFit: 'cover' }} />}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </TableCell>
                                <TableCell>Option {q.correct_answer_index + 1}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleOpen(q)} color="info" size="small">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(q.id)} color="error" size="small">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {questions.length === 0 && (
                             <TableRow>
                                 <TableCell colSpan={5} align="center">No questions found</TableCell>
                             </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>{editingId ? "Edit Question" : "Add New Question"}</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField 
                            label="Question Text" 
                            fullWidth 
                            multiline
                            rows={2}
                            value={newQuestion.question_text}
                            onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                        />
                        <TextField 
                            label="Image URL or Base64" 
                            fullWidth 
                            value={newQuestion.image_data}
                            onChange={(e) => setNewQuestion({...newQuestion, image_data: e.target.value})}
                            placeholder="https://... or data:image/png;base64,..."
                        />
                        <Button variant="outlined" component="label" fullWidth sx={{ borderRadius: 2 }}>
                            Upload Image File 📤
                            <input 
                                type="file" 
                                hidden 
                                accept="image/*" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setNewQuestion({...newQuestion, image_data: reader.result as string});
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }} 
                            />
                        </Button>
                        {newQuestion.image_data && (
                            <Box sx={{ textAlign: 'center', p: 1, border: '1px dashed #ccc', borderRadius: 2 }}>
                                <Typography variant="caption" display="block" mb={1}>Preview:</Typography>
                                <img src={newQuestion.image_data} alt="Preview" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }} />
                            </Box>
                        )}
                        <FormControl component="fieldset" sx={{ mt: 1 }}>
                            <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>Options (Select the correct one)</FormLabel>
                            <RadioGroup 
                                value={newQuestion.correct_answer_index} 
                                onChange={(e) => setNewQuestion({...newQuestion, correct_answer_index: parseInt(e.target.value)})}
                            >
                                {newQuestion.options.map((opt: any, idx) => (
                                    <Box key={idx} sx={{ mb: 2, p: 1.5, border: '1px solid #eee', borderRadius: 3, bgcolor: '#fcfcfc' }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={opt.image_data ? 1 : 0}>
                                            <FormControlLabel value={idx} control={<Radio />} label="" sx={{ mr: 0 }} />
                                            <TextField 
                                                label={`Option ${idx + 1} Text`} 
                                                fullWidth 
                                                size="small"
                                                value={opt.text}
                                                onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                                            />
                                            <Button variant="outlined" component="label" size="small" sx={{ minWidth: 44, height: 40, p: 0, borderRadius: 2 }}>
                                                🖼️
                                                <input 
                                                    type="file" 
                                                    hidden 
                                                    accept="image/*" 
                                                    onChange={(e) => handleOptionImageChange(idx, e.target.files?.[0])}
                                                />
                                            </Button>
                                        </Box>
                                        {opt.image_data && (
                                            <Box display="flex" alignItems="center" gap={2} ml={5}>
                                                <img src={opt.image_data} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: '1px solid #ddd' }} />
                                                <Button size="small" color="error" variant="text" onClick={() => handleOptionImageReset(idx)} sx={{ fontSize: '0.7rem' }}>
                                                    Remove Image
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                            </RadioGroup>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" color="primary" sx={{ borderRadius: 2, px: 4 }}>Save Question ✨</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default QuestionManager;
