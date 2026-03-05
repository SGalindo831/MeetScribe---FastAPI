import type { Meeting, UploadResponse } from "./types";

// Point to your FastAPI backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchMeetings(): Promise<Meeting[]> {
  const res = await fetch(`${API_BASE}/meetings`);
  if (!res.ok) throw new Error("Failed to fetch meetings");
  return res.json();
}

export async function fetchMeeting(id: number): Promise<Meeting> {
  const res = await fetch(`${API_BASE}/meeting/${id}`);
  if (!res.ok) throw new Error("Failed to fetch meeting");
  return res.json();
}

export async function fetchMeetingStatus(taskId: string): Promise<Meeting> {
  const res = await fetch(`${API_BASE}/status/${taskId}`);
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function uploadAudio(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function deleteMeeting(
  id: number
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/meeting/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

export function getWebSocketUrl(): string {
  const wsBase =
    process.env.NEXT_PUBLIC_WS_URL ||
    API_BASE.replace("http", "ws");
  return `${wsBase}/ws`;
}
