from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas
from typing import List
from .auth import get_current_user, get_db
import random
import game_logic
import time
from websocket_manager import manager

router = APIRouter()

@router.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

@router.post("/game/move", response_model=schemas.GameResultResponse)
async def make_move(move: schemas.MoveRequest, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    user = current_user
    session_score = None
    
    # Get current state
    target_obj = user
    if move.session_code:
        session = db.query(models.GameSession).filter(models.GameSession.code == move.session_code).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        player = db.query(models.SessionPlayer).filter(
            models.SessionPlayer.session_id == session.id,
            models.SessionPlayer.user_id == user.id
        ).first()
        if not player:
            raise HTTPException(status_code=404, detail="Player not in session")
        target_obj = player

    # Initialize state if empty
    state = target_obj.active_game_state
    if not state:
        state = {
            "board": [None] * 9,
            "is_x_next": True,
            "startTime": time.time()
        }

    board = state["board"]
    if board[move.position] is not None or not state["is_x_next"]:
        raise HTTPException(status_code=400, detail="Invalid move")

    # Player Move
    board[move.position] = 'X'
    winner = game_logic.calculate_winner(board)
    
    if winner == 'X':
        # Player Won
        result_pkg = await handle_game_end("win", user, db, board, move.session_code)
        target_obj.active_game_state = None
        db.commit()
        return result_pkg
    
    if None not in board:
        # Draw
        result_pkg = await handle_game_end("draw", user, db, board, move.session_code)
        target_obj.active_game_state = None
        db.commit()
        return result_pkg

    # Bot Move
    bot_move = game_logic.make_bot_move(board, user.bot_difficulty)
    if bot_move is not None:
        board[bot_move] = 'O'
    
    winner = game_logic.calculate_winner(board)
    if winner == 'O':
        # Bot Won
        result_pkg = await handle_game_end("lose", user, db, board, move.session_code)
        target_obj.active_game_state = None
        db.commit()
        return result_pkg
    
    if None not in board:
        # Draw
        result_pkg = await handle_game_end("draw", user, db, board, move.session_code)
        target_obj.active_game_state = None
        db.commit()
        return result_pkg

    # Update state - Create a NEW dict and use flag_modified to ensure SQLAlchemy detects change
    new_state = {
        "board": list(board), # Create a copy of the list
        "is_x_next": True,
        "startTime": state.get("startTime", time.time())
    }
    target_obj.active_game_state = new_state
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(target_obj, "active_game_state")
    
    db.commit()
    
    return {
        "user": user,
        "state": new_state
    }

async def handle_game_end(result: str, user: models.User, db: Session, board: List[Optional[str]] = None, session_code: str = None):
    session_score = None
    question_data = None
    state = None
    if board:
        state = {
            "board": board,
            "is_x_next": False,
            "winner": result
        }
    
    if result == "win":
        user.score += 1
        user.current_streak += 1
        if user.current_streak == 3:
            user.score += 1 
            user.current_streak = 0
            if user.bot_difficulty < 5:
                user.bot_difficulty += 1
        
        # Quiz chance
        if random.random() < 0.3:
            answered = user.answered_questions if user.answered_questions else []
            all_q = db.query(models.Question).all()
            available_q = [q for q in all_q if q.id not in answered]
            if not available_q:
                user.answered_questions = []
                available_q = all_q
            if available_q:
                selected_q = random.choice(available_q)
                original_options = list(selected_q.options)
                shuffled_options = random.sample(original_options, len(original_options))
                original_correct_text = original_options[selected_q.correct_answer_index]
                new_correct_index = shuffled_options.index(original_correct_text)
                question_data = schemas.Question(
                    id=selected_q.id,
                    question_text=selected_q.question_text,
                    options=shuffled_options,
                    correct_answer_index=new_correct_index 
                )
    elif result == "lose":
        user.score -= 1
        user.current_streak = 0
        if user.bot_difficulty > 1:
            user.bot_difficulty -= 1

    if session_code:
        session = db.query(models.GameSession).filter(models.GameSession.code == session_code).first()
        if session and session.status == "ACTIVE":
             player = db.query(models.SessionPlayer).filter(
                 models.SessionPlayer.session_id == session.id,
                 models.SessionPlayer.user_id == user.id
             ).first()
             if player:
                if result == "win":
                    player.session_score += 1 
                session_score = player.session_score
                
                # Notify via WebSocket
                await manager.broadcast({
                    "type": "SCORE_UPDATE",
                    "data": {"user_id": user.id, "score": session_score}
                }, session_code)

    return {
        "user": user,
        "session_score": session_score,
        "question": question_data,
        "result": result,
        "state": state
    }

@router.post("/game/result", response_model=schemas.GameResultResponse)
async def record_game_result(score_update: schemas.ScoreUpdate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    target_obj = current_user
    if score_update.session_code:
        session = db.query(models.GameSession).filter(models.GameSession.code == score_update.session_code).first()
        if session:
            player = db.query(models.SessionPlayer).filter(
                models.SessionPlayer.session_id == session.id,
                models.SessionPlayer.user_id == current_user.id
            ).first()
            if player:
                target_obj = player
    
    board = None
    if target_obj.active_game_state:
        board = target_obj.active_game_state.get("board")
        
    return await handle_game_end(score_update.result, current_user, db, board, score_update.session_code)

@router.post("/game/quiz_answer", response_model=schemas.GameResultResponse)
async def submit_quiz_answer(answer: schemas.QuizAnswerSubmit, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    user = current_user
    question = db.query(models.Question).filter(models.Question.id == answer.question_id).first()
    session_score = None
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    correct_text = question.options[question.correct_answer_index]
    
    if answer.answer_text == correct_text:
        time_bonus = 0
        if answer.time_taken:
            time_bonus = max(10, 100 - int(answer.time_taken))
        else:
            time_bonus = 100
            
        user.score += time_bonus
        
        current_answered = list(user.answered_questions) if user.answered_questions else []
        if question.id not in current_answered:
            current_answered.append(question.id)
            user.answered_questions = current_answered
            
        if answer.session_code:
            session = db.query(models.GameSession).filter(models.GameSession.code == answer.session_code).first()
            if session and session.status == "ACTIVE":
                player = db.query(models.SessionPlayer).filter(
                    models.SessionPlayer.session_id == session.id,
                    models.SessionPlayer.user_id == user.id
                ).first()
                if player:
                    player.session_score += time_bonus
                    session_score = player.session_score
                    
                    # Notify via WebSocket
                    await manager.broadcast({
                        "type": "SCORE_UPDATE",
                        "data": {"user_id": user.id, "score": session_score}
                    }, answer.session_code)
    
    db.commit()
    db.refresh(user)
    
    return {
        "user": user,
        "session_score": session_score,
        "question": None,
        "is_correct": answer.answer_text == correct_text
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
