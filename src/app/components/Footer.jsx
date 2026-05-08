export default function Footer() {
  return (
    <footer className="border-t border-white/60 bg-white/45 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-[var(--shell-soft)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>AI Meeting Notes workspace for summaries, decisions, and action items.</p>
        <p>Now running on Next.js and Tailwind CSS.</p>
      </div>
    </footer>
  );
}
