"use client";

import { useEffect, useRef, useState } from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function CinematicEffects() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 0);

    const onMouseMove = (e: MouseEvent) => {
      // Global tracking for the live background
      document.documentElement.style.setProperty("--bg-mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--bg-mouse-y", `${e.clientY}px`);

      const target = e.target as HTMLElement;
      if (!target) return;

      // Find the closest glowing card or interactive panel
      const card = target.closest(
        ".interactive-panel, .compact-metric-link, .glow-card, a, button"
      ) as HTMLElement;

      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      }
    };

    const onClick = (e: MouseEvent) => {
      const id = rippleIdRef.current++;
      const newRipple: Ripple = {
        id,
        x: e.clientX,
        y: e.clientY,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation completes (500ms)
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 500);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Global Interactive Background */}
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        {/* Interactive Dot Grid */}
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            WebkitMaskImage: "radial-gradient(600px circle at var(--bg-mouse-x, 50vw) var(--bg-mouse-y, 50vh), black 10%, transparent 100%)",
            maskImage: "radial-gradient(600px circle at var(--bg-mouse-x, 50vw) var(--bg-mouse-y, 50vh), black 10%, transparent 100%)",
          }}
        />
        {/* Interactive Spotlight */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(800px circle at var(--bg-mouse-x, 50vw) var(--bg-mouse-y, 50vh), rgba(59, 130, 246, 0.08), transparent 80%)"
          }}
        />
      </div>

      {/* Click Ripple Effects */}
      <div className="ripple-container" aria-hidden="true">
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="ripple-ring"
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
              width: "120px",
              height: "120px",
            }}
          />
        ))}
      </div>
    </>
  );
}
