import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, RefreshCw, Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/log", label: "Daily Log", icon: BookOpen },
  { path: "/cycle", label: "Cycle", icon: RefreshCw },
  { path: "/insights", label: "Insights", icon: Sparkles },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-border bg-card">
        <span className="font-serif text-xl text-foreground tracking-tight">Bloom</span>
        <button
          data-testid="button-mobile-menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`nav-mobile-${item.label.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen border-r border-border bg-card px-4 py-8">
        <div className="mb-8 px-3">
          <span className="font-serif text-2xl text-foreground tracking-tight">Bloom</span>
          <p className="text-xs text-muted-foreground mt-0.5">Your fertility companion</p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-primary/12 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon size={17} className={active ? "text-primary" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            You are doing beautifully. Every day of care matters.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-5 py-8 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
