import React, { useEffect, useRef } from 'react';

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: 0, y: 0 });
  const starsRef  = useRef<Array<{ x: number; y: number; r: number; vx: number; vy: number; alpha: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // স্টারের সংখ্যা এবং প্রোপার্টি সেট করা
    starsRef.current = Array.from({ length: 220 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.8 + 0.3,
      vx:    (Math.random() - 0.5) * 0.15,
      vy:    (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.6 + 0.4,
    }));

    const ctx = canvas.getContext('2d')!;
    let frameId: number;

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      const mx = mouseRef.current.x / w - 0.5;
      const my = mouseRef.current.y / h - 0.5;

      ctx.clearRect(0, 0, w, h);

      // ব্যাকগ্রাউন্ড গ্রাডিয়েন্ট
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, Math.max(w, h));
      bg.addColorStop(0,   '#0a1628');
      bg.addColorStop(0.4, '#060d1f');
      bg.addColorStop(1,   '#020408');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // স্টার অ্যানিমেশন (প্যারালাক্স ইফেক্টসহ)
      starsRef.current.forEach(star => {
        star.x += star.vx + mx * 0.4 * star.r;
        star.y += star.vy + my * 0.4 * star.r;

        if (star.x < 0)  star.x = w;
        if (star.x > w)  star.x = 0;
        if (star.y < 0)  star.y = h;
        if (star.y > h)  star.y = 0;

        star.alpha += (Math.random() - 0.5) * 0.02;
        star.alpha = Math.max(0.2, Math.min(1, star.alpha));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
      });

      frameId = requestAnimationFrame(draw);
    }

    frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: '520px' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ background: '#020408' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020408]/80" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
        <h1 className="font-extrabold leading-tight max-w-3xl text-white" style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)' }}>
          Be a witness to our top notch <span className="text-emerald-400">'SAROTHI'</span> experience yourself
        </h1>
        <p className="max-w-2xl text-gray-300 text-lg">
          Instead of wandering from place to place, get all your study materials in one place — just at <span className="text-blue-400 font-bold">'SAROTHI'</span>
        </p>
        <div className="flex flex-wrap gap-4 mt-2">
          <a href="/hsc" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all">📚 HSC / SSC Classes</a>
          <a href="/admission" className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-sm transition-all">🎓 Admission Classes</a>
        </div>
      </div>
    </section>
  );
}
