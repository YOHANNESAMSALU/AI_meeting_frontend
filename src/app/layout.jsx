import '../styles/index.css';


export const metadata = {
  title: 'AI Meeting Notes',
  description: 'Turn meeting transcripts and audio into summaries, decisions, and action items.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--shell-base)] text-[var(--shell-ink)] antialiased">
      
        {children}
      </body>
    </html>
  );
}