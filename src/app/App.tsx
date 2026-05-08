import AppContent from './App.jsx';
import ThreeBackground from './components/ThreeBackground.jsx';
export default function App() {
  return (
    <div className="relative min-h-screen">
      <ThreeBackground />
<div className="absolute inset-0 bg-white/40 backdrop-blur-sm -z-0" />
     <div className="relative z-10 animate-in fade-in duration-700">
        <AppContent />
      </div>
    </div>
  );
}