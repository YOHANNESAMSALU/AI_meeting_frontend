// MeetingHistory.jsx
import { useState, useEffect } from "react";
import {
  History,
  RefreshCw,
  Trash2,
  Download,
  Mail,
  PanelLeftClose,
} from "lucide-react";
import {
  fetchMeetings,
  deleteMeeting,
  exportMeetingPdf,
  sendMeetingEmail,
  isUnauthorizedError,
  clearStoredSession,
} from "../lib/api";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return "Unknown date";
  }
}

export default function MeetingHistory({
  onSelect,
  onNewChat,
  user,
  activeItemId,
  onAuthError,
  onClosePanel,
}) {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (user) {
      loadMeetings();
    } else {
      setMeetings([]);
    }
  }, [user]);

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMeetings();
      setMeetings(data);
    } catch (error) {
      console.error("Failed to load meetings:", error);
      if (isUnauthorizedError(error)) {
        clearStoredSession();
        onAuthError?.();
        return;
      }
      toast.error(error instanceof Error ? error.message : "Failed to load meetings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (meetingId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    setDeletingId(meetingId);
    try {
      await deleteMeeting(meetingId);
      setMeetings((prev) => prev.filter((meeting) => meeting.id !== meetingId));
      toast.success("Meeting deleted");
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      if (isUnauthorizedError(error)) {
        clearStoredSession();
        onAuthError?.();
        return;
      }
      toast.error(error instanceof Error ? error.message : "Failed to delete meeting");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportPdf = async (meetingId, e) => {
    e.stopPropagation();
    try {
      const blob = await exportMeetingPdf(meetingId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meeting-${meetingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      if (isUnauthorizedError(error)) {
        clearStoredSession();
        onAuthError?.();
        return;
      }
      toast.error(error instanceof Error ? error.message : "Failed to export PDF");
    }
  };

  const handleSendEmail = async (meetingId, e) => {
    e.stopPropagation();
    const attendees = prompt("Enter attendee emails (comma-separated):");
    if (!attendees) return;

    try {
      const attendeeList = attendees.split(",").map((email) => email.trim()).filter(Boolean);
      await sendMeetingEmail(meetingId, attendeeList, true);
      toast.success("Email sent successfully");
    } catch (error) {
      console.error("Failed to send email:", error);
      if (isUnauthorizedError(error)) {
        clearStoredSession();
        onAuthError?.();
        return;
      }
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(15,118,110,0.12)] text-[var(--chat-primary-strong)]">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">
                HISTORY
              </p>
            </div>
          </div>

          {onClosePanel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClosePanel}
              className="h-10 w-10 rounded-xl"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <Separator className="mb-4" />

      <div className="px-1 pb-4">
        <Button
          onClick={loadMeetings}
          disabled={!user || isLoading}
          variant="outline"
          className="w-full gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Meetings
        </Button>
      </div>

      <div className="flex-1 px-1 overflow-hidden">
        {!user ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Sign in to see the meetings saved under your account and to email or export them later.
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Loading meetings...
            </CardContent>
          </Card>
        ) : meetings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No meetings yet. Generate a recap and it will appear here automatically.
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)] pr-4">
            <div className="space-y-3 pb-6">
              {meetings.map((meeting) => {
                const isActive = activeItemId === meeting.id;

                return (
                  <Card
                    key={meeting.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isActive ? "ring-2 ring-teal-500/30 bg-teal-50/50" : ""
                    }`}
                    onClick={() => onSelect(meeting)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(meeting.created_at)}
                          </p>
                          <p className="mt-1.5 font-semibold leading-tight">
                            {meeting.title || `Meeting ${meeting.id}`}
                          </p>
                        </div>
                        <span className="glass-pill shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--chat-primary-strong)]">
                          {meeting.source || "saved"}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {String(meeting.summary || "").slice(0, 135)}
                        {String(meeting.summary || "").length > 135 ? "..." : ""}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleExportPdf(meeting.id, e)}
                          className="gap-1.5 text-xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleSendEmail(meeting.id, e)}
                          className="gap-1.5 text-xs"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleDelete(meeting.id, e)}
                          disabled={deletingId === meeting.id}
                          className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingId === meeting.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}