# app/reset_db.py
import os
from app.db import Base, engine

DB_FILE = "db.sqlite3"  # adjust if your DB file is elsewhere

# Remove old DB file if it exists
if os.path.exists(DB_FILE):
    os.remove(DB_FILE)
    print(f"Deleted old database: {DB_FILE}")

# Create new tables
Base.metadata.create_all(bind=engine)
print("New database created with all tables.")
