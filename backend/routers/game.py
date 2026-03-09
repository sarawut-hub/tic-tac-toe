from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas
from typing import List
from .auth import get_current_user, get_db
import random

router = APIRouter()

@router.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

@router.post("/game/result", response_model=schemas.GameResultResponse)
def record_game_result(score_update: schemas.ScoreUpdate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    user = current_user # Use authenticated user
    session_score = None
    question_data = None
    
    # Update regular score
    if score_update.result == "win":
        user.score += 1
        user.current_streak += 1
        if user.current_streak == 3:
            user.score += 1 # Bonus point
            user.current_streak = 0 # Reset streak
        
        # Chance to get a quiz question (30% -> increased to 100% for testing? No, stick to random or ask user if they want always)
        # User requested modification to logic, imply keeping chance but changing *what* is returned.
        # But maybe they want it always? "Scores +100 and Randomize..."
        # Let's keep 30% chance.
        if random.random() < 0.3:
            # Filter already answered questions
            answered = user.answered_questions if user.answered_questions else []
            # Query all questions
            all_q = db.query(models.Question).all()
            available_q = [q for q in all_q if q.id not in answered]
            
            if not available_q:
                # Reset answered if all done
                user.answered_questions = []
                available_q = all_q
                
            if available_q:
                selected_q = random.choice(available_q)
                
                # Shuffle options for display ONLY (do not save to DB)
                # Create a Pydantic model instance manually to control options
                original_options = list(selected_q.options) # Copy
                shuffled_options = random.sample(original_options, len(original_options))
                
                # We need to construct a schema.Question object
                # But schema.Question requires correct_answer_index.
                # If we shuffle, the index changes.
                # Since frontend validates via backend submit_answer now (using text),
                # we can send a dummy index or calculate new index.
                # Let's calculate new index just in case frontend relies on it for something (though it shouldn't cheat).
                original_correct_text = original_options[selected_q.correct_answer_index]
                new_correct_index = shuffled_options.index(original_correct_text)
                
                question_data = schemas.Question(
                    id=selected_q.id,
                    question_text=selected_q.question_text,
                    options=shuffled_options,
                    correct_answer_index=new_correct_index 
                )


    elif score_update.result == "lose":
        user.score -= 1
        user.current_streak = 0 # Reset streak
    else:
        pass # Draw

    # Handle Session Score if session_code provided
    if score_update.session_code:
        session = db.query(models.GameSession).filter(models.GameSession.code == score_update.session_code).first()
        if session and session.status == "ACTIVE":
             player = db.query(models.SessionPlayer).filter(
                 models.SessionPlayer.session_id == session.id,
                 models.SessionPlayer.user_id == user.id
             ).first()
             
             if player:
                if score_update.result == "win":
                    player.session_score += 1 
                elif score_update.result == "lose":
                    pass 
                
                session_score = player.session_score
             
             # Session might have questions?
             if session.question_ids and question_data is None:
                  # Maybe implement specific session question logic later
                  pass

    db.commit()
    db.refresh(user)
    
    return {
        "user": user, 
        "session_score": session_score,
        "question": question_data 
    }

@router.post("/game/quiz_answer", response_model=schemas.GameResultResponse)
def submit_quiz_answer(answer: schemas.QuizAnswerSubmit, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    user = current_user
    question = db.query(models.Question).filter(models.Question.id == answer.question_id).first()
    session_score = None
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # Get correct answer text
    # Assuming options are stored as list of strings in DB
    correct_text = question.options[question.correct_answer_index]
    
    if answer.answer_text == correct_text:
        # Correct answer
        user.score += 100 # +100 as requested
        
        # Mark as answered
        current_answered = list(user.answered_questions) if user.answered_questions else []
        if question.id not in current_answered:
            current_answered.append(question.id)
            user.answered_questions = current_answered
            
        # Also update session score if needed
        if answer.session_code:
            session = db.query(models.GameSession).filter(models.GameSession.code == answer.session_code).first()
            if session and session.status == "ACTIVE":
                player = db.query(models.SessionPlayer).filter(
                    models.SessionPlayer.session_id == session.id,
                    models.SessionPlayer.user_id == user.id
                ).first()
                if player:
                    player.session_score += 100 # +100 to session score too
                    session_score = player.session_score
    
    db.commit()
    db.refresh(user)
    
    return {
        "user": user,
        "session_score": session_score,
        "question": None
    }


@router.get("/leaderboard", response_model=List[schemas.User])
def get_leaderboard(db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.score.desc()).all()
    return users

@router.post("/admin/reset", status_code=status.HTTP_200_OK)
def reset_leaderboard(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can reset the leaderboard")
        
    # 1. Delete all session players (clear session history)
    db.query(models.SessionPlayer).delete()
    
    # 2. Delete all game sessions (clear sessions)
    db.query(models.GameSession).delete()
    
    # 3. Delete all users EXCEPT the current admin/user invoking the command
    db.query(models.User).filter(models.User.id != current_user.id).delete()
    
    # 4. Reset the current user's score
    current_user_model = db.query(models.User).filter(models.User.id == current_user.id).first()
    if current_user_model:
        current_user_model.score = 0
        current_user_model.current_streak = 0
    
    db.commit()
    return {"message": "Leaderboard and users reset successfully (except you)"}
