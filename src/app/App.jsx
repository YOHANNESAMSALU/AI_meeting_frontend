'use client';

import { useEffect, useState } from 'react';
import { Command, FileText, Headphones, Loader2, Sparkles } from 'lucide-react';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import Header from './components/Header';
import InputSection from './components/InputSection';
import SummaryCard from './components/SummaryCard';
import DecisionsCard from './components/DecisionsCard';
import ActionItemsCard from './components/ActionItemsCard';
import MeetingHistory from './components/MeetingHistory';
import LoadingSkeleton from './components/LoadingSkeleton';
import EmptyState from './components/EmptyState';
import Footer from './components/Footer';
import ResultsHeader from './components/ResultsHeader';
import ThreeBackground from './components/ThreeBackground';
import { summarizeMeetingNotes } from './components/audioUtils';
import { jsPDF } from 'jspdf';


// Helper to extract decisions and action items from transcript (basic demo)
function extractDecisionsAndActions(transcript) {
  const lines = transcript.split('\n').filter((line) => line.trim());
  const decisionKeywords = ['decided', 'agreed', 'approved', 'will', 'going to', 'confirmed'];
  const decisions = lines
    .filter((line) => decisionKeywords.some((keyword) => line.toLowerCase().includes(keyword)))
    .slice(0, 5)
    .map((line) => line.replace(/^[-•*]\s*/, ''));
  const actionVerbs = ['create', 'update', 'send', 'schedule', 'review', 'complete', 'finalize', 'prepare'];
  const names = ['Sarah', 'John', 'Mike', 'Emily', 'Alex', 'Lisa', 'David', 'Anna'];
  let actionItems = lines
    .filter((line) => {
      const lower = line.toLowerCase();
      return actionVerbs.some((verb) => lower.includes(verb)) || names.some((name) => line.includes(name));
    })
    .slice(0, 4)
    .map((line, index) => {
      const cleanLine = line.replace(/^[-•*]\s*/, '');
      let assignee = names[index % names.length];
      for (const name of names) {
        if (line.includes(name)) {
          assignee = name;
          break;
        }
      }
      return {
        task: cleanLine,
        assignee,
      };
    });
  return { decisions, actionItems };
}

export default function App() {
  const HISTORY_STORAGE_KEY = 'meeting-recaps-history-v1';
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [meetingHistory, setMeetingHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [attendees, setAttendees] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setMeetingHistory(parsed);
      }
    } catch (error) {
      console.error('Could not load meeting history:', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(meetingHistory));
  }, [meetingHistory]);

  const saveToHistory = (nextResults, sourceNotes) => {
    const nextItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      notes: sourceNotes,
      summary: nextResults.summary,
      decisions: nextResults.decisions,
      actionItems: nextResults.actionItems,
    };
    setActiveHistoryId(nextItem.id);
    setMeetingHistory((current) => [nextItem, ...current].slice(0, 20));
  };


  const handleGenerate = async () => {
    if (!notes.trim()) {
      return;
    }
    setIsLoading(true);
    setResults(null);
    try {
      const response = await summarizeMeetingNotes(notes);
      const fallback = extractDecisionsAndActions(response.transcript || notes);

      setResults({
        summary: response.summary,
        decisions: response.decisions?.length ? response.decisions : fallback.decisions,
        actionItems: response.actionItems?.length ? response.actionItems : fallback.actionItems,
      });
      saveToHistory(
        {
          summary: response.summary,
          decisions: response.decisions?.length ? response.decisions : fallback.decisions,
          actionItems: response.actionItems?.length ? response.actionItems : fallback.actionItems,
        },
        response.transcript || notes,
      );
    } catch (error) {
      console.error('Error processing notes:', error);
      toast.error(error instanceof Error ? error.message : 'We could not generate the recap right now.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle backend audio transcript/summary integration
  const handleAudioTranscript = (audioResult) => {
    if (!audioResult) return;
    setNotes(audioResult.transcript);
    const fallback = extractDecisionsAndActions(audioResult.transcript);
    setResults({
      summary: audioResult.summary,
      decisions: audioResult.decisions?.length ? audioResult.decisions : fallback.decisions,
      actionItems: audioResult.actionItems?.length ? audioResult.actionItems : fallback.actionItems,
    });
    saveToHistory(
      {
        summary: audioResult.summary,
        decisions: audioResult.decisions?.length ? audioResult.decisions : fallback.decisions,
        actionItems: audioResult.actionItems?.length ? audioResult.actionItems : fallback.actionItems,
      },
      audioResult.transcript,
    );
    setIsLoading(false);
  };

  const handleTryExample = (exampleNotes) => {
    setActiveHistoryId(null);
    setNotes(exampleNotes);
    window.scrollTo({ top: 10, behavior: 'smooth' });
  };

  const handleReset = () => {
    setActiveHistoryId(null);
    setNotes('');
    setResults(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistoryItem = (item) => {
    setActiveHistoryId(item.id);
    setNotes(item.notes || '');
    setResults({
      summary: item.summary || '',
      decisions: Array.isArray(item.decisions) ? item.decisions : [],
      actionItems: Array.isArray(item.actionItems) ? item.actionItems : [],
    });
    window.scrollTo({ top: 10, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    setActiveHistoryId(null);
    setMeetingHistory([]);
    toast.success('Meeting history cleared.');
  };

  const buildShareText = () => {
    if (!results) {
      return '';
    }
    const decisions = results.decisions.map((item) => `- ${item}`).join('\n') || '- None';
    const actionItems =
      results.actionItems.map((item) => `- ${item.task} (Assignee: ${item.assignee})`).join('\n') || '- None';

    return `Meeting Recap

Summary:
${results.summary}

Decisions:
${decisions}

Action Items:
${actionItems}`;
  };

  const handleExportPdf = () => {
    if (!results) {
      return;
    }

    const doc = new jsPDF();
    const pdfContent = buildShareText();
    const wrapped = doc.splitTextToSize(pdfContent, 180);
    doc.setFontSize(12);
    doc.text(wrapped, 15, 20);
    doc.save(`meeting-recap-${Date.now()}.pdf`);
    toast.success('PDF downloaded.');
  };

  const handleEmailSummary = () => {
    if (!results) {
      return;
    }

    const recipients = attendees
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean)
      .join(',');

    if (!recipients) {
      toast.error('Add at least one attendee email.');
      return;
    }

    const subject = encodeURIComponent('Meeting recap');
    const body = encodeURIComponent(buildShareText());
    window.location.href = `mailto:${recipients}?subject=${subject}&body=${body}`;
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
  }, [notes, isLoading]);

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <ThreeBackground />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_28%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
            <section className="space-y-6">
              <div className="space-y-6">
                <div className="rounded-[32px] border border-white/20 bg-[color:var(--surface-strong)] backdrop-blur-[20px] p-6 shadow-[0_10px_60px_rgba(249,115,22,0.15)]  sm:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-[var(--chat-primary-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">
                      AI meeting copilot
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--shell-line)] bg-white/70 px-3 py-1 text-xs text-[var(--shell-soft)]">
                      Chat-style workspace
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--shell-line)] bg-white/70 px-3 py-1 text-xs text-[var(--shell-soft)]">
                      Share-ready output
                    </span>
                  </div>

                  <div className="mt-5 max-w-3xl space-y-4">
                    <h1 className="text-3xl font-semibold tracking-tight text-[var(--shell-ink)] sm:text-3xl sm:leading-[1.05]">
                      Turn raw meeting chatter into a clean recap your team can drop into chat.
                    </h1>
                    <p className="max-w-2xl text-sm leading-7 text-[var(--shell-copy)] sm:text-base">
                      Paste notes, record a voice memo, or upload a call file. The app pulls out the summary,
                      confirmed decisions, and action items in a format that feels ready for Slack, Teams, or email.
                    </p>
                  </div>
                </div>

                <InputSection
                  notes={notes}
                  setNotes={setNotes}
                  onGenerate={handleGenerate}
                  isLoading={isLoading}
                  onAudioTranscript={handleAudioTranscript}
                />
              </div>

              <div className="space-y-6">
                {isLoading ? (
                  <div className="rounded-[28px] border border-white/20 bg-[color:var(--surface-strong)] backdrop-blur-[20px] p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.65)] ">
                    <div className="inline-flex items-center rounded-full bg-[var(--chat-primary-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">
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
                    results={results}
                  />
                ) : (
                  <EmptyState onTryExample={handleTryExample} />
                )}
              </div>
            </section>

            <aside className="xl:sticky xl:top-24 xl:h-[calc(100vh-7.5rem)]">
              <MeetingHistory
                items={meetingHistory}
                onSelect={handleSelectHistoryItem}
                onClear={handleClearHistory}
                activeItemId={activeHistoryId}
                onNewChat={handleReset}
              />
            </aside>

            {isLoading && <LoadingSkeleton />}

            {results && !isLoading && (
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <SummaryCard summary={results.summary} />
                <div className="space-y-6">
                  <DecisionsCard decisions={results.decisions} />
                  <ActionItemsCard actionItems={results.actionItems} />
                </div>
              </section>
            )}
          </div>
        </main>

        <Footer />
        <Toaster position="top-right" richColors closeButton />
      </div>
    </div>
  );
}
