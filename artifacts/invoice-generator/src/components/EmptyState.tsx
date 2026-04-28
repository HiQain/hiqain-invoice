import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-card shadow-sm h-[400px]">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">No estimates yet</h2>
        <p className="mt-2 text-center text-sm font-normal leading-6 text-muted-foreground">
          Start with a smart estimate, brand it with your logo, and convert it to an invoice when the job is approved.
        </p>
        <Button asChild className="mt-8">
          <Link href="/estimate/new">
            <Plus className="mr-2 h-4 w-4" />
            Create your first estimate
          </Link>
        </Button>
      </div>
    </div>
  );
}
