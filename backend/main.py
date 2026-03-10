from fastapi import FastAPI
from database import engine
import models
from routers import auth, game, sessions, questions
from fastapi.middleware.cors import CORSMiddleware
import os

models.Base.metadata.create_all(bind=engine)

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

@app.get("/")
def read_root():
    return {"message": "Tic-Tac-Toe API is running"}
