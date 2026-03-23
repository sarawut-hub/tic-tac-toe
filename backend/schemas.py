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
    total_time_taken: float = 0.0

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
    image_data: Optional[str] = None
    options: List[Any]
    correct_answer_index: int

class Question(QuestionCreate):
    id: int
    
    class Config:
        orm_mode = True

class QuestionSetBase(BaseModel):
    name: str
    description: Optional[str] = None

class QuestionSetCreate(QuestionSetBase):
    question_ids: Optional[List[int]] = []

class QuestionSet(QuestionSetBase):
    id: int
    questions: List[Question] = []
    
    class Config:
        orm_mode = True

class SessionCreate(BaseModel):
    name: Optional[str] = None
    time_limit_minutes: Optional[int] = None
    question_ids: Optional[List[int]] = []
    question_set_id: Optional[int] = None

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

class SessionStatusResponse(BaseModel):
    id: int
    code: str
    name: Optional[str] = None
    status: str
    host_id: int
    time_limit_minutes: Optional[int] = None
    question_ids: Optional[List[int]] = []
    question_set_id: Optional[int] = None
    players: List[SessionPlayerResponse] = []
    
    class Config:
        orm_mode = True

class GameResultResponse(BaseModel):
    user: User
    question: Optional[Question] = None # Question for quiz
    session_score: Optional[int] = None
    state: Optional[Any] = None # Current game state
    result: Optional[str] = None
    is_correct: Optional[bool] = None

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
