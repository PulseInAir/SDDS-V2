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
  );
}
