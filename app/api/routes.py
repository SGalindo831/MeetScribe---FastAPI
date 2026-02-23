from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import os
from werkzeug.utils import secure_filename
import threading

from app.database import get_db, SessionLocal
from app.models import Meeting
from app.schemas import MeetingResponse, UploadResponse
from app.services.transcription import process_audio_file

router = APIRouter()

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'mp4', 'm4a', 'webm', 'ogg'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@router.get("/", response_class=HTMLResponse)
async def root():
    return """
    <html>
        <head><title>MeetScribe FastAPI</title></head>
        <body>
            <h1>MeetScribe API</h1>
            <p>Meeting transcription and summarization service</p>
            <ul>
                <li><a href="/docs">Interactive API Documentation</a></li>
                <li><a href="/redoc">Alternative Documentation</a></li>
            </ul>
        </body>
    </html>
    """

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
    
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: mp3, wav, mp4, m4a, webm, ogg")
    
    # Save file
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_filename = f"{timestamp}_{filename}"
    filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
    
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    with open(filepath, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create database entry
    meeting = Meeting(
        task_id=timestamp,
        filename=unique_filename,
        file_path=filepath,
        status='uploaded',
        recording_type='upload'
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    # Process in background thread
    def process_in_thread():
        db_thread = SessionLocal()
        try:
            process_audio_file(filepath, timestamp, db_thread)
        finally:
            db_thread.close()
    
    thread = threading.Thread(target=process_in_thread)
    thread.start()
    
    return UploadResponse(
        success=True,
        task_id=timestamp,
        message="File uploaded successfully. Processing started."
    )

@router.get("/status/{task_id}")
async def check_status(task_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.task_id == task_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Task not found")
    return meeting.to_dict()

@router.get("/meetings", response_model=List[MeetingResponse])
async def get_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).order_by(Meeting.created_at.desc()).all()
    return [meeting.to_dict() for meeting in meetings]

@router.get("/meeting/{meeting_id}")
async def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting.to_dict()

@router.delete("/meeting/{meeting_id}")
async def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Delete file if exists
    if os.path.exists(meeting.file_path):
        try:
            os.remove(meeting.file_path)
        except Exception as e:
            print(f"Error deleting file: {e}")
    
    db.delete(meeting)
    db.commit()
    
    return {"success": True, "message": "Meeting deleted"}
