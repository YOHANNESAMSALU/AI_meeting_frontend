import { useState, useEffect } from "react";
import {
  History,
  RotateCcw,
  Trash2,
  Download,
  Mail,
  PanelLeftClose,
  RefreshCw,
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
      return;
    }

    setMeetings([]);
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
      toast.error(
        error instanceof Error ? error.message : "Failed to load meetings",
      );
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
      toast.error(
        error instanceof Error ? error.message : "Failed to delete meeting",
      );
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
      toast.error(
        error instanceof Error ? error.message : "Failed to export PDF",
      );
    }
  };

  const handleSendEmail = async (meetingId, e) => {
    e.stopPropagation();
    const attendees = prompt("Enter attendee emails (comma-separated):");
    if (!attendees) return;

    try {
      const attendeeList = attendees
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

      await sendMeetingEmail(meetingId, attendeeList, true);
      toast.success("Email sent successfully");
    } catch (error) {
      console.error("Failed to send email:", error);
      if (isUnauthorizedError(error)) {
        clearStoredSession();
        onAuthError?.();
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to send email",
      );
    }
  };

  return (
    <div className="glass-panel flex h-full flex-col rounded-[32px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(15,118,110,0.12)] text-[var(--chat-primary-strong)]">
            <History className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">
              History
            </p>
          </div>
        </div>

        {onClosePanel ? (
          <button
            type="button"
            onClick={onClosePanel}
            className="glass-pill inline-flex h-10 w-10 items-center justify-center rounded-2xl text-[var(--shell-soft)] transition-colors hover:text-[var(--shell-ink)]"
            title="Hide history"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">

        <button
          type="button"
          onClick={loadMeetings}
          disabled={!user || isLoading}
          className="glass-subcard inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--shell-ink)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {!user ? (
        <div className="glass-subcard mt-5 rounded-[26px] px-4 py-5 text-sm leading-7 text-[var(--shell-soft)]">
          Sign in to see the meetings saved under your account and to email or
          export them later.
        </div>
      ) : isLoading ? (
        <div className="glass-subcard mt-5 rounded-[26px] px-4 py-5 text-sm text-[var(--shell-soft)]">
          Loading meetings...
        </div>
      ) : meetings.length === 0 ? (
        <div className="glass-subcard mt-5 rounded-[26px] px-4 py-5 text-sm leading-7 text-[var(--shell-soft)]">
          No meetings yet. Generate a recap and it will appear here
          automatically.
        </div>
      ) : (
        <div className="mt-5 flex-1 overflow-hidden">
          <div className="h-full space-y-3 overflow-y-auto pr-1">
            {meetings.map((meeting) => {
              const isActive = activeItemId === meeting.id;

              return (
                <div
                  key={meeting.id}
                  className={`glass-subcard rounded-[26px] p-4 transition-all ${
                    isActive
                      ? "ring-2 ring-[rgba(15,118,110,0.24)]"
                      : "hover:-translate-y-0.5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(meeting)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-[var(--shell-soft)]">
                          {formatDateTime(meeting.created_at)}
                        </p>
                        <p className="mt-2 truncate text-sm font-semibold text-[var(--shell-ink)]">
                          {meeting.title || `Meeting ${meeting.id}`}
                        </p>
                      </div>
                      <span className="glass-pill inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--chat-primary-strong)]">
                        {meeting.source || "saved"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[var(--shell-copy)]">
                      {String(meeting.summary || "").slice(0, 135)}
                      {String(meeting.summary || "").length > 135 ? "..." : ""}
                    </p>
                  </button>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleExportPdf(meeting.id, e)}
                      className="glass-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--shell-ink)] transition-colors hover:text-[var(--chat-primary-strong)]"
                      title="Export PDF"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSendEmail(meeting.id, e)}
                      className="glass-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--shell-ink)] transition-colors hover:text-[var(--chat-primary-strong)]"
                      title="Send Email"
                    >
                      <Mail className="h-3 w-3" />
                      Email
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(meeting.id, e)}
                      disabled={deletingId === meeting.id}
                      className="glass-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-55"
                      title="Delete Meeting"
                    >
                      <Trash2 className="h-3 w-3" />
                      {deletingId === meeting.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
