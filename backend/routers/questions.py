from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import Base
import models, schemas
from typing import List, Optional
from .auth import get_current_user, get_db

router = APIRouter()

@router.post("/questions/", response_model=schemas.Question)
def create_question(question: schemas.QuestionCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_question = models.Question(
        question_text=question.question_text, 
        image_data=question.image_data,
        options=question.options, 
        correct_answer_index=question.correct_answer_index
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

@router.get("/questions/", response_model=List[schemas.Question])
def get_questions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    questions = db.query(models.Question).offset(skip).limit(limit).all()
    return questions

@router.put("/questions/{question_id}", response_model=schemas.Question)
def update_question(question_id: int, question: schemas.QuestionCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
         raise HTTPException(status_code=404, detail="Question not found")
    
    db_question.question_text = question.question_text
    db_question.image_data = question.image_data
    db_question.options = question.options
    db_question.correct_answer_index = question.correct_answer_index
    
    db.commit()
    db.refresh(db_question)
    return db_question

@router.delete("/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
         raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(db_question)
    db.commit()
    return {"message": "Question deleted successfully"}
