from database import engine, Base
from models import StudentMark,User # Import User model
from sqlalchemy import text

# ... existing code ...

print("Dropping tables...")

# Create a connection to run raw SQL
with engine.connect() as connection:
    connection.execute(text("DROP TABLE IF EXISTS student_marks CASCADE;"))
    connection.execute(text("DROP TABLE IF EXISTS users CASCADE;")) # Add this line
    connection.commit()

print("✅ Tables dropped. Restart your backend to recreate them.")