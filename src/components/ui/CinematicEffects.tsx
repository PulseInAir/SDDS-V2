"use client";

import { useEffect, useRef, useState } from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function CinematicEffects() {
  const [isHovering, setIsHovering] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const rippleIdRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Disable custom cursor on mobile (pointer: coarse) or for reduced motion
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isMobile || prefersReducedMotion) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 0);

    const onMouseMove = (e: MouseEvent) => {

      // Update global CSS variables for card background glows
      document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);

      // Update positions of cursor follower elements directly using ref transforms
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Check if mouse is hovering over an interactive element
      const isInteractive =
        target.closest("a") ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("select") ||
        target.closest("textarea") ||
        target.closest(".interactive-panel") ||
        target.closest(".compact-metric-link") ||
        target.getAttribute("role") === "button" ||
        target.getAttribute("role") === "link";

      setIsHovering(!!isInteractive);
    };

    const onClick = (e: MouseEvent) => {
      const id = rippleIdRef.current++;
      const newRipple: Ripple = {
        id,
        x: e.clientX,
        y: e.clientY,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation completes (600ms)
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseOver);
    window.addEventListener("click", onClick);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("click", onClick);
    };

  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Outer ring */}
      <div
        ref={ringRef}
        className={`custom-cursor-ring ${isHovering ? "hovering" : ""}`}
        aria-hidden="true"
      />
      {/* Inner dot */}
      <div
        ref={dotRef}
        className={`custom-cursor-dot ${isHovering ? "hovering" : ""}`}
        aria-hidden="true"
      />
      {/* Ripple container */}
      <div className="ripple-container" aria-hidden="true">
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="ripple-ring"
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
              width: "150px",
              height: "150px",
            }}
          />
        ))}
      </div>
    </>
  );
}
