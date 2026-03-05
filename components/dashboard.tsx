"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Upload, Mic, FileAudio, CheckCircle2, Loader2 } from "lucide-react";
import { fetchMeetings, deleteMeeting } from "@/lib/api";
import type { Meeting } from "@/lib/types";
import { UploadZone } from "./upload-zone";
import { AudioRecorder } from "./audio-recorder";
import { MeetingCard } from "./meeting-card";
import { EmptyState } from "./empty-state";

type InputMode = "upload" | "record";

export function Dashboard() {
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const {
    data: meetings,
    error,
    isLoading,
    mutate,
  } = useSWR<Meeting[]>("meetings", fetchMeetings, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  });

  const handleUploadComplete = useCallback(
    (taskId: string) => {
      void taskId;
      mutate();
    },
    [mutate]
  );

  const handleRecordingComplete = useCallback(
    (taskId: string) => {
      void taskId;
      mutate();
    },
    [mutate]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteMeeting(id);
        mutate();
      } catch {
        // Silently fail - the UI will stay in sync on next refetch
      }
    },
    [mutate]
  );

  const completedCount = meetings?.filter((m) => m.status === "completed").length ?? 0;
  const processingCount =
    meetings?.filter((m) =>
      ["transcribing", "summarizing", "processing", "uploaded"].includes(m.status)
    ).length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero Section */}
      <div className="mb-10">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Your Meetings, Summarized
        </h1>
        <p className="mt-2 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
          Upload a recording or capture live audio. MeetScribe transcribes and
          distills your meetings into key points, action items, and decisions.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileAudio className="h-4 w-4" />
            <span className="text-xs font-medium">Total</span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {meetings?.length ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Completed</span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {completedCount}
          </p>
        </div>
        <div className="col-span-2 rounded-xl border border-border/60 bg-card p-4 sm:col-span-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4" />
            <span className="text-xs font-medium">Processing</span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {processingCount}
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/50 p-1">
          <button
            onClick={() => setInputMode("upload")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              inputMode === "upload"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload Audio
          </button>
          <button
            onClick={() => setInputMode("record")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              inputMode === "record"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="h-4 w-4" />
            Record Live
          </button>
        </div>

        {inputMode === "upload" ? (
          <UploadZone onUploadComplete={handleUploadComplete} />
        ) : (
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        )}
      </div>

      {/* Meeting List */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Recent Meetings
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border/60 bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Could not connect to the backend. Make sure the FastAPI server is
              running at{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
                localhost:8000
              </code>
            </p>
          </div>
        ) : !meetings || meetings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
