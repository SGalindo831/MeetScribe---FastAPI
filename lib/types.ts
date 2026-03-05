export interface MeetingSummary {
  overview: string;
  key_points: string[];
  action_items: string[];
  decisions: string[];
}

export interface Meeting {
  id: number;
  task_id: string;
  filename: string;
  status:
    | "uploaded"
    | "recording"
    | "transcribing"
    | "summarizing"
    | "processing"
    | "completed"
    | "error";
  transcript: string | null;
  summary: MeetingSummary | null;
  created_at: string | null;
  completed_at: string | null;
  recording_type: "upload" | "live" | null;
}

export interface UploadResponse {
  success: boolean;
  task_id: string;
  message: string;
}
