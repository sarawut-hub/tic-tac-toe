from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
import httpx
import os
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from datetime import datetime, timedelta
from jose import jwt
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class EmployeeLogin(BaseModel):
    employee_id: str

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:8000/auth/callback/github" # Adjust based on environment

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = "http://localhost:8000/auth/callback/google"

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
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

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

@router.post("/login/employee")
def login_employee(login_data: EmployeeLogin, response: Response, db: Session = Depends(get_db)):
    employee_id = login_data.employee_id
    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID is required")
    
    # Prefix to distinguish from OAuth
    provider_id = f"employee_{employee_id}"
    username = f"emp_{employee_id}"
    
    # Simple check for admin: if employee ID is 'admin' or '9999'
    is_admin = (employee_id.lower() == 'admin' or employee_id == '9999')

    user = db.query(models.User).filter(models.User.provider_id == provider_id).first()
    if not user:
        # Create new user
        user = models.User(
            provider_id=provider_id,
            username=username,
            email=None, 
            score=0,
            current_streak=0,
            is_admin=is_admin,
            # bot_difficulty=1, total_games=0, wins=0 # defaults
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif is_admin and not user.is_admin:
        # Promote existing user if condition changes
        user.is_admin = True
        db.commit()
    
    # Create JWT
    token = create_access_token({"sub": user.username})
    
    # Set cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True, 
        samesite='None', # สำคัญ: อนุญาตข้ามโดเมน
        secure=True # สำคัญ: ต้องใช้กับ HTTPS เท่านั้น
    )
    
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/login/github")
async def login_github():
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=read:user"
    )

@router.get("/login/google")
async def login_google():
    return RedirectResponse(
        f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&scope=openid%20email%20profile"
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
            # Check for existing email to prevent unique constraint error
            if email:
                existing_email = db.query(models.User).filter(models.User.email == email).first()
                if existing_email:
                    # Email exists with different provider; append provider suffix to make unique for now
                    email = f"{github_id}_{email}"
            
            user = models.User(provider_id=github_id, username=username, email=email)
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create JWT
        token = create_access_token({"sub": user.username, "id": user.id})
        
        # Redirect to frontend with token
        # Check environment to decide redirect URL
        redirect_base = os.getenv("FRONTEND_URL", "http://localhost:5173/") # Add FRONTEND_URL to env vars in Render
        if "github.io" in redirect_base and not redirect_base.endswith("tic-tac-toe/"):
             redirect_base = "https://sarawut-hub.github.io/tic-tac-toe/"

        if "?" in redirect_base:
            redirect_url = f"{redirect_base}&token={token}"
        else:
            redirect_url = f"{redirect_base}?token={token}"

        response = RedirectResponse(url=redirect_url) 
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            samesite='None',  # สำคัญ: อนุญาตข้ามโดเมน
            secure=True       # สำคัญ: ต้องใช้กับ HTTPS เท่านั้น
        )
        return response

@router.get("/callback/google")
async def callback_google(code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": GOOGLE_REDIRECT_URI,
            },
        )
        token_data = response.json()
        access_token = token_data.get("access_token")
        if not access_token:
             raise HTTPException(status_code=400, detail="Failed to retrieve access token from Google")
        
        # Get user info
        user_info_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_data = user_info_response.json()
        
        # Google user data mapping
        google_id = "google_" + str(user_data["id"])
        email = user_data.get("email")
        username = user_data.get("name") or email.split("@")[0] # Google doesn't always have username like GitHub

        # Check if user exists
        user = db.query(models.User).filter(models.User.provider_id == google_id).first()
        if not user:
             # Check if email exists (maybe merge accounts? For now, we'll just create new or update)
             # If email exists but different provider, simple logic: fail or link. 
             # Here, let's keep it simple: create/get based on provider_id.
             # But wait, username must be unique. If Google username exists, append random or handle collision.
             existing_user_by_name = db.query(models.User).filter(models.User.username == username).first()
             if existing_user_by_name:
                 username = f"{username}_{google_id[-4:]}" # Append suffix to make unique

             # Check for existing email to prevent unique constraint error
             if email:
                  existing_email = db.query(models.User).filter(models.User.email == email).first()
                  if existing_email:
                      email = f"{google_id}_{email}"

             user = models.User(provider_id=google_id, username=username, email=email)
             db.add(user)
             db.commit()
             db.refresh(user)
        
        # Create JWT
        token = create_access_token({"sub": user.username, "id": user.id})

        # Redirect to frontend with token
        redirect_base = os.getenv("FRONTEND_URL", "http://localhost:5173/")
        if "github.io" in redirect_base and not redirect_base.endswith("tic-tac-toe/"):
             redirect_base = "https://sarawut-hub.github.io/tic-tac-toe/"

        if "?" in redirect_base:
             redirect_url = f"{redirect_base}&token={token}"
        else:
             redirect_url = f"{redirect_base}?token={token}"

        response = RedirectResponse(url=redirect_url) 
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            samesite='None',  # สำคัญ: อนุญาตข้ามโดเมน
            secure=True       # สำคัญ: ต้องใช้กับ HTTPS เท่านั้น
        )
        return response

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}

