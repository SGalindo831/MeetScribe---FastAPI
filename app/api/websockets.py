from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
import base64
import os
import asyncio

from app.database import SessionLocal
from app.models import Meeting
from app.services.transcription import process_live_recording

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"❌ Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    db = SessionLocal()
    
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")
            
            if event_type == "start_recording":
                session_id = datetime.now().strftime('%Y%m%d_%H%M%S')
                
                meeting = Meeting(
                    task_id=session_id,
                    filename=f"{session_id}_recording.webm",
                    file_path=f"uploads/{session_id}_recording.webm",
                    status='recording',
                    recording_type='live'
                )
                db.add(meeting)
                db.commit()
                
                print(f"🎙️ Started recording session: {session_id}")
                
                await manager.send_message({
                    "type": "recording_started",
                    "session_id": session_id
                }, websocket)
            
            elif event_type == "audio_data":
                session_id = data.get("session_id")
                audio_blob = data.get("audio_blob")
                
                if not session_id or not audio_blob:
                    await manager.send_message({
                        "type": "error",
                        "message": "Missing session_id or audio_blob"
                    }, websocket)
                    continue
                
                try:
                    # Decode base64 audio data
                    audio_bytes = base64.b64decode(
                        audio_blob.split(',')[1] if ',' in audio_blob else audio_blob
                    )
                    
                    # Save to file
                    os.makedirs("uploads", exist_ok=True)
                    filepath = f"uploads/{session_id}_recording.webm"
                    with open(filepath, 'wb') as f:
                        f.write(audio_bytes)
                    
                    print(f"💾 Saved audio recording: {filepath} ({len(audio_bytes)} bytes)")
                    
                    await manager.send_message({
                        "type": "audio_saved",
                        "session_id": session_id,
                        "size": len(audio_bytes)
                    }, websocket)
                    
                except Exception as e:
                    print(f"Error saving audio: {str(e)}")
                    await manager.send_message({
                        "type": "error",
                        "message": f"Error saving audio: {str(e)}"
                    }, websocket)
            
            elif event_type == "stop_recording":
                session_id = data.get("session_id")
                
                if not session_id:
                    await manager.send_message({
                        "type": "error",
                        "message": "Missing session_id"
                    }, websocket)
                    continue
                
                meeting = db.query(Meeting).filter(Meeting.task_id == session_id).first()
                if meeting:
                    meeting.status = 'processing'
                    db.commit()
                
                print(f"⏹️ Stopped recording session: {session_id}")
                
                await manager.send_message({
                    "type": "recording_stopped",
                    "session_id": session_id
                }, websocket)
                
                # Process in background
                asyncio.create_task(
                    process_live_recording(session_id, db, manager, websocket)
                )
            
            else:
                await manager.send_message({
                    "type": "error",
                    "message": f"Unknown event type: {event_type}"
                }, websocket)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket)
    finally:
        db.close()
