from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
import httpx
import os
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from datetime import datetime, timedelta
from jose import jwt
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:8000/auth/callback/github" # Adjust based on environment

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception: # catch general jwt errors
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.get("/login/github")
async def login_github():
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=read:user"
    )

@router.get("/callback/github")
async def callback_github(code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": REDIRECT_URI,
            },
        )
        data = response.json()
        access_token = data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token from GitHub")

        # Get user info
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_data = user_response.json()
        github_id = str(user_data["id"])
        username = user_data["login"]
        email = user_data.get("email")

        # Check if user exists
        user = db.query(models.User).filter(models.User.provider_id == github_id).first()
        if not user:
            user = models.User(provider_id=github_id, username=username, email=email)
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create JWT
        token = create_access_token({"sub": user.username, "id": user.id})
        
        # Redirect to frontend with token
        response = RedirectResponse(url="http://localhost:5173/") # Vite frontend
        response.set_cookie(key="access_token", value=token, httponly=True, samesite='lax', secure=False) # secure=False for localhost
        return response
