from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SummaryData(BaseModel):
    overview: str
    key_points: List[str]
    action_items: List[str]
    decisions: List[str]

class MeetingBase(BaseModel):
    filename: str
    recording_type: Optional[str] = None

class MeetingResponse(BaseModel):
    id: int
    task_id: str
    filename: str
    status: str
    transcript: Optional[str] = None
    summary: Optional[SummaryData] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    recording_type: Optional[str] = None
    
    class Config:
        from_attributes = True

class UploadResponse(BaseModel):
    success: bool
    task_id: str
    message: str

class StatusResponse(BaseModel):
    task_id: str
    status: str
    message: Optional[str] = None
