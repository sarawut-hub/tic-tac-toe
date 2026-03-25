from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

# DATABASE_URL from .env or environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tictactoe.db")

# Standardize database URLs for SQLAlchemy
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    elif DATABASE_URL.startswith("mysql://"):
        # Default to mysql-connector-python driver
        DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+mysqlconnector://", 1)
    elif DATABASE_URL.startswith("mysql+pymysql://"):
        # Replace pymysql with mysqlconnector if found
        DATABASE_URL = DATABASE_URL.replace("mysql+pymysql://", "mysql+mysqlconnector://", 1)

# Database connection arguments
connect_args = {}

if "sqlite" in DATABASE_URL:
    connect_args["check_same_thread"] = False
elif "mysql" in DATABASE_URL:
    # Handle MySQL SSL requirements (often needed for cloud databases like Azure)
    if os.getenv("MYSQL_SSL", "false").lower() == "true":
        if "mysqlconnector" in DATABASE_URL:
            # SSL parameters for mysql-connector-python (top-level args)
            connect_args["ssl_disabled"] = False
            ca_path = os.getenv("MYSQL_SSL_CA")
            if ca_path and os.path.exists(ca_path):
                connect_args["ssl_ca"] = ca_path
        else:
            # SSL parameters for pymysql (nested 'ssl' dict)
            connect_args["ssl"] = {}
            ca_path = os.getenv("MYSQL_SSL_CA")
            if ca_path and os.path.exists(ca_path):
                connect_args["ssl"]["ca"] = ca_path

import json
import logging

logger = logging.getLogger(__name__)

def custom_json_deserializer(value):
    if isinstance(value, bytes):
        # Handle Java serialized strings (magic number aced 0005)
        # 0x74 is TC_STRING (followed by 2-byte length)
        if value.startswith(b'\xac\xed\x00\x05\x74'):
            try:
                # payload starts at index 7
                return json.loads(value[7:].decode('utf-8'))
            except Exception as e:
                logger.warning(f"Failed to decode Java TC_STRING JSON: {e}")
                pass
        # 0x7c is TC_LONGSTRING (followed by 8-byte length)
        elif value.startswith(b'\xac\xed\x00\x05\x7c'):
            try:
                # payload starts at index 13
                return json.loads(value[13:].decode('utf-8'))
            except Exception as e:
                logger.warning(f"Failed to decode Java TC_LONGSTRING JSON: {e}")
                pass
                
        try:
            return json.loads(value.decode('utf-8'))
        except UnicodeDecodeError:
            return json.loads(value)
    return json.loads(value)

engine_kwargs = {
    "connect_args": connect_args,
    "json_deserializer": custom_json_deserializer
}

# Add connection pooling parameters for MySQL to prevent "server has gone away" errors
if "mysql" in DATABASE_URL:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
