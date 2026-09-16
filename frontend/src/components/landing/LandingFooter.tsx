import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#sarthi", label: "Sarthi" },
  { href: "#use-cases", label: "Use Cases" },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/" className="text-h4 font-bold tracking-[0.1em] text-text-primary">
            SAMOOH
          </Link>
          <p className="max-w-xs text-body-sm text-text-secondary">
            DAO infrastructure for real-world collective economic coordination.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="text-label tracking-widest text-text-secondary">PRODUCT</p>
          <ul className="mt-3 flex flex-col gap-2">
            {PRODUCT_LINKS.map((link) => (
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
        </nav>
      </div>

      <div className="border-t border-border/60 px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 text-caption text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} SAMOOH · Ek Samooh, Ek Soch</p>
          <p>Polygon Amoy · MVP</p>
        </div>
      </div>
    </footer>
  );
}
