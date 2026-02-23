from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

from app.database import engine, Base
from app.api import routes, websockets

# Create database tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Database tables created")

# Create necessary directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("transcriptions", exist_ok=True)
os.makedirs("summaries", exist_ok=True)
os.makedirs("temp_recordings", exist_ok=True)

app = FastAPI(
    title="MeetScribe",
    description="Meeting transcription and summarization service using Whisper and Llama3",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes.router, tags=["meetings"])
app.include_router(websockets.router, tags=["websockets"])

# Mount static files (if you have frontend files)
if os.path.exists("app/static"):
    app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("🚀 MeetScribe FastAPI - LOCAL AI VERSION")
    print("="*60)
    print("\n ✅ Using local Whisper for transcription")
    print(" ✅ Using Ollama + Llama3 for summarization")
    print("\n 📊 Database: SQLite (meetings.db)")
    print(" 🌐 Server running at: http://localhost:8000")
    print(" 📚 API Docs: http://localhost:8000/docs")
    print(" 📖 ReDoc: http://localhost:8000/redoc")
    print("\n Upload or record audio to get AI summaries!")
    print("="*60 + "\n")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
