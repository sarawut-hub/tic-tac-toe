from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE session_players ADD COLUMN answered_questions JSON"))
        conn.commit()
    print("Column added successfully (or already exists).")
except Exception as e:
    print(f"Migration info/error: {e}")
