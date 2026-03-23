import sqlite3
try:
    conn = sqlite3.connect('tictactoe.db')
    c = conn.cursor()
    c.execute('ALTER TABLE session_players ADD COLUMN answered_questions JSON')
    conn.commit()
    print("Column added successfully.")
except sqlite3.OperationalError as e:
    print(f"Error (maybe column exists): {e}")
finally:
    conn.close()
