"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ArrowLeft,
  FileAudio,
  Mic,
  Clock,
  Loader2,
  ListChecks,
  Lightbulb,
  CheckCircle2,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { fetchMeeting } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import type { Meeting } from "@/lib/types";
import { useState } from "react";

type Tab = "summary" | "transcript";

export function MeetingDetail() {
  const params = useParams();
  const router = useRouter();
  const meetingId = Number(params.id);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const {
    data: meeting,
    error,
    isLoading,
  } = useSWR<Meeting>(`meeting-${meetingId}`, () => fetchMeeting(meetingId), {
    refreshInterval: (data) =>
      data?.status === "completed" || data?.status === "error" ? 0 : 3000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
        <p className="mb-4 text-muted-foreground">Meeting not found.</p>
        <button
          onClick={() => router.push("/")}
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Back Link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              meeting.recording_type === "live"
                ? "bg-destructive/10 text-destructive"
                : "bg-accent text-accent-foreground"
            }`}
          >
            {meeting.recording_type === "live" ? (
              <Mic className="h-5 w-5" />
            ) : (
              <FileAudio className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {meeting.filename}
              </h1>
              <StatusBadge status={meeting.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(meeting.created_at)}
              </span>
              {meeting.recording_type && (
                <span className="capitalize">{meeting.recording_type} recording</span>
              )}
              {meeting.completed_at && (
                <span>Completed {formatDate(meeting.completed_at)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Processing State */}
      {meeting.status !== "completed" && meeting.status !== "error" && (
        <div className="mb-8 flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-medium text-foreground">
              {meeting.status === "transcribing"
                ? "Transcribing your audio..."
                : meeting.status === "summarizing"
                  ? "Generating AI summary..."
                  : "Processing..."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This may take a few moments depending on the recording length.
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {meeting.status === "error" && (
        <div className="mb-8 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">Processing failed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            There was an error processing this meeting. Please try uploading
            again.
          </p>
        </div>
      )}

      {/* Completed Content */}
      {meeting.status === "completed" && (
        <>
          {/* Tab Switcher */}
          <div className="mb-6 flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/50 p-1">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === "summary"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              Summary
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === "transcript"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-4 w-4" />
              Transcript
            </button>
          </div>

          {activeTab === "summary" && meeting.summary && (
            <div className="space-y-6 animate-fade-in">
              {/* Overview */}
              <section className="rounded-xl border border-border/60 bg-card p-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />
                  Overview
                </h2>
                <p className="leading-relaxed text-foreground">
                  {meeting.summary.overview}
                </p>
              </section>

              {/* Key Points */}
              {meeting.summary.key_points.length > 0 && (
                <section className="rounded-xl border border-border/60 bg-card p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <ListChecks className="h-4 w-4" />
                    Key Points
                  </h2>
                  <ul className="space-y-3">
                    {meeting.summary.key_points.map((point, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-relaxed text-foreground">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Action Items */}
              {meeting.summary.action_items.length > 0 && (
                <section className="rounded-xl border border-border/60 bg-card p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Action Items
                  </h2>
                  <ul className="space-y-2.5">
                    {meeting.summary.action_items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="text-sm leading-relaxed text-foreground">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Decisions */}
              {meeting.summary.decisions.length > 0 && (
                <section className="rounded-xl border border-border/60 bg-card p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Decisions Made
                  </h2>
                  <ul className="space-y-2.5">
                    {meeting.summary.decisions.map((decision, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span className="text-sm leading-relaxed text-foreground">
                          {decision}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {activeTab === "transcript" && meeting.transcript && (
            <div className="animate-fade-in rounded-xl border border-border/60 bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <FileText className="h-4 w-4" />
                Full Transcript
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">
                  {meeting.transcript}
                </p>
              </div>
            </div>
          )}

          {activeTab === "transcript" && !meeting.transcript && (
            <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No transcript available for this meeting.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
