from fastapi import FastAPI
from database import engine
import models
from routers import auth, game, sessions, questions, question_sets
from fastapi.middleware.cors import CORSMiddleware
import os
from sqlalchemy.orm import Session
from database import SessionLocal

models.Base.metadata.create_all(bind=engine)

from sqlalchemy import inspect, text
def run_migrations():
    inspector = inspect(engine)
    db = SessionLocal()
    try:
        # Check questions table
        columns = [c['name'] for c in inspector.get_columns('questions')]
        if 'image_data' not in columns:
            db.execute(text("ALTER TABLE questions ADD COLUMN image_data TEXT"))
            db.commit()
            print("Added image_data column to questions")
            
        # Check game_sessions table
        columns = [c['name'] for c in inspector.get_columns('game_sessions')]
        if 'name' not in columns:
            db.execute(text("ALTER TABLE game_sessions ADD COLUMN name TEXT"))
            db.commit()
            print("Added name column to game_sessions")
        if 'question_set_id' not in columns:
            db.execute(text("ALTER TABLE game_sessions ADD COLUMN question_set_id INTEGER"))
            db.commit()
            print("Added question_set_id column to game_sessions")
    except Exception as e:
        print(f"Migration info: {e}")
    finally:
        db.close()

run_migrations()

def seed_questions():
    db = SessionLocal()
    try:
        if db.query(models.Question).count() == 0:
            questions = [
                {
                    "question_text": "Who is the legendary footballer often called 'The King of Football'?",
                    "options": ["Pele", "Diego Maradona", "Lionel Messi", "Cristiano Ronaldo"],
                    "correct_answer_index": 0
                },
                {
                    "question_text": "In which city is the famous 'Eiffel Tower' located?",
                    "options": ["London", "Berlin", "Paris", "Rome"],
                    "correct_answer_index": 2
                },
                {
                    "question_text": "What is the capital city of Thailand?",
                    "options": ["Chiang Mai", "Bangkok", "Phuket", "Ayutthaya"],
                    "correct_answer_index": 2
                },
                 {
                    "question_text": "Which planet is known as the 'Red Planet'?",
                    "options": ["Venus", "Mars", "Jupiter", "Saturn"],
                    "correct_answer_index": 1
                },
                {
                    "question_text": "Who wrote the play 'Romeo and Juliet'?",
                    "options": ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"],
                    "correct_answer_index": 1
                }
            ]
            for q in questions:
                db_q = models.Question(**q)
                db.add(db_q)
            db.commit()
            print("Successfully seeded initial questions!")
    finally:
        db.close()

seed_questions()

app = FastAPI()

ORIGINS = [
    "http://localhost:5173",
    "https://sarawut-hub.github.io",
    "https://tic-tac-toe-nwbp.onrender.com"
] # os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS, # ระบุเจาะจงแทน * เพื่อรองรับ allow_credentials=True
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(game.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(question_sets.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Tic-Tac-Toe API is running"}
