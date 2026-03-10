from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# ถ้ามี Environment Variable ชื่อ DATABASE_URL (จาก Render) ให้ใช้
# ถ้าไม่มี ให้ใช้ sqlite:///./tictactoe.db เหมือนเดิม (สำหรับรัน Local)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tictactoe.db")

# แก้ไข URL ให้ถูกต้องสำหรับ SQLAlchemy (Render ใช้ postgres:// แต่ SQLAlchemy ต้องการ postgresql://)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
