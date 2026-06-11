'use client';

import { useEffect, useState } from 'react';
import { Command, FileText, Headphones, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import Header from './components/Header';
import InputSection from './components/InputSection';
import SummaryCard from './components/SummaryCard';
import DecisionsCard from './components/DecisionsCard';
import MeetingHistory from './components/MeetingHistory';
import LoadingSkeleton from './components/LoadingSkeleton';
import EmptyState from './components/EmptyState';
import Footer from './components/Footer';
import ResultsHeader from './components/ResultsHeader';
import ThreeBackground from './components/ThreeBackground';
import AuthModal from './components/AuthModal';
import { summarizeMeetingNotes } from './components/audioUtils';
import "../styles/app.css";

import {
  getStoredUser,
  getAccessToken,
  clearStoredSession,
  validateToken,
  fetchCurrentUser,
  exportMeetingPdf,
  sendMeetingEmail,
  isUnauthorizedError,
  setAccessToken,
} from './lib/api';

function extractDecisionsAndActions(transcript) {
  const lines = transcript.split('\n').filter((line) => line.trim());
  const decisionKeywords = ['decided', 'agreed', 'approved', 'will', 'going to', 'confirmed'];
  const decisions = lines
    .filter((line) => decisionKeywords.some((keyword) => line.toLowerCase().includes(keyword)))
    .slice(0, 5)
    .map((line) => line.replace(/^[-•*]\s*/, ''));
  const actionVerbs = ['create', 'update', 'send', 'schedule', 'review', 'complete', 'finalize', 'prepare'];

  const actionItems = lines
    .filter((line) => {
      const lower = line.toLowerCase();
      return actionVerbs.some((verb) => lower.includes(verb));
    })
    .slice(0, 4)
    .map((line) => {
      const cleanLine = line.replace(/^[-•*]\s*/, '');
      return {
        task: cleanLine,
        assignee: 'Unassigned',
      };
    });

  return { decisions, actionItems };
}

function buildMeetingFileName(meeting) {
  const baseValue = String(meeting?.title || `meeting-${meeting?.id || Date.now()}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${baseValue || 'meeting-recap'}.pdf`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
}

function readAuthTokenFromLocation() {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);
  const candidates = [
    url.searchParams.get('access_token'),
    url.searchParams.get('accessToken'),
    url.searchParams.get('token'),
    url.searchParams.get('sessionToken'),
    url.searchParams.get('code'),
  ].filter(Boolean);

  if (candidates.length > 0) {
    return candidates[0].trim();
  }

  if (url.hash.startsWith('#')) {
    const hashParams = new URLSearchParams(url.hash.slice(1));
    const hashToken = hashParams.get('access_token') || hashParams.get('token');
    if (hashToken) {
      return hashToken.trim();
    }
  }

  return '';
}

function clearAuthTokenFromLocation() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  const params = url.searchParams;
  [
    'access_token',
    'accessToken',
    'token',
    'sessionToken',
    'reset_token',
    'code',
  ].forEach((key) => params.delete(key));

  const nextUrl = `${url.pathname}${params.toString() ? `?${params.toString()}` : ''}${url.hash || ''}`;
  window.history.replaceState({}, '', nextUrl);
}

export default function App() {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeMeetingId, setActiveMeetingId] = useState(null);
  const [attendees, setAttendees] = useState('');
  const [attachPdfToEmail, setAttachPdfToEmail] = useState(true);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = readAuthTokenFromLocation();

      if (authToken) {
        setAccessToken(authToken);

        try {
          const validUser = await fetchCurrentUser();
          setUser(validUser);
          clearAuthTokenFromLocation();
          return;
        } catch (error) {
          clearStoredSession();
          clearAuthTokenFromLocation();
          toast.error('We could not complete sign-in. Please try again.');
        }
      }

      const storedToken = getAccessToken();
      const storedUser = getStoredUser();

      if (!storedUser && !storedToken) {
        return;
      }

      try {
        const validUser = await validateToken();
        setUser(validUser);
      } catch (error) {
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  const handleSessionExpired = ({ notify = true } = {}) => {
    clearStoredSession();
    setUser(null);
    setShowAuthModal(true);

    if (notify) {
      toast.error('Your session expired. Please sign in again.');
    }
  };

  const saveToHistory = (nextResults) => {
    if (nextResults.meeting?.id) {
      setActiveMeetingId(nextResults.meeting.id);
    }
  };

  const closeHistoryPanelOnMobile = () => {
    if (isMobileViewport()) {
      setIsHistoryOpen(false);
    }
  };

  const handleGenerate = async () => {
    if (!notes.trim()) {
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const response = await summarizeMeetingNotes(notes);
      const fallback = extractDecisionsAndActions(response.transcript || notes);
      const nextResults = {
        summary: response.summary,
        decisions: response.decisions?.length ? response.decisions : fallback.decisions,
        // actionItems removed: backend does not provide action items
        meeting: response.meeting,
      };

      setResults(nextResults);
      saveToHistory(nextResults);
      setIsHistoryOpen(true);
    } catch (error) {
      console.error('Error processing notes:', error);
      if (isUnauthorizedError(error)) {
        handleSessionExpired();
        return;
      }
      toast.error(error instanceof Error ? error.message : 'We could not generate the recap right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioTranscript = (audioResult) => {
    if (!audioResult) {
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const fallback = extractDecisionsAndActions(audioResult.transcript);
    const nextResults = {
      summary: audioResult.summary,
      decisions: audioResult.decisions?.length ? audioResult.decisions : fallback.decisions,
      // actionItems removed: backend does not provide action items
      meeting: audioResult.meeting,
    };

    setNotes(audioResult.transcript);
    setResults(nextResults);
    saveToHistory(nextResults);
    setIsLoading(false);
    setIsHistoryOpen(true);
  };

  const handleTryExample = (exampleNotes) => {
    setActiveMeetingId(null);
    setNotes(exampleNotes);
    window.scrollTo({ top: 10, behavior: 'smooth' });
  };

  const handleReset = () => {
    setActiveMeetingId(null);
    setNotes('');
    setResults(null);
    setAttendees('');
    setAttachPdfToEmail(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistoryItem = (meeting) => {
    setActiveMeetingId(meeting.id);
    setNotes(meeting.transcription || '');
    setResults({
      summary: meeting.summary || '',
      decisions: [],
      meeting,
    });
    closeHistoryPanelOnMobile();
    window.scrollTo({ top: 10, behavior: 'smooth' });
  };

  const handleAuthSuccess = async (authenticatedUser = null) => {
    if (authenticatedUser) {
      setUser(authenticatedUser);
    }

    try {
      const userData = await fetchCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to fetch user:', error);

      if (isUnauthorizedError(error)) {
        handleSessionExpired();
        throw error;
      }

      if (authenticatedUser) {
        return authenticatedUser;
      }

      throw error;
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    setUser(null);
    setResults(null);
    setNotes('');
    setAttendees('');
    setActiveMeetingId(null);
    toast.success('Logged out successfully');
  };

  const handleExportPdf = async () => {
    if (!results) {
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!results.meeting?.id) {
      toast.error('This recap has not been saved yet. Generate it again while signed in to export the API PDF.');
      return;
    }

    setIsExportingPdf(true);

    try {
      const blob = await exportMeetingPdf(results.meeting.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = buildMeetingFileName(results.meeting);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully.');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      if (isUnauthorizedError(error)) {
        handleSessionExpired();
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Failed to export PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleEmailSummary = async () => {
    if (!results) {
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!results.meeting?.id) {
      toast.error('Generate a saved recap before emailing attendees.');
      return;
    }

    const attendeesList = attendees
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    if (!attendeesList.length) {
      toast.error('Add at least one attendee email.');
      return;
    }

    const invalidEmails = attendeesList.filter((email) => !isValidEmail(email));

    if (invalidEmails.length) {
      toast.error(`Invalid email address: ${invalidEmails[0]}`);
      return;
    }

    setIsSendingEmail(true);

    try {
      await sendMeetingEmail(results.meeting.id, attendeesList, attachPdfToEmail);
      toast.success(`Recap emailed to ${attendeesList.length} attendee${attendeesList.length > 1 ? 's' : ''}.`);
    } catch (error) {
      console.error('Failed to send email:', error);
      if (isUnauthorizedError(error)) {
        handleSessionExpired();
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (notes.trim() && !isLoading) {
          handleGenerate();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes, isLoading, user]);

  const canShareMeeting = Boolean(user && results?.meeting?.id);

return (
  <div className="relative isolate min-h-screen overflow-hidden">
    <ThreeBackground />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_28%)]" />

    <div className="flex h-screen flex-col">
      {/* Sticky Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onShowAuth={() => setShowAuthModal(true)}
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sticky Sidebar */}
        {isHistoryOpen && (
          <aside className="hidden lg:flex w-[340px] flex-shrink-0 border-r border-[var(--chat-primary)]/10 bg-white/80 backdrop-blur-xl overflow-hidden">
            <div className="h-full w-full p-4 sm:p-5">
              <MeetingHistory
                onSelect={handleSelectHistoryItem}
                onNewChat={handleReset}
                user={user}
                activeItemId={activeMeetingId}
                onAuthError={handleSessionExpired}
                onClosePanel={() => setIsHistoryOpen(false)}
              />
            </div>
          </aside>
        )}

        {/* Mobile Sidebar */}
        {isHistoryOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsHistoryOpen(false)}
              aria-label="Close meeting history"
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-[min(92vw,380px)] lg:hidden">
              <div className="h-full bg-white/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="h-full p-4 sm:p-5">
                  <MeetingHistory
                    onSelect={handleSelectHistoryItem}
                    onNewChat={handleReset}
                    user={user}
                    activeItemId={activeMeetingId}
                    onAuthError={handleSessionExpired}
                    onClosePanel={() => setIsHistoryOpen(false)}
                  />
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1720px] px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-8">
            {/* Your existing content goes here */}
            <section className="space-y-6">
              <div className="glass-panel rounded-[34px] p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                  <span className="glass-pill inline-flex items-center rounded-full bg-[var(--chat-primary-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">
                    AI meeting copilot
                  </span>
                  <span className="glass-pill inline-flex items-center rounded-full px-3 py-1 text-xs text-[var(--shell-soft)]">
                    Left-nav archive
                  </span>
                  <span className="glass-pill inline-flex items-center rounded-full px-3 py-1 text-xs text-[var(--shell-soft)]">
                    API-powered sharing
                  </span>
                </div>

                <div className="mt-5 max-w-4xl space-y-4">
                  <h1 className="text-3xl font-semibold tracking-tight text-[var(--shell-ink)] sm:text-4xl sm:leading-[1.02]">
                    Turn raw meeting chatter into a polished recap with history, exports, and attendee delivery built in.
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-[var(--shell-copy)] sm:text-base">
                    Paste notes, record a voice memo, or upload a call file. The workspace pulls out a summary, decisions, and action items, then lets you reopen older meetings from the left.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="glass-subcard rounded-2xl px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(15,118,110,0.12)] text-[var(--chat-primary-strong)]">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--shell-ink)]">Text-first drafting</p>
                        <p className="text-xs leading-5 text-[var(--shell-soft)]">Paste raw notes and shape them into a share-ready update.</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-subcard rounded-2xl px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(249,115,22,0.12)] text-[#c2410c]">
                        <Headphones className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--shell-ink)]">Audio capture</p>
                        <p className="text-xs leading-5 text-[var(--shell-soft)]">Record or upload, then push the transcript right back into the composer.</p>
                      </div>
                    </div>
                  </div>

                  
                </div>
              </div>

              <InputSection
                notes={notes}
                setNotes={setNotes}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                onAudioTranscript={handleAudioTranscript}
                user={user}
                onAuthError={() => handleSessionExpired()}
              />
            </section>
 {isLoading && <LoadingSkeleton />}

            {results && !isLoading && (
              <section className="mt-6 mb-4 space-y-6">
                <SummaryCard summary={results.summary} />
                {/* <div className="space-y-6">
                  <DecisionsCard decisions={results.decisions} />
                </div> */}
              </section>
            )}
            {/* Results Section */}
         <section className="space-y-6">
              {isLoading ? (
                <div className="glass-panel rounded-[30px] p-6">
                  <div className="glass-pill inline-flex items-center rounded-full bg-[var(--chat-primary-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">
                    Generating now
                  </div>
                  <div className="mt-4 flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--shell-ink)] text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.9)]">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-[var(--shell-ink)]">Shaping the recap</h2>
                      <p className="text-sm leading-7 text-[var(--shell-copy)]">
                        We are organizing the conversation into one summary, a decisions list, and an action queue.
                      </p>
                    </div>
                  </div>
                </div>
              ) : results ? (
                <ResultsHeader
                  onReset={handleReset}
                  onExportPdf={handleExportPdf}
                  onEmailSummary={handleEmailSummary}
                  attendees={attendees}
                  setAttendees={setAttendees}
                  attachPdfToEmail={attachPdfToEmail}
                  setAttachPdfToEmail={setAttachPdfToEmail}
                  results={results}
                  canShareMeeting={canShareMeeting}
                  isSendingEmail={isSendingEmail}
                  isExportingPdf={isExportingPdf}
                />
              ) : (
                <EmptyState onTryExample={handleTryExample} />
              )}
            </section> 
          </div>
        </main>
      </div>
    </div>

    {/* Footer, Modals, Toaster */}
    <Footer />
    <AuthModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      onAuthSuccess={handleAuthSuccess}
    />
    <Toaster position="top-right" richColors closeButton />
  </div>
);
}
