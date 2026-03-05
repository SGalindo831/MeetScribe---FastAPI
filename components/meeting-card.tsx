"use client";

import Link from "next/link";
import { FileAudio, Mic, Clock, Trash2, ChevronRight } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import type { Meeting } from "@/lib/types";

interface MeetingCardProps {
  meeting: Meeting;
  onDelete: (id: number) => void;
}

export function MeetingCard({ meeting, onDelete }: MeetingCardProps) {
  const isClickable = meeting.status === "completed";

  const CardContent = (
    <div
      className={cn(
        "group relative flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200",
        isClickable && "cursor-pointer hover:border-primary/30 hover:shadow-sm"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          meeting.recording_type === "live"
            ? "bg-destructive/10 text-destructive"
            : "bg-accent text-accent-foreground"
        )}
      >
        {meeting.recording_type === "live" ? (
          <Mic className="h-4 w-4" />
        ) : (
          <FileAudio className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {meeting.filename}
          </p>
          <StatusBadge status={meeting.status} />
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(meeting.created_at)}
          </span>
          {meeting.recording_type && (
            <span className="capitalize">{meeting.recording_type}</span>
          )}
        </div>
        {meeting.summary?.overview && (
          <p className="mt-2 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
            {meeting.summary.overview}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(meeting.id);
          }}
          className="rounded-md p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          aria-label={`Delete meeting ${meeting.filename}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {isClickable && (
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        )}
      </div>
    </div>
  );

  if (isClickable) {
    return (
      <Link href={`/meeting/${meeting.id}`} className="block">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
