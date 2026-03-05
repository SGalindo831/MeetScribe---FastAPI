import { AudioWaveform } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
        <AudioWaveform className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        No meetings yet
      </h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        Upload a meeting recording or start a live recording to get AI-powered
        transcriptions and summaries.
      </p>
    </div>
  );
}
