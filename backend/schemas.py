from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    provider_id: str

class User(UserBase):
    id: int
    score: int
    current_streak: int
    is_admin: bool

    class Config:
        orm_mode = True

class ScoreUpdate(BaseModel):
    result: str # "win", "lose", "draw"
