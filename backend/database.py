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

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
