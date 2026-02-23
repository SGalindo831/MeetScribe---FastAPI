from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base
import json

class Meeting(Base):
    __tablename__ = "meetings"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(100), unique=True, nullable=False, index=True)
    filename = Column(String(200), nullable=False)
    file_path = Column(String(300), nullable=False)
    status = Column(String(50), nullable=False)
    transcript = Column(Text, nullable=True)
    summary_overview = Column(Text, nullable=True)
    summary_data = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    recording_type = Column(String(20), nullable=True)
    
    def to_dict(self):
        summary = json.loads(self.summary_data) if self.summary_data else None
        return {
            'id': self.id,
            'task_id': self.task_id,
            'filename': self.filename,
            'status': self.status,
            'transcript': self.transcript,
            'summary': summary,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'recording_type': self.recording_type
        }
