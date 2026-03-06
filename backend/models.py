from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(String, unique=True, index=True) # ID from OAuth provider
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    score = Column(Integer, default=0)
    current_streak = Column(Integer, default=0) # Consecutive wins against bot
    is_admin = Column(Boolean, default=False)
