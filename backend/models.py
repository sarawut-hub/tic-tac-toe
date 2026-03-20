from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(String, unique=True, index=True) # ID from OAuth provider
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    score = Column(Integer, default=0)
    current_streak = Column(Integer, default=0) # Consecutive wins against bot
    answered_questions = Column(JSON, default=[]) # List of question IDs answered
    bot_difficulty = Column(Integer, default=1) # Difficulty level 1-5
    is_admin = Column(Boolean, default=False)
    active_game_state = Column(JSON, nullable=True) # { board, is_x_next, startTime }

class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"))
    
    status = Column(String, default="WAITING") # WAITING, ACTIVE, ENDED
    
    time_limit_minutes = Column(Integer, nullable=True)
    question_ids = Column(JSON, nullable=True)
    
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    host = relationship("User", foreign_keys=[host_id])
    players = relationship("SessionPlayer", back_populates="session")

class SessionPlayer(Base):
    __tablename__ = "session_players"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    session_score = Column(Integer, default=0)
    avatar_config = Column(JSON, nullable=True) # JSON config for avatar
    active_game_state = Column(JSON, nullable=True) # { board, is_x_next, startTime }
    
    session = relationship("GameSession", back_populates="players")
    user = relationship("User")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(String)
    options = Column(JSON) # List of strings [ "A", "B", "C", "D" ]
    correct_answer_index = Column(Integer)
