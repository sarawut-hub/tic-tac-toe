from fastapi import FastAPI
from database import engine
import models
from routers import auth, game
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173", # Vite frontend
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(game.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Tic-Tac-Toe API is running"}
