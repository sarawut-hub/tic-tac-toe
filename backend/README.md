# Tic-Tac-Toe Backend

## คำอธิบาย
FastAPI Backend สำหรับเกม Tic-Tac-Toe แบบ Multiplayer Online

รองรับการเล่นแบบ real-time ผ่าน WebSocket พร้อม game logic ที่จัดการการแพ้/ชนะ/เสมอ และ AI สำหรับ single player

## ฟีเจอร์หลัก
- **WebSocket** — real-time gameplay ระหว่างผู้เล่น 2 คน
- **Game Logic** — ตรวจสอบผู้ชนะ, blocking, AI move
- **Database** (SQLite) — เก็บประวัติเกมและคะแนน
- **Load Testing** — มี locustfile.py สำหรับ stress test
- **REST API** — endpoints สำหรับ room management และ game state

## Tech Stack
- **Python** + **FastAPI**
- **WebSocket** — real-time communication
- **SQLite** — database (tictactoe.db)
- **SQLAlchemy** — ORM (models.py)
- **Locust** — load testing

## โครงสร้างโปรเจกต์
```
backend/
├── main.py                 # FastAPI app + routes
├── game_logic.py           # คำนวณผู้ชนะ, AI logic
├── websocket_manager.py    # จัดการ WebSocket connections
├── database.py             # Database connection
├── models.py               # SQLAlchemy models
├── schemas.py              # Pydantic schemas
├── questions.py            # (bonus questions feature)
├── alter_db.py             # Database migration scripts
├── locustfile.py           # Load testing
└── requirements.txt
```

## วิธีติดตั้งและรัน

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

WebSocket: `ws://localhost:8001/ws/{room_id}/{player}`  
API Docs: http://localhost:8001/docs
