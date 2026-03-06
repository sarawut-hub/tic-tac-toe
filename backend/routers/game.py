from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas
from typing import List
from .auth import get_current_user, get_db

router = APIRouter()

@router.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

@router.post("/game/result", response_model=schemas.User)
def record_game_result(score_update: schemas.ScoreUpdate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    user = current_user # Use authenticated user
    
    if score_update.result == "win":
        user.score += 1
        user.current_streak += 1
        if user.current_streak == 3:
            user.score += 1 # Bonus point
            user.current_streak = 0 # Reset streak
    elif score_update.result == "lose":
        user.score -= 1
        user.current_streak = 0 # Reset streak
    else:
        pass # Draw, do nothing or handle differently

    db.commit()
    db.refresh(user)
    return user

@router.get("/leaderboard", response_model=List[schemas.User])
def get_leaderboard(db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.score.desc()).all()
    return users
