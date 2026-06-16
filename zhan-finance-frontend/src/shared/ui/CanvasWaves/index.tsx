import { useEffect, useRef } from 'react';

export function CanvasWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#F5F5DC'); // brand-beige
      gradient.addColorStop(1, '#E2E8F0'); // brand-accent
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle wave
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      
      for (let i = 0; i < canvas.width; i++) {
        ctx.lineTo(
          i,
          canvas.height / 2 + Math.sin(i * 0.002 + time) * 100 + Math.sin(i * 0.005 - time * 0.5) * 50
        );
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      
      ctx.fillStyle = 'rgba(0, 86, 45, 0.03)'; // subtle brand-green
      ctx.fill();

      // Second wave
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2 + 100);
      
      for (let i = 0; i < canvas.width; i++) {
        ctx.lineTo(
          i,
          canvas.height / 2 + 100 + Math.cos(i * 0.003 - time) * 80
        );
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      
      ctx.fillStyle = 'rgba(0, 86, 45, 0.02)';
      ctx.fill();

      time += 0.01;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}
