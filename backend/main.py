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
import logging

# Basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migrations():
    # Show database type (obfuscated)
    db_type = engine.url.drivername
    logger.info(f"Connecting to database: {db_type}")
    
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



app = FastAPI()

# We use allow_origin_regex=".*" to allow any origin dynamically
# because browsers reject allow_origins=["*"] when allow_credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*", 
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
