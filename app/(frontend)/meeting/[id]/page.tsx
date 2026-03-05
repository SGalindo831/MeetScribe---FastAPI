import { Header } from "@/components/header";
import { MeetingDetail } from "@/components/meeting-detail";

export default function MeetingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <MeetingDetail />
      </main>
    </div>
  );
}
