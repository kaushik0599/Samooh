import type { Activity } from "@samooh/types";
import { ExternalLink } from "lucide-react";

function truncateHash(hash: string): string {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function ActivityTimeline({ items }: { items: Activity[] }) {
  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 border-b border-border pb-4 last:border-0">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-body-sm text-text-primary">{item.description}</p>
            <div className="mt-0.5 flex items-center gap-2 text-caption text-text-secondary">
              <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
              {item.transaction_hash && (
                <a
                  href={`https://amoy.polygonscan.com/tx/${item.transaction_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  {truncateHash(item.transaction_hash)}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
