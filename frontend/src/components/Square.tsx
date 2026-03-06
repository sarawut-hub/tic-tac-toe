import React from 'react';
import { Button } from '@mui/material';

interface SquareProps {
  value: string | null;
  onClick: () => void;
}

const Square: React.FC<SquareProps> = ({ value, onClick }) => {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      sx={{
        width: 80,
        height: 80,
        fontSize: '2rem',
        fontWeight: 'bold',
        color: value === 'X' ? 'primary.main' : 'secondary.main',
        borderColor: 'grey.300',
        '&:hover': {
          backgroundColor: 'grey.100',
        },
      }}
    >
      {value}
    </Button>
  );
};

export default Square;
