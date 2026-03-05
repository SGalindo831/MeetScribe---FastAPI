"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { getWebSocketUrl } from "@/lib/api";

interface AudioRecorderProps {
  onRecordingComplete: (taskId: string) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (wsRef.current) wsRef.current.close();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Connect WebSocket
      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "start_recording" }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "recording_started") {
          sessionIdRef.current = data.session_id;
        } else if (data.type === "processing_complete") {
          setIsProcessing(false);
          onRecordingComplete(data.session_id);
        } else if (data.type === "error") {
          setError(data.message);
          setIsProcessing(false);
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection failed. Is the backend running?");
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const mediaRecorder = mediaRecorderRef.current;
    const ws = wsRef.current;

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (ws && ws.readyState === WebSocket.OPEN && sessionIdRef.current) {
            ws.send(
              JSON.stringify({
                type: "audio_data",
                session_id: sessionIdRef.current,
                audio_blob: reader.result,
              })
            );
            // Small delay then stop
            setTimeout(() => {
              ws.send(
                JSON.stringify({
                  type: "stop_recording",
                  session_id: sessionIdRef.current,
                })
              );
            }, 500);
          }
        };
        reader.readAsDataURL(blob);

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.stop();
    }

    setIsRecording(false);
    setIsProcessing(true);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card p-6">
        {/* Timer */}
        {(isRecording || isProcessing) && (
          <div className="font-mono text-2xl font-semibold tabular-nums text-foreground">
            {formatDuration(duration)}
          </div>
        )}

        {/* Record Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200",
            isRecording
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : isProcessing
                ? "cursor-not-allowed bg-secondary text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording && (
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/30" />
          )}
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isRecording ? (
            <Square className="h-5 w-5" fill="currentColor" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </button>

        {/* Label */}
        <p className="text-xs text-muted-foreground">
          {isProcessing
            ? "Processing your recording..."
            : isRecording
              ? "Recording in progress. Click to stop."
              : "Click to start live recording"}
        </p>
      </div>

      {error && (
        <p className="text-center text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
