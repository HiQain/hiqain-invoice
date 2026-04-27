import { Link, useLocation } from "wouter";
import { Receipt, Plus, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background print:bg-white">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
        <div className="container flex h-14 items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-primary" />
              <span className="font-bold tracking-tight text-lg hidden sm:inline-block">
                Invoicer
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/"
                className={`transition-colors hover:text-foreground/80 ${
                  location === "/" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Dashboard</span>
                </span>
              </Link>
              <Link
                href="/settings"
                className={`transition-colors hover:text-foreground/80 ${
                  location === "/settings" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Settings</span>
                </span>
              </Link>
            </nav>
            <Button asChild size="sm" className="ml-auto">
              <Link href="/invoice/new">
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 print:p-0">
        {children}
      </main>
    </div>
  );
}
