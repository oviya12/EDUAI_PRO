🎓 EduAI - Personalized AI Tutor & Learning Management System
EduAI is a full-stack, AI-powered educational platform designed to bridge the gap between students and faculty. It empowers educators to seamlessly upload study materials and track student performance, while providing students with an interactive, gamified AI tutor that understands their specific coursework.

✨ Key Features
👨‍🏫 Faculty Portal
Role-Based Authentication: Secure login, signup, and password recovery using security questions.

Smart Material Uploads: Upload course PDFs. The system automatically saves the file for student viewing and processes the text into a Vector Database (Pinecone) for the AI to learn from.

Module Management: Organize content by units (e.g., Unit 1, Unit 2).

Analytics Dashboard: Track student marks (CAT 1, CAT 2), calculate totals, and view performance charts.

Demo Reset Mode: A dedicated admin endpoint to instantly wipe databases and Pinecone vectors for clean demonstrations.

🎓 Student Portal
RAG-Powered AI Tutor: A contextual chatbot that answers questions based only on the specific materials the faculty uploaded for that unit.

Rich Text & Math Support: AI responses fully support Markdown, LaTeX equations, and code blocks for technical subjects.

Gamified "Rapid Quizzes": Automatically generated quizzes based on the selected unit material. Students earn XP for correct answers.

Interactive Labs: Embedded simulation cards (via iframes) for hands-on visual learning.

Study Material Viewer: Direct access to view or download the original PDF study materials uploaded by the faculty.

Dark Mode: Fully responsive UI with a seamless Light/Dark mode toggle.

🛠️ Tech Stack
Frontend (User Interface)
React.js: Core UI framework.

Tailwind CSS: Utility-first styling (Optimized for production build).

React Router: For seamless single-page application navigation.

Axios: For handling API requests.

React-Markdown & Rehype-Katex: For rendering rich AI text and complex mathematical formulas.

Backend (API & AI Processing)
FastAPI (Python): High-performance backend framework.

SQLAlchemy: ORM for managing the relational database.

PyPDFLoader: For extracting text from uploaded study materials.

Pinecone: Vector Database for storing document embeddings (Retrieval-Augmented Generation).

Uvicorn: ASGI web server for Python.

Database & Storage
SQLite: Ephemeral relational database for users, analytics, and raw PDF binary storage (LargeBinary).

Pinecone: Cloud vector database for AI semantic search.

Deployment
Frontend: Render (Connected to GitHub)

Backend: Hugging Face Spaces

🚀 Local Development Setup
Prerequisites
Node.js installed

Python 3.9+ installed

A Pinecone account and API Key

1. Backend Setup
Open a terminal and navigate to the backend folder.

Create a virtual environment:

Bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
Install dependencies:

Bash
pip install -r requirements.txt
Create a .env file in the backend root and add your keys:

Code snippet
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
# Add any other keys like GROQ_API_KEY if applicable
Start the FastAPI server:

Bash
uvicorn main:app --reload
The backend will run on http://localhost:8000

2. Frontend Setup
Open a new terminal and navigate to the frontend folder.

Install dependencies:

Bash
npm install
Start the development server:

Bash
npm start  # or 'npm run dev' if using Vite
The frontend will run on http://localhost:3000 (or 5173 for Vite)

🧹 Demo Reset Command
If you need to wipe the system for a fresh presentation, visit the following endpoint (ensure your Pinecone keys are set in your environment variables):
GET /admin/nuke-everything-for-demo
(Note: This permanently deletes all PDFs, doubts, marks, and Pinecone vectors).
