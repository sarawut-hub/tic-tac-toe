from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas
from routers.auth import get_current_user
import secrets
from datetime import datetime, timedelta
from fastapi import WebSocket, WebSocketDisconnect
from websocket_manager import manager
import json

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_code():
    return secrets.token_hex(3).upper() # 6 chars

@router.post("/sessions", response_model=schemas.SessionStatusResponse)
def create_session(session: schemas.SessionCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can create sessions")
    
    code = generate_code()
    while db.query(models.GameSession).filter(models.GameSession.code == code).first():
        code = generate_code()
        
    new_session = models.GameSession(
        code=code,
        host_id=current_user.id,
        time_limit_minutes=session.time_limit_minutes,
        question_ids=session.question_ids,
        status="WAITING"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/sessions/{code}", response_model=schemas.SessionStatusResponse)
def get_session(code: str, db: Session = Depends(get_db)):
    session = db.query(models.GameSession).filter(models.GameSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if time is up and update status if needed
    if session.status == "ACTIVE" and session.end_time and datetime.utcnow() > session.end_time:
        session.status = "ENDED"
        db.commit()
        db.refresh(session)
        
    return session

@router.post("/sessions/{code}/join", response_model=schemas.SessionPlayerResponse)
async def join_session(code: str, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    session = db.query(models.GameSession).filter(models.GameSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.status != "WAITING":
        # Allow joining active if previously joined? Or strictly waiting?
        # User requirement says: "if everyone entered... show who entered... start"
        # Implies joining while waiting.
        # But if someone drops? Let's restrict to WAITING for now unless they are re-joining.
        pass 
        
    existing_player = db.query(models.SessionPlayer).filter(
        models.SessionPlayer.session_id == session.id,
        models.SessionPlayer.user_id == current_user.id
    ).first()
    
    if existing_player:
        return existing_player
    
    if session.status != "WAITING":
         raise HTTPException(status_code=400, detail="Cannot join active or ended session via join, create new player")

    # Reset current streak for new session
    # current_user might be attached to a different session (from auth dependency)
    user = db.merge(current_user)
    user.current_streak = 0
    # db.add(user) # merge already attaches it
    
    new_player = models.SessionPlayer(
        session_id=session.id,
        user_id=user.id
    )
    db.add(new_player)
    db.commit()
    db.refresh(new_player)
    
    # Notify via WebSocket
    await manager.broadcast({
        "type": "PLAYER_JOINED",
        "data": {"username": user.username, "id": user.id}
    }, code)
    
    return db.query(models.SessionPlayer).filter(models.SessionPlayer.id == new_player.id).first()

@router.get("/sessions/{code}/players", response_model=List[schemas.SessionPlayerResponse])
def get_players(code: str, db: Session = Depends(get_db)):
    session = db.query(models.GameSession).filter(models.GameSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.players

@router.post("/sessions/{code}/start")
async def start_session(code: str, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    session = db.query(models.GameSession).filter(models.GameSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only host can start session")
        
    if session.status != "WAITING":
        raise HTTPException(status_code=400, detail="Session already started or ended")
        
    session.status = "ACTIVE"
    session.start_time = datetime.utcnow()
    # Calculate end time based on time_limit_minutes
    if session.time_limit_minutes:
        session.end_time = session.start_time + timedelta(minutes=session.time_limit_minutes)

    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Notify via WebSocket
    await manager.broadcast({
        "type": "SESSION_STARTED",
        "data": {
            "status": "ACTIVE",
            "start_time": session.start_time.isoformat(),
            "end_time": session.end_time.isoformat() if session.end_time else None
        }
    }, code)
    
    return session

@router.post("/sessions/{code}/end")
async def end_session(code: str, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    session = db.query(models.GameSession).filter(models.GameSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only host can end session")
        
    session.status = "ENDED"
    session.end_time = datetime.utcnow()
    db.commit()
    
    # Notify via WebSocket
    await manager.broadcast({
        "type": "SESSION_ENDED",
        "data": {"status": "ENDED"}
    }, code)
    
    return {"message": "Session ended"}

@router.websocket("/ws/{code}")
async def websocket_endpoint(websocket: WebSocket, code: str):
    await manager.connect(websocket, code)
    try:
        while True:
            # We don't expect messages from client for now, just keep alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, code)

@router.put("/sessions/{code}/avatar", response_model=schemas.SessionPlayerResponse)
async def update_avatar(code: str, avatar: schemas.AvatarUpdate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    session = db.query(models.GameSession).filter(models.GameSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    player = db.query(models.SessionPlayer).filter(
        models.SessionPlayer.session_id == session.id,
        models.SessionPlayer.user_id == current_user.id
    ).first()
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found in this session")
        
    player.avatar_config = avatar.avatar_config
    db.add(player)
    db.commit()
    db.refresh(player)
    
    # Notify via WebSocket
    await manager.broadcast({
        "type": "AVATAR_UPDATE",
        "data": {"user_id": current_user.id, "avatar_config": avatar.avatar_config}
    }, code)
    
    return player
