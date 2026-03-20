from pydantic import BaseModel
from typing import Optional, List, Any
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    provider_id: str

class User(UserBase):
    id: int
    score: int
    current_streak: int
    bot_difficulty: int = 1
    is_admin: bool

    class Config:
        orm_mode = True

class ScoreUpdate(BaseModel):
    result: str # "win", "lose", "draw"
    time_taken: Optional[float] = None
    session_code: Optional[str] = None

class QuizAnswerSubmit(BaseModel):
    question_id: int
    answer_text: str
    time_taken: Optional[float] = None
    session_code: Optional[str] = None

class EmployeeLogin(BaseModel):
    employee_id: str

class QuestionCreate(BaseModel):
    question_text: str
    options: List[str]
    correct_answer_index: int

class Question(QuestionCreate):
    id: int
    
    class Config:
        orm_mode = True

class SessionCreate(BaseModel):
    time_limit_minutes: Optional[int] = None
    question_ids: Optional[List[int]] = []

class SessionStatusResponse(BaseModel):
    id: int
    code: str
    status: str
    host_id: int
    time_limit_minutes: Optional[int] = None
    question_ids: Optional[List[int]] = []
    
    class Config:
        orm_mode = True

class AvatarUpdate(BaseModel):
    config: Any # JSON config

class SessionPlayerResponse(BaseModel):
    id: int
    user_id: int
    user: User
    session_score: int
    avatar_config: Optional[Any] = None
    
    class Config:
        orm_mode = True

class GameResultResponse(BaseModel):
    user: User
    question: Optional[Question] = None # Question for quiz
    session_score: Optional[int] = None
    state: Optional[Any] = None # Current game state

class MoveRequest(BaseModel):
    position: int # 0-8
    session_code: Optional[str] = None

class GameState(BaseModel):
    board: List[Optional[str]]
    is_x_next: bool
    winner: Optional[str] = None
    startTime: Optional[float] = None

class WebSocketMessage(BaseModel):
    type: str # "JOIN", "START", "END", "SCORE_UPDATE"
    data: Any
