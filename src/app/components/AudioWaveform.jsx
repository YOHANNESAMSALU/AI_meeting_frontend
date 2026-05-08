import { useEffect, useRef } from 'react';

export default function AudioWaveform({ isActive = false, isPaused = false }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const barsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext('2d');
    const barCount = 40;
    const barWidth = 3;
    const barGap = 2;

    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: barCount }, () => ({
        height: Math.random() * 0.5 + 0.2,
        targetHeight: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 0.05 + 0.02,
      }));
    }

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;
      context.clearRect(0, 0, width, height);

      const totalBarWidth = barCount * (barWidth + barGap);
      const startX = (width - totalBarWidth) / 2;

      barsRef.current.forEach((bar, index) => {
        if (isActive && !isPaused) {
          if (Math.abs(bar.height - bar.targetHeight) < 0.01) {
            bar.targetHeight = Math.random() * 0.7 + 0.3;
          }
          bar.height += (bar.targetHeight - bar.height) * bar.speed;
        } else if (!isActive) {
          bar.height += (0.2 - bar.height) * 0.1;
        }

        const barHeight = bar.height * height * 0.8;
        const x = startX + index * (barWidth + barGap);
        const y = (height - barHeight) / 2;
        const gradient = context.createLinearGradient(x, y, x, y + barHeight);

        if (isActive && !isPaused) {
          gradient.addColorStop(0, '#14b8a6');
          gradient.addColorStop(1, '#0f766e');
        } else if (isPaused) {
          gradient.addColorStop(0, '#fb923c');
          gradient.addColorStop(1, '#ea580c');
        } else {
          gradient.addColorStop(0, '#cbd5e1');
          gradient.addColorStop(1, '#94a3b8');
        }

        context.fillStyle = gradient;
        context.fillRect(x, y, barWidth, barHeight);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isPaused]);

  return <canvas ref={canvasRef} width={300} height={80} className="mx-auto max-w-full" />;
}
