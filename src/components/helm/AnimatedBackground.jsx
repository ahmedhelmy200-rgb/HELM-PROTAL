
import React, { useEffect, useRef } from "react";

export default function AnimatedBackground({ active = true, intensity = 1, theme = "dark" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    let raf = 0;
    let width = 0;
    let height = 0;
    let lastFrame = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    const isMobile = window.innerWidth < 768;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const hw = navigator.hardwareConcurrency || 4;
    const perfFactor = isMobile ? 0.52 : hw <= 4 ? 0.72 : 1;
    const effectiveIntensity = Math.max(0.5, intensity * perfFactor);
    const targetFps = reducedMotion ? 18 : isMobile ? 28 : 42;
    const frameInterval = 1000 / targetFps;
    const pointer = { x: 0, y: 0, active: false };
    const bursts = [];
    const isLight = theme === "light";
    const nodeCount = Math.round((isMobile ? 28 : 52) * Math.min(1.2, effectiveIntensity));
    const nodes = Array.from({ length: nodeCount }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0002 * (0.8 + effectiveIntensity),
      vy: (Math.random() - 0.5) * 0.0002 * (0.8 + effectiveIntensity),
      pulse: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => { pointer.active = false; };
    const onPointerDown = (e) => {
      bursts.push({ x: e.clientX, y: e.clientY, born: performance.now(), size: 1 + Math.random() * 0.85 });
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };

    const drawBurst = (burst, now) => {
      const age = now - burst.born;
      if (age > 780) return false;
      const progress = age / 780;
      const radius = 22 + progress * 110 * burst.size;
      const alpha = 0.54 * (1 - progress);
      const glow = isLight ? `rgba(37,99,235,${alpha})` : `rgba(109,184,255,${alpha})`;
      const edge = isLight ? `rgba(14,165,233,${alpha * 0.95})` : `rgba(45,212,191,${alpha})`;

      ctx.beginPath();
      ctx.strokeStyle = glow;
      ctx.lineWidth = 1.5;
      ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      const spikes = isMobile ? 6 : 10;
      for (let i = 0; i < spikes; i++) {
        const angle = (Math.PI * 2 * i) / spikes + progress * 1.2;
        const len = 16 + 44 * (1 - progress) * burst.size;
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(burst.x, burst.y);
        ctx.lineTo(burst.x + Math.cos(angle) * len, burst.y + Math.sin(angle) * len);
        ctx.stroke();
      }
      return true;
    };

    const draw = (t) => {
      if (t - lastFrame < frameInterval) {
        raf = window.requestAnimationFrame(draw);
        return;
      }
      lastFrame = t;
      ctx.clearRect(0, 0, width, height);
      const lineBase = isLight ? 0.2 : 0.31;
      const dotBase = isLight ? 0.5 : 0.8;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.012;
        if (n.x <= 0 || n.x >= 1) n.vx *= -1;
        if (n.y <= 0 || n.y >= 1) n.vy *= -1;
        const dx = pointer.x - n.x * width;
        const dy = pointer.y - n.y * height;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (pointer.active && dist < (isMobile ? 120 : 190)) {
          n.x += (dx / width) * 0.00018 * effectiveIntensity;
          n.y += (dy / height) * 0.00018 * effectiveIntensity;
        }
      }

      const projected = nodes.map((n) => ({ x: n.x * width, y: n.y * height, pulse: n.pulse }));
      const threshold = pointer.active ? (isMobile ? 118 : 162) : (isMobile ? 96 : 132);

      for (let i = 0; i < projected.length; i++) {
        const a = projected[i];
        for (let j = i + 1; j < projected.length; j++) {
          const b = projected[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < threshold) {
            const alpha = (1 - dist / threshold) * lineBase;
            ctx.strokeStyle = isLight ? `rgba(37,99,235,${alpha})` : `rgba(93,163,255,${alpha})`;
            ctx.lineWidth = dist < 56 ? 1.2 : 0.72;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            if ((pointer.active || bursts.length) && Math.random() < 0.018 * effectiveIntensity && dist < 84) {
              ctx.strokeStyle = isLight ? 'rgba(56,118,255,0.22)' : 'rgba(126,194,255,0.32)';
              ctx.lineWidth = 1.9;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo((a.x + b.x) / 2 + (Math.random() - 0.5) * 12, (a.y + b.y) / 2 + (Math.random() - 0.5) * 12);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      for (const p of projected) {
        const radius = 1.15 + Math.sin(p.pulse + t * 0.0016) * 0.4;
        ctx.beginPath();
        ctx.fillStyle = isLight ? `rgba(37,99,235,${dotBase})` : `rgba(135,190,255,${dotBase})`;
        ctx.shadowBlur = isMobile ? 4 : 8;
        ctx.shadowColor = isLight ? 'rgba(59,130,246,0.24)' : 'rgba(107,177,255,0.4)';
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (pointer.active) {
        const sparkCount = isMobile ? 4 : 7;
        for (let i = 0; i < sparkCount; i++) {
          const angle = (Math.PI * 2 * i) / sparkCount + t * 0.002;
          const length = 12 + Math.sin(t * 0.006 + i) * 8;
          ctx.strokeStyle = isLight ? 'rgba(56,118,255,0.22)' : 'rgba(126,194,255,0.33)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(pointer.x + Math.cos(angle) * length, pointer.y + Math.sin(angle) * length);
          ctx.stroke();
        }
      }

      for (let i = bursts.length - 1; i >= 0; i--) {
        const alive = drawBurst(bursts[i], performance.now());
        if (!alive) bursts.splice(i, 1);
      }

      ctx.shadowBlur = 0;
      raf = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    raf = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [active, intensity, theme]);

  return <canvas ref={canvasRef} className="animated-electric-bg" aria-hidden="true" />;
}
