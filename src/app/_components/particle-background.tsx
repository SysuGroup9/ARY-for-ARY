"use client";

import { useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   ParticleBackground v4
   方案一 Constellation — 光点 + 连线网络（结构感）
   方案二 Drift        — 大柔光团漂浮（氛围感）
   ═══════════════════════════════════════════════════════════════ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
}

type Mode = "constellation" | "drift";

interface Props { mode?: Mode; onParticleClick?: (e: MouseEvent) => void; }

/* ── 真空区 ── */
function inSafeZone(x: number, y: number, w: number, h: number): boolean {
  return x > w * 0.25 && x < w * 0.75 && y > h * 0.20 && y < h * 0.80;
}

/* ═══════════════════════════════════════════════════════════════
   方案一：Constellation — 光点 + 连线，类星图网络
   30 颗亮蓝色光点 + 160px 内连线，边缘聚集
   ═══════════════════════════════════════════════════════════════ */
function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);

  const init = useCallback((w: number, h: number) => {
    const count = 30;
    const arr: Particle[] = [];
    let tries = 0;
    while (arr.length < count && tries < count * 15) {
      tries++;
      const x = Math.random() * w;
      const y = Math.random() * h;
      if (inSafeZone(x, y, w, h)) continue;
      arr.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: 2.5 + Math.random() * 2,
        hue: Math.random(),
      });
    }
    particlesRef.current = arr;
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      cvs.width = w; cvs.height = h;
      init(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMouse);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const { x: mx, y: my } = mouseRef.current;
      const ps = particlesRef.current;

      // ── 连线 ──
      for (let i = 0; i < ps.length; i++) {
        const a = ps[i];
        if (inSafeZone(a.x, a.y, w, h)) continue;
        for (let j = i + 1; j < ps.length; j++) {
          const b = ps[j];
          if (inSafeZone(b.x, b.y, w, h)) continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.15;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(35,98,255,${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // ── 光点 ──
      for (const p of ps) {
        // 鼠标吸引
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          const f = (200 - dist) / 200 * 0.004;
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }

        // 真空区排斥
        if (inSafeZone(p.x, p.y, w, h)) {
          const cx = w / 2, cy = h / 2;
          const px = p.x - cx, py = p.y - cy;
          const pd = Math.sqrt(px * px + py * py) || 1;
          p.vx += (px / pd) * 0.12;
          p.vy += (py / pd) * 0.12;
        }

        p.vx *= 0.995; p.vy *= 0.995;
        p.x += p.vx; p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));

        // 实心亮核 + 发光晕
        const r = p.radius;
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        grd.addColorStop(0, `rgba(35,98,255,${0.55 + p.hue * 0.25})`);
        grd.addColorStop(0.3, `rgba(35,98,255,${0.35 + p.hue * 0.2})`);
        grd.addColorStop(1, "rgba(35,98,255,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      cancelAnimationFrame(rafRef.current);
    };
  }, [init]);

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", top: 0, left: 0,
      width: "100vw", height: "100vh",
      zIndex: 0, pointerEvents: "none",
    }} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   方案二：Data Drift — 方形碎片从底部上升 + 点击波纹
   30 颗小方块（4-7px）从底部边缘区域漂起
   ═══════════════════════════════════════════════════════════════ */
function DriftCanvas({ onParticleClick }: { onParticleClick?: (e: MouseEvent) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const particlesRef = useRef<Particle[]>([]);
  const poolRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const hoverRef = useRef<Particle | null>(null); // for visual feedback

  const acquire = useCallback((): Particle => {
    const p = poolRef.current.pop();
    // 从底部左右两侧生成，避开中央真空区
    const side = Math.random() < 0.5;
    const w = window.innerWidth;
    const x = side ? Math.random() * w * 0.2 : w * 0.8 + Math.random() * w * 0.2;
    const y = window.innerHeight + 10;
    if (p) {
      p.x = x; p.y = y;
      p.vx = (Math.random() - 0.5) * 0.3;
      p.vy = -(0.2 + Math.random() * 0.4);
      p.radius = 4 + Math.random() * 3;
      p.hue = Math.random();
      return p;
    }
    return { x, y, vx: (Math.random() - 0.5) * 0.3, vy: -(0.2 + Math.random() * 0.4), radius: 4 + Math.random() * 3, hue: Math.random() };
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    let clickRipples: { x: number; y: number; age: number; ps: { x: number; y: number; vx: number; vy: number; r: number }[] }[] = [];

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      cvs.width = w; cvs.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      // Hit test: is mouse near a particle?
      const ps = particlesRef.current;
      let hit: Particle | null = null;
      for (const p of ps) {
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < 24) { hit = p; break; }
      }
      hoverRef.current = hit;
    };
    const onClick = (e: MouseEvent) => {
      // Normal click → ripple only, no rider card
      const burst: typeof clickRipples[0] = { x: e.clientX, y: e.clientY, age: 0, ps: [] };
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const s = 1.2 + Math.random();
        burst.ps.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 3 + Math.random() * 3 });
      }
      clickRipples.push(burst);
    };
    const onContextMenu = (e: MouseEvent) => {
      // Right-click on or near a particle → show rider card
      const ps = particlesRef.current;
      let hit = false;
      for (const p of ps) {
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < 32) { hit = true; break; }
      }
      if (hit) {
        e.preventDefault();
        onParticleClick?.(e);
      }
    };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("click", onClick);
    window.addEventListener("contextmenu", onContextMenu);

    let spawnTick = 0;

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;

      // 生成新粒子
      spawnTick++;
      if (spawnTick > 4 && particles.length < 30) {
        particles.push(acquire());
        spawnTick = 0;
      }

      // 更新 & 绘制
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // 若进入中央真空区，加速横向避开
        if (inSafeZone(p.x, p.y, w, h)) {
          p.vx *= 1.03;
        }

        p.x += p.vx; p.y += p.vy;

        // 出屏回收
        if (p.y < -30 || p.x < -30 || p.x > w + 30) {
          particles.splice(i, 1);
          poolRef.current.push(p);
          continue;
        }

        // 画小方块 — 可见度高。若已充电则放大+发光
        const isCharged = hoverRef.current === p;
        const alpha = isCharged ? 0.65 : (0.25 + p.hue * 0.2);
        const sz = isCharged ? p.radius * 3 : p.radius;
        // Glow halo for charged
        if (isCharged) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 2);
          g.addColorStop(0, `rgba(35,98,255,0.5)`);
          g.addColorStop(0.5, `rgba(35,98,255,0.15)`);
          g.addColorStop(1, "rgba(35,98,255,0)");
          ctx.fillStyle = g;
          ctx.fillRect(p.x - sz * 2, p.y - sz * 2, sz * 4, sz * 4);
        }
        ctx.fillStyle = `rgba(35,98,255,${alpha.toFixed(2)})`;
        ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
      }

      // 点击波纹
      for (let r = clickRipples.length - 1; r >= 0; r--) {
        const ripple = clickRipples[r];
        ripple.age += 0.016;
        const prog = ripple.age / 1.2;
        if (prog >= 1) { clickRipples.splice(r, 1); continue; }
        for (const bp of ripple.ps) {
          bp.x += bp.vx * (1 - prog) * 2;
          bp.y += bp.vy * (1 - prog) * 2;
          ctx.fillStyle = `rgba(35,98,255,${(1 - prog) * 0.35})`;
          ctx.beginPath();
          ctx.arc(bp.x, bp.y, bp.r * (1 - prog), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("click", onClick);
      window.removeEventListener("contextmenu", onContextMenu);
      cancelAnimationFrame(rafRef.current);
    };
  }, [acquire]);

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", top: 0, left: 0,
      width: "100vw", height: "100vh",
      zIndex: 0, pointerEvents: "auto",
    }} />
  );
}

/* ── 导出 ── */
export default function ParticleBackground({ mode = "constellation", onParticleClick }: Props) {
  if (mode === "constellation") return <ConstellationCanvas />;
  if (mode === "drift") return <DriftCanvas onParticleClick={onParticleClick} />;
  return null;
}
