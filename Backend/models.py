from sqlalchemy import Column, Integer, String, DateTime, func,Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)
    
    # --- NEW SECURITY FIELDS ---
    security_question = Column(String)       # e.g., "What is your pet's name?"
    hashed_security_answer = Column(String)

class DoubtRecord(Base):
    __tablename__ = "doubts"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String)
    topic = Column(String)
    unit = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

# ... (Keep existing imports)

class StudentMark(Base):
    __tablename__ = "student_marks"
    id = Column(Integer, primary_key=True, index=True)
    register_no = Column(String, unique=True, index=True) 
    name = Column(String)
    
    # CAT 1 Data
    co1 = Column(Float, default=0)       # Out of 30
    co2 = Column(Float, default=0)       # Out of 30
    co3_cat1 = Column(Float, default=0)  # Out of 15 (Part A)

    # CAT 2 Data
    co3_cat2 = Column(Float, default=0)  # Out of 15 (Part B)
    co4 = Column(Float, default=0)       # Out of 30
    co5 = Column(Float, default=0)       # Out of 30
    
    # Derived Metrics (Calculated on save/retrieval)
    total_percentage = Column(Float, default=0)

# --- NEW MODEL FOR QUIZ SCORES ---
class QuizScore(Base):
    __tablename__ = "quiz_scores"
    id = Column(Integer, primary_key=True, index=True)
    student_email = Column(String, index=True) # We'll use a dummy email for now if no auth
    unit = Column(String)
    score = Column(Integer) # e.g., 80 (percentage)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)