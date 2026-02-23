import whisper
import os
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Meeting
from app.services.summarization import summarize_transcript
import json

# Load Whisper model once at startup
print("Loading Whisper model... This may take a moment.")
whisper_model = whisper.load_model("base")
print("✅ Whisper model loaded successfully!")

def transcribe_audio(filepath: str) -> str:
    """Use local Whisper to transcribe audio"""
    try:
        print(f"Transcribing {filepath} with Whisper...")
        result = whisper_model.transcribe(filepath)
        return result["text"]
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        raise

def process_audio_file(filepath: str, task_id: str, db: Session):
    """Process uploaded audio file: transcribe and summarize"""
    try:
        # Update status to transcribing
        meeting = db.query(Meeting).filter(Meeting.task_id == task_id).first()
        if not meeting:
            print(f"Meeting with task_id {task_id} not found")
            return
        
        meeting.status = 'transcribing'
        db.commit()
        
        # Transcribe
        print(f"Starting transcription for {filepath}")
        transcript = transcribe_audio(filepath)
        print(f"Transcription complete. Length: {len(transcript)} characters")
        
        # Save transcript
        transcript_path = f"transcriptions/{task_id}_transcript.txt"
        os.makedirs("transcriptions", exist_ok=True)
        with open(transcript_path, 'w') as f:
            f.write(transcript)
        
        meeting.transcript = transcript
        meeting.status = 'summarizing'
        db.commit()
        
        # Summarize
        print(f"Starting summarization for task {task_id}")
        summary = summarize_transcript(transcript)
        print(f"Summarization complete")
        
        # Save summary
        summary_path = f"summaries/{task_id}_summary.json"
        os.makedirs("summaries", exist_ok=True)
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        meeting.summary_overview = summary['overview']
        meeting.summary_data = json.dumps(summary)
        meeting.status = 'completed'
        meeting.completed_at = datetime.utcnow()
        db.commit()
        
        print(f"✅ Processing complete for task {task_id}")
        
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        import traceback
        traceback.print_exc()
        
        meeting = db.query(Meeting).filter(Meeting.task_id == task_id).first()
        if meeting:
            meeting.status = 'error'
            db.commit()

async def process_live_recording(session_id: str, db: Session, manager, websocket):
    """Process live recording: transcribe and summarize"""
    try:
        filepath = f"uploads/{session_id}_recording.webm"
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Recording file not found: {filepath}")
        
        meeting = db.query(Meeting).filter(Meeting.task_id == session_id).first()
        meeting.status = 'transcribing'
        db.commit()
        
        print(f"Transcribing live recording: {filepath}")
        transcript = transcribe_audio(filepath)
        print(f"Transcription complete: {len(transcript)} characters")
        
        meeting.transcript = transcript
        meeting.status = 'summarizing'
        db.commit()
        
        print(f"Summarizing transcript...")
        summary = summarize_transcript(transcript)
        print(f"Summarization complete")
        
        meeting.summary_overview = summary['overview']
        meeting.summary_data = json.dumps(summary)
        meeting.status = 'completed'
        meeting.completed_at = datetime.utcnow()
        db.commit()
        
        await manager.send_message({
            'type': 'processing_complete',
            'session_id': session_id,
            'summary': summary,
            'transcript': transcript
        }, websocket)
        
    except Exception as e:
        print(f"Error in live recording: {str(e)}")
        import traceback
        traceback.print_exc()
        
        meeting = db.query(Meeting).filter(Meeting.task_id == session_id).first()
        if meeting:
            meeting.status = 'error'
            db.commit()
