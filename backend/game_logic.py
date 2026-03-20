import random
from typing import List, Optional, Tuple

def calculate_winner(squares: List[Optional[str]]) -> Optional[str]:
    lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ]
    for line in lines:
        a, b, c = line
        if squares[a] and squares[a] == squares[b] and squares[a] == squares[c]:
            return squares[a]
    return None

def check_winner_for_move(squares: List[Optional[str]], player: str) -> Optional[int]:
    lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ]
    for line in lines:
        a, b, c = line
        if squares[a] == player and squares[b] == player and squares[c] is None: return c
        if squares[a] == player and squares[c] == player and squares[b] is None: return b
        if squares[b] == player and squares[c] == player and squares[a] is None: return a
    return None

def make_bot_move(board: List[Optional[str]], difficulty: int) -> Optional[int]:
    if calculate_winner(board) or None not in board:
        return None
    
    available_moves = [i for i, val in enumerate(board) if val is None]
    if not available_moves:
        return None
    
    move = None
    # Level 2+: Block player (X)
    if difficulty >= 2:
        move = check_winner_for_move(board, 'X')
        
    # Level 3+: Try to win (O)
    if difficulty >= 3 and move is None:
        move = check_winner_for_move(board, 'O')
        
    if move is None:
        move = random.choice(available_moves)
        
    return move
