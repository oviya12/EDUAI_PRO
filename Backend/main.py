import os
import json
import bcrypt
import re
import pandas as pd # Ensure pandas is imported
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from dotenv import load_dotenv

# Internal Imports
import models
from database import engine, get_db

# LangChain & AI Imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone

# Load Environment Variables
load_dotenv()

# Initialize Database Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduAI Pro Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# AI Setup
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = "eduai"
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# --- PHET SIMULATION DATABASE ---
PHET_DATABASE = [
    {
        "keywords": ["pendulum", "oscillation", "period", "harmonic", "swing"],
        "title": "Pendulum Lab",
        "url": "https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_en.html"
    },
    {
        "keywords": ["circuit", "current", "voltage", "resistance", "battery", "ohm", "resistor"],
        "title": "Circuit Construction Kit",
        "url": "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html"
    },
    {
        "keywords": ["projectile", "motion", "velocity", "acceleration", "trajectory", "cannon"],
        "title": "Projectile Motion",
        "url": "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html"
    },
    {
        "keywords": ["wave", "interference", "sound", "frequency", "amplitude", "diffraction"],
        "title": "Wave Interference",
        "url": "https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_en.html"
    },
    {
        "keywords": ["friction", "force", "newton", "push", "pull", "inertia"],
        "title": "Forces and Motion",
        "url": "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html"
    },
    {
        "keywords": ["energy", "heat", "thermal", "temperature", "specific heat"],
        "title": "Energy Forms and Changes",
        "url": "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_en.html"
    },
    {
        "keywords": ["light", "bending", "refraction", "prism", "lens", "optic"],
        "title": "Bending Light",
        "url": "https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_en.html"
    }
]

def find_simulation(query: str):
    query_lower = query.lower()
    for sim in PHET_DATABASE:
        for keyword in sim["keywords"]:
            if keyword in query_lower:
                return sim
    return None

# --- SECURITY HELPERS ---
def hash_password(password: str):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# --- HELPER: CATEGORIZATION ---
def categorize_doubt(question, context):
    llm = ChatGroq(model_name="llama-3.1-8b-instant", groq_api_key=os.getenv("GROQ_API_KEY"))
    prompt = f"Context: {context[:1000]}\nQuestion: {question}\nReturn ONLY a 1-2 word topic name."
    try:
        res = llm.invoke(prompt)
        return res.content.strip().replace("'", "").replace('"', "")
    except:
        return "General"

# 1. UPDATED SIGNUP (Accepts Security Q&A)
@app.post("/auth/signup")
async def signup(
    full_name: str = Form(...), 
    email: str = Form(...), 
    password: str = Form(...), 
    role: str = Form(...), 
    security_question: str = Form(...), # NEW
    security_answer: str = Form(...),   # NEW
    db: Session = Depends(get_db)
):
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash both password AND security answer
    new_user = models.User(
        full_name=full_name, 
        email=email, 
        hashed_password=hash_password(password), 
        role=role,
        security_question=security_question,
        hashed_security_answer=hash_password(security_answer.lower().strip()) # Normalize answer
    )
    db.add(new_user)
    db.commit()
    return {"message": "Success"}

# 2. LOGIN (Unchanged)
@app.post("/auth/login")
async def login(email: str = Form(...), password: str = Form(...), role: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email, models.User.role == role).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"user": {"full_name": user.full_name, "email": user.email, "role": user.role}}

# 3. NEW: GET SECURITY QUESTION
@app.get("/auth/get-security-question")
async def get_security_question(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    # Return the question so the user knows what to answer
    return {"question": user.security_question}

# 4. NEW: RESET PASSWORD
@app.post("/auth/reset-password")
async def reset_password(
    email: str = Form(...),
    security_answer: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify the security answer
    if not verify_password(security_answer.lower().strip(), user.hashed_security_answer):
        raise HTTPException(status_code=401, detail="Incorrect security answer")
    
    # Update Password
    user.hashed_password = hash_password(new_password)
    db.commit()
    return {"message": "Password updated successfully"}

# --- FACULTY CORE (Knowledge Base) ---
@app.post("/faculty/upload")
async def upload_material(file: UploadFile = File(...), unit: str = Form(...), db: Session = Depends(get_db)):
    unit_name = unit.strip() or "Others"
    file_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    loader = PyPDFLoader(file_path)
    pages = loader.load_and_split()
    for p in pages:
        p.metadata["unit"] = unit_name
    PineconeVectorStore.from_documents(pages, embeddings, index_name=index_name)
    if not db.query(models.DoubtRecord).filter(models.DoubtRecord.unit == unit_name).first():
        db.add(models.DoubtRecord(question="Init", topic="System", unit=unit_name))
        db.commit()
    return {"message": "Synced successfully"}

@app.get("/faculty/units")
async def get_units(db: Session = Depends(get_db)):
    results = db.query(models.DoubtRecord.unit).distinct().all()
    return [r[0] for r in results if r[0] and r[0] != "None"]

# --- FACULTY CORE (Exam Cell) ---


# --- STUDENT INTERACTION (Enhanced for Study Material) ---

@app.post("/student/ask")
async def ask_ai(
    question: str = Form(...), 
    unit: str = Form(...), 
    history: str = Form(...), 
    db: Session = Depends(get_db)
):
    chat_data = json.loads(history)
    limited_history = chat_data[-4:] 
    full_transcript = "\n".join([f"{'Student' if m['role']=='user' else 'AI'}: {m['text']}" for m in limited_history])
    
    # 1. RAG Search
    vector_db = PineconeVectorStore(index_name=index_name, embedding=embeddings)
    docs = vector_db.similarity_search(question, k=8, filter={"unit": unit})
    context_text = "\n".join([d.page_content for d in docs])[:4000]

    # 2. Analytics
    topic = categorize_doubt(question, context_text)
    db.add(models.DoubtRecord(question=question, topic=topic, unit=unit))
    db.commit()

    # 3. PhET Check
    relevant_sim = find_simulation(question)
    
    # 4. Generate AI Answer (HUMAN TUTOR PROMPT)
    llm = ChatGroq(temperature=0.6, model_name="llama-3.1-8b-instant", groq_api_key=os.getenv("GROQ_API_KEY"))
    
    sim_instruction = ""
    if relevant_sim:
        sim_instruction = f"🎉 **Bonus:** I found a cool interactive simulation called '{relevant_sim['title']}' for this! Definitely check the card below."

    prompt = f"""
    You are an expert Physics Professor known for being engaging, clear, and relatable. You are NOT a robot. You are teaching "{unit}".

    --- SOURCE MATERIAL (Use this for facts) ---
    {context_text}
    --------------------------------------------
    
    --- CONVERSATION SO FAR ---
    {full_transcript}
    ---------------------------

    Current Question: "{question}"
    {sim_instruction}

    ### YOUR GOAL:
    Answer like a real human tutor sitting next to the student. 
    
    ### DECISION LOGIC:
    **IF THE ANSWER IS IN THE SOURCE MATERIAL:**
    1. **Be Conversational:** Start with a natural opener (e.g., "That's a great question!", "Ah, this is a tricky concept, let me break it down.").
    2. **Explain Simply:** Refer source material for proper definitions, if student could not understand use simple language and analogies.
       - If there is a formula in the source material, write it on its own line using Markdown block format (e.g., $$ F = ma $$).
       - Explain what each variable means (e.g., where F is Force, m is mass...).
       - If the text has a derivation, summarize the steps using bullet points.
        **Give an Example:** If the text has an example, use it.
    3. **Weave in the Math:** When you need to show a formula, introduce it naturally (e.g., "Mathematically, we express this as...").
       - **CRITICAL RULE:** You MUST still write the formula on a new line wrapped in `$$` for the board to read it.
       - Example: 
         $$ F = ma $$
    4. **Cite Naturally:** Instead of a footer, mention the source in the flow (e.g., "As mentioned in your unit notes...", "According to the text provided...").
    5. **Use Emojis:** Use them sparingly but effectively to add personality 🌟.

    **IF THE ANSWER IS NOT IN THE SOURCE MATERIAL (Out of Syllabus):**
    - Be witty and playful. 
    - Example: "I'd love to explain quantum entanglement, but right now we need to focus on {unit}! Let's stick to the syllabus 😉."
    - Do NOT answer off-topic questions.

    ### FORMATTING RULES (For the Frontend):
    - **Formulas:** ALWAYS `$$ equation $$` on a new line.
    - **Variables:** You can use bullet points for variables if it helps clarity, but you don't have to if a sentence flows better.
    - **Bold:** Use **bold** for key terms.

    
    """
    
    response = llm.invoke(prompt)
    
    return {
        "answer": response.content,
        "simulation": relevant_sim
    }
# --- ANALYTICS ROUTES ---
@app.get("/faculty/analytics/chart")
async def get_chart(db: Session = Depends(get_db)):
    res = db.query(models.DoubtRecord.unit, func.count(models.DoubtRecord.id)).filter(models.DoubtRecord.topic != "System").group_by(models.DoubtRecord.unit).all()
    return [{"topic": r[0], "count": r[1]} for r in res]

@app.get("/faculty/analytics/topics/{unit_name}")
async def get_topics(unit_name: str, db: Session = Depends(get_db)):
    res = db.query(models.DoubtRecord.topic, func.count(models.DoubtRecord.id)).filter(models.DoubtRecord.unit == unit_name, models.DoubtRecord.topic != "System").group_by(models.DoubtRecord.topic).all()
    return [{"topic": r[0], "count": r[1]} for r in res]

# --- GAMIFIED QUIZ ENDPOINTS ---

@app.post("/student/quiz/generate")
async def generate_quiz(unit: str = Form(...)):
    # 1. Fetch Context
    vector_db = PineconeVectorStore(index_name=index_name, embedding=embeddings)
    docs = vector_db.similarity_search(f"important concepts in {unit}", k=5, filter={"unit": unit})
    context_text = "\n".join([d.page_content for d in docs])[:3000]

    # 2. Prompt LLM for JSON Output
    llm = ChatGroq(temperature=0.3, model_name="llama-3.1-8b-instant", groq_api_key=os.getenv("GROQ_API_KEY"))
    
    prompt = f"""
    Context: {context_text}
    Generate 5 Multiple Choice Questions (MCQs) for the unit "{unit}".
    
    STRICT JSON FORMAT REQUIRED:
    [
        {{
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Option A" 
        }}
    ]
    Do not add any markdown, intro text, or explanation. JUST THE JSON ARRAY.
    """
    
    try:
        res = llm.invoke(prompt)
        # Clean response to ensure valid JSON (sometimes LLMs add ```json ... ```)
        json_str = res.content.replace("```json", "").replace("```", "").strip()
        quiz_data = json.loads(json_str)
        return {"quiz": quiz_data}
    except Exception as e:
        # Fallback if AI fails to format
        return {"error": "Failed to generate quiz", "details": str(e)}

@app.post("/student/quiz/submit")
async def submit_score(
    unit: str = Form(...), 
    score: int = Form(...), 
    email: str = Form("student@eduai.com"), # Default for demo
    db: Session = Depends(get_db)
):
    db.add(models.QuizScore(student_email=email, unit=unit, score=score))
    db.commit()
    return {"message": "Score saved!"}

@app.get("/student/stats")
async def get_student_stats(email: str = "student@eduai.com", db: Session = Depends(get_db)):
    # Calculate Total XP (Sum of all scores)
    total_xp = db.query(func.sum(models.QuizScore.score)).filter(models.QuizScore.student_email == email).scalar() or 0
    quizzes_taken = db.query(models.QuizScore).filter(models.QuizScore.student_email == email).count()
    return {"xp": total_xp, "quizzes": quizzes_taken}
# ... (Keep existing imports and setups)

# --- HELPER: RECALCULATE TOTAL ---
def calculate_percentage(student):

    total_co3 = (student.co3_cat1 or 0) + (student.co3_cat2 or 0)
    total_score = (student.co1 or 0) + (student.co2 or 0) + total_co3 + (student.co4 or 0) + (student.co5 or 0)
    return round((total_score / 75) * 100, 2)

# --- ENDPOINT 1: UPLOAD CAT 1 ---
# --- HELPER: FUZZY COLUMN FINDER ---
def find_column(columns, keywords):
    """Finds a column name that matches any of the keywords."""
    for col in columns:
        col_clean = str(col).upper().replace(".", "").replace("_", "")
        for kw in keywords:
            if kw in col_clean:
                return col
    return None

# --- ENDPOINT 1: UPLOAD CAT 1 ---
@app.post("/faculty/upload-cat1")
async def upload_cat1(file: UploadFile = File(...), db: Session = Depends(get_db)):
    print(f"📂 STARTING CAT 1 UPLOAD: {file.filename}")
    try:
        df = pd.read_excel(file.file)
        print(f"📊 Columns Found: {df.columns.tolist()}")

        # 1. Identify Key Columns using Fuzzy Search
        reg_col = find_column(df.columns, ["REG", "ROLL"])
        name_col = find_column(df.columns, ["NAME", "STUDENT"])
        
        # 2. Check strict requirements
        if not reg_col:
            print("❌ CRITICAL: Register Number column not found!")
            return {"error": f"Could not find 'Register Number' column. Found: {df.columns.tolist()}"}

        # 3. Process Rows
        count = 0
        for index, row in df.iterrows():
            reg_no = str(row[reg_col]).strip()
            
            # Skip invalid rows
            if not reg_no or reg_no.lower() == 'nan': continue

            # Find or Create Student
            student = db.query(models.StudentMark).filter(models.StudentMark.register_no == reg_no).first()
            if not student:
                student = models.StudentMark(register_no=reg_no)
                db.add(student)
            
            if name_col: student.name = row[name_col]

            # 4. Extract Marks (Safe extraction)
            def get_val(keywords):
                col = find_column(df.columns, keywords)
                if col:
                    try: return float(row[col])
                    except: return 0.0
                return 0.0

            student.co1 = get_val(["CO1"])
            student.co2 = get_val(["CO2"])
            student.co3_cat1 = get_val(["CO3"]) # CAT1 contributes to first half of CO3
            
            student.total_percentage = calculate_percentage(student)
            count += 1

        db.commit()
        print(f"✅ SUCCESS: Synced {count} students.")
        return {"message": f"Successfully synced {count} students"}

    except Exception as e:
        print(f"🔥 EXCEPTION: {str(e)}")
        return {"error": str(e)}

# --- ENDPOINT 2: UPLOAD CAT 2 ---
@app.post("/faculty/upload-cat2")
async def upload_cat2(file: UploadFile = File(...), db: Session = Depends(get_db)):
    print(f"📂 STARTING CAT 2 UPLOAD: {file.filename}")
    try:
        df = pd.read_excel(file.file)
        print(f"📊 Columns Found: {df.columns.tolist()}")

        reg_col = find_column(df.columns, ["REG", "REGISTER NUMBER"])
        if not reg_col:
            return {"error": "Register Number column missing."}

        count = 0
        for index, row in df.iterrows():
            reg_no = str(row[reg_col]).strip()
            if not reg_no or reg_no.lower() == 'nan': continue

            student = db.query(models.StudentMark).filter(models.StudentMark.register_no == reg_no).first()
            if not student:
                student = models.StudentMark(register_no=reg_no)
                db.add(student)
            
            # Helper to get marks safely
            def get_val(keywords):
                col = find_column(df.columns, keywords)
                if col:
                    try: return float(row[col])
                    except: return 0.0
                return 0.0

            # Map CAT 2 Columns directly
            student.co3_cat2 = get_val(["CO3"])
            student.co4 = get_val(["CO4"])
            student.co5 = get_val(["CO5"])
            
            student.total_percentage = calculate_percentage(student)
            count += 1

        db.commit()
        print(f"✅ SUCCESS: Synced {count} students.")
        return {"message": f"Successfully synced {count} students"}

    except Exception as e:
        print(f"🔥 EXCEPTION: {str(e)}")
        return {"error": str(e)}
# --- ANALYTICS ENDPOINT (UPDATED) ---
# --- ANALYTICS ENDPOINT (DEBUG VERSION) ---
@app.get("/faculty/marks/deep-analytics")
async def get_deep_analytics(db: Session = Depends(get_db)):
    students = db.query(models.StudentMark).all()
    if not students: return {"error": "No data"}

    # 1. Calculate Averages
    total_co1 = sum([s.co1 for s in students])
    total_co2 = sum([s.co2 for s in students])
    total_co3 = sum([s.co3_cat1 + s.co3_cat2 for s in students]) 
    total_co4 = sum([s.co4 for s in students])
    total_co5 = sum([s.co5 for s in students])

    def to_avg_percent(total_points):
        if not students: return 0
        # Assuming max marks per unit is 30
        return (total_points / (len(students) * 30)) * 100

    unit_performance = {
        "Unit 1": to_avg_percent(total_co1),
        "Unit 2": to_avg_percent(total_co2),
        "Unit 3": to_avg_percent(total_co3),
        "Unit 4": to_avg_percent(total_co4),
        "Unit 5": to_avg_percent(total_co5),
    }

    # 2. Doubt Correlation
    doubt_counts = {}
    for i in range(1, 6):
        # Flexible matching (e.g., "Unit 1", "unit 1", "U1")
        count = db.query(models.DoubtRecord).filter(models.DoubtRecord.unit.ilike(f"%{i}%")).count()
        doubt_counts[f"Unit {i}"] = count

    # 3. Calculate Friction Scores
    analysis_data = []
    for unit, marks in unit_performance.items():
        doubts = doubt_counts.get(unit, 0)
        friction_score = (doubts * 1.5) + ((100 - marks) * 1.2)
        
        analysis_data.append({
            "unit": unit, 
            "avg_marks": round(marks, 1), 
            "doubts": doubts, 
            "friction_score": friction_score
        })

    # Sort: Highest Friction First
    analysis_data.sort(key=lambda x: x['friction_score'], reverse=True)
    friction_units = analysis_data[:2] # Top 2 problem areas
    
    print(f"🔥 TOP FRICTION AREAS DETECTED: {friction_units}")

    # 4. Generate AI Report (With Error Logging)
    ai_insights = []
    
    # Only call AI if Friction Score is high enough (> 40 is a safe threshold)
    if friction_units and friction_units[0]['friction_score'] > 40:
        print("🤖 CONTACTING AI FOR INSIGHTS...")
        try:
            llm = ChatGroq(temperature=0.3, model_name="llama-3.1-8b-instant", groq_api_key=os.getenv("GROQ_API_KEY"))
            
            prompt = f"""
            You are a senior academic analyst.
            Analyze these problematic units where students have LOW marks and HIGH doubts:
            {json.dumps(friction_units)}

            Context:
            - "avg_marks" is out of 100%.
            - "doubts" is the count of questions asked.

            For EACH unit in the list, generate a teaching strategy in STRICT JSON format:
            [
              {{
                "unit": "Unit Name",
                "observation": "Briefly state the marks vs doubts situation.",
                "root_cause": "Suggest a likely pedagogical reason (e.g., Numerical complexity).",
                "recommendation": "Suggest 1 specific active learning intervention."
              }}
            ]
            
            CRITICAL: RETURN ONLY THE JSON ARRAY. NO MARKDOWN. NO INTRO TEXT.
            """
            
            res = llm.invoke(prompt)
            print(f"📥 RAW AI RESPONSE: {res.content}") # DEBUG PRINT
            
            # Clean the response (Remove ```json ... ``` wrappers)
            json_str = res.content.replace("```json", "").replace("```", "").strip()
            ai_insights = json.loads(json_str)
            print("✅ AI INSIGHTS PARSED SUCCESSFULLY")

        except Exception as e:
            print(f"❌ AI GENERATION FAILED: {str(e)}")
            # Fallback Manual Insight so UI isn't empty
            ai_insights = [{
                "unit": friction_units[0]['unit'],
                "observation": f"Detected high friction (Score: {round(friction_units[0]['friction_score'])})",
                "root_cause": "AI Analysis temporarily unavailable.",
                "recommendation": "Review Unit performance manually."
            }]

    return {
        "graph_data": analysis_data,
        "ai_insights": ai_insights,
        "poor_performers": [s for s in students if s.total_percentage < 50]
    }