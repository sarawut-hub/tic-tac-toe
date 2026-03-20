from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from typing import List
from .auth import get_current_user, get_db

router = APIRouter(tags=["Question Sets"])

@router.post("/question-sets/", response_model=schemas.QuestionSet)
def create_question_set(question_set: schemas.QuestionSetCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_set = models.QuestionSet(name=question_set.name, description=question_set.description)
    if question_set.question_ids:
        questions = db.query(models.Question).filter(models.Question.id.in_(question_set.question_ids)).all()
        db_set.questions = questions
        
    db.add(db_set)
    db.commit()
    db.refresh(db_set)
    return db_set

@router.get("/question-sets/", response_model=List[schemas.QuestionSet])
def get_question_sets(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.QuestionSet).all()

@router.put("/question-sets/{set_id}", response_model=schemas.QuestionSet)
def update_question_set(set_id: int, question_set: schemas.QuestionSetCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_set = db.query(models.QuestionSet).filter(models.QuestionSet.id == set_id).first()
    if not db_set:
        raise HTTPException(status_code=404, detail="Question set not found")
        
    db_set.name = question_set.name
    db_set.description = question_set.description
    
    if question_set.question_ids is not None:
        questions = db.query(models.Question).filter(models.Question.id.in_(question_set.question_ids)).all()
        db_set.questions = questions
        
    db.commit()
    db.refresh(db_set)
    return db_set

@router.delete("/question-sets/{set_id}")
def delete_question_set(set_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_set = db.query(models.QuestionSet).filter(models.QuestionSet.id == set_id).first()
    if not db_set:
        raise HTTPException(status_code=404, detail="Question set not found")
        
    db.delete(db_set)
    db.commit()
    return {"message": "Question set deleted successfully"}
