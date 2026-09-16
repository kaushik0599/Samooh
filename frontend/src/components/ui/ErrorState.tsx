import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-error/20 bg-error/5 px-6 py-12 text-center">
      <AlertTriangle className="h-5 w-5 text-error" aria-hidden="true" />
      <div>
        <p className="text-body font-medium text-text-primary">{title}</p>
        <p className="mt-1 text-body-sm text-text-secondary">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
