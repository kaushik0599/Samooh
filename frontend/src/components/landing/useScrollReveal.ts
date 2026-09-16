"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades content in once it scrolls into view via IntersectionObserver
 * (no animation library — the whole landing page stays dependency-free).
 * Respects `prefers-reduced-motion: reduce` by skipping straight to the
 * visible state. Reused by `ScrollReveal` and applied directly where a
 * section needs the ref on an element it already renders (e.g. a `<li>`).
 */
export function useScrollReveal<T extends HTMLElement>(
  threshold = 0.15,
  rootMargin = "0px 0px -40px 0px"
) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}
