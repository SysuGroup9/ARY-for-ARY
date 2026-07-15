"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  direction?: "left" | "right";
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const KEYFRAMES = `
@keyframes scroll-right { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes scroll-left  { from { transform: translateX(-50%); } to { transform: translateX(0); } }
`;
let injected = false;

export default function AutoScroll({
  children, direction = "right", speed = 30,
  pauseOnHover = true, className = "", style,
}: Props) {
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (injected) return;
    const s = document.createElement("style");
    s.textContent = KEYFRAMES;
    document.head.appendChild(s);
    injected = true;
  }, []);

  return (
    <div className={`h-scroll ${className}`} ref={ref}
      style={{ ...style, overflow: "hidden" }}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      <div style={{
        display: "flex",
        animation: `${direction === "right" ? "scroll-right" : "scroll-left"} ${speed}s linear infinite`,
        animationPlayState: paused ? "paused" : "running",
        transform: "translate3d(0,0,0)",
      }}>
        {children}
        {children}
      </div>
    </div>
  );
}
