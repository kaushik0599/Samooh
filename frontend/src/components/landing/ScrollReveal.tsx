"use client";

import { createElement, type ElementType, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import { useScrollReveal } from "./useScrollReveal";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Element/tag to render — defaults to a div, pass "li" inside an <ol>/<ul>, etc. */
  as?: ElementType;
  /** Stagger offset in ms, for rows/grids of cards revealing in sequence. */
  delayMs?: number;
  /** "fade-up" (default) for text/cards, "fade-scale" for framed visuals. */
  variant?: "fade-up" | "fade-scale";
}

const HIDDEN_CLASSES: Record<NonNullable<ScrollRevealProps["variant"]>, string> = {
  "fade-up": "translate-y-3 opacity-0",
  "fade-scale": "scale-[0.98] opacity-0",
};

const VISIBLE_CLASSES: Record<NonNullable<ScrollRevealProps["variant"]>, string> = {
  "fade-up": "translate-y-0 opacity-100",
  "fade-scale": "scale-100 opacity-100",
};

/**
 * Reusable scroll-reveal wrapper so every section shares one
 * IntersectionObserver-backed fade/translate treatment instead of
 * duplicating observer logic. See `useScrollReveal` for the hook itself
 * (used directly when the ref needs to land on an element this can't
 * safely wrap, e.g. a styled `<li>`).
 */
export function ScrollReveal({
  children,
  className,
  as = "div",
  delayMs = 0,
  variant = "fade-up",
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  const style: CSSProperties | undefined = delayMs ? { transitionDelay: `${delayMs}ms` } : undefined;

  return createElement(
    as,
    {
      ref,
      style,
      className: cn(
        "transition-[opacity,transform] duration-slow ease-standard",
        isVisible ? VISIBLE_CLASSES[variant] : HIDDEN_CLASSES[variant],
        className
      ),
    },
    children
  );
}
