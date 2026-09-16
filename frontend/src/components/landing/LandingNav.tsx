"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { isDemoMode } from "@/lib/demo/config";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#sarthi", label: "Sarthi" },
  { href: "#use-cases", label: "Use Cases" },
];

export function LandingNav() {
  const enterHref = isDemoMode() ? "/overview" : "/wallet";
  const [scrolled, setScrolled] = useState(false);

  // Subtle chrome: glassy over the hero, solidifies slightly once the page
  // scrolls past it — a plain passive scroll listener is enough here
  // (no need for a second IntersectionObserver instance).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-base ease-standard backdrop-blur-xl",
        scrolled
          ? "border-[color:var(--glass-border)] bg-background/80 shadow-md"
          : "border-transparent bg-background/40"
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-6"
      >
        <Link href="/" className="flex flex-col gap-0.5">
          <span className="text-h4 font-bold tracking-[0.17em] text-text-primary">SAMOOH</span>
          <span className="hidden text-[8px] font-semibold tracking-[0.14em] text-text-secondary sm:block">
            EK SAMOOH, EK SOCH
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-body-sm text-text-secondary transition-colors duration-fast hover:text-text-primary"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <Link href={enterHref} className={buttonVariants("primary", "md")}>
          Enter SAMOOH
        </Link>
      </nav>
    </header>
  );
}
