import { cn } from "@/lib/utils";
import { InvoiceStatus } from "@/lib/storage";

export function StatusPill({ status, className }: { status: InvoiceStatus; className?: string }) {
  const styles = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        styles[status],
        className
      )}
    >
      {status}
    </span>
  );
}
