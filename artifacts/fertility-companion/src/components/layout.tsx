import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, BookOpen, RefreshCw, Sparkles, Menu, X,
  MessageCircle, BookHeart, TrendingUp, Thermometer, Grid3x3,
  GraduationCap, CheckSquare, Heart, Palette, MapPin, Award, Flower2, BookMarked, Gauge, Users, Mail, Archive, Cloud, Flag, CalendarClock, FlaskConical, BrainCircuit, GitCompare, Salad, Dumbbell, Brain, LayoutGrid,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mainNav = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/log", label: "Daily Log", icon: BookOpen },
  { path: "/cycle", label: "Cycle", icon: RefreshCw },
  { path: "/insights", label: "Insights", icon: Sparkles },
  { path: "/chat", label: "Companion", icon: MessageCircle },
  { path: "/journal", label: "Journal", icon: BookHeart },
];

const exploreNav = [
  { path: "/stats", label: "My Stats", icon: TrendingUp },
  { path: "/bbt", label: "BBT Chart", icon: Thermometer },
  { path: "/patterns", label: "Patterns", icon: Grid3x3 },
  { path: "/rituals", label: "Daily Rituals", icon: CheckSquare },
  { path: "/learn", label: "Learn", icon: GraduationCap },
  { path: "/partner", label: "Partner Mode", icon: Heart },
  { path: "/cycle-art", label: "Cycle Portrait", icon: Palette },
  { path: "/body-map", label: "Body Map", icon: MapPin },
  { path: "/report-card", label: "Report Cards", icon: Award },
  { path: "/fertile-window", label: "Fertile Window", icon: Flower2 },
  { path: "/symptom-diary", label: "Symptom Diary", icon: BookMarked },
  { path: "/probability", label: "Conception Estimate", icon: Gauge },
  { path: "/cycle-twin", label: "Cycle Twin", icon: Users },
  { path: "/cycle-letter", label: "Cycle Letter", icon: Mail },
  { path: "/time-capsule", label: "Time Capsule", icon: Archive },
  { path: "/mood-weather", label: "Mood Weather", icon: Cloud },
  { path: "/cycle-phases", label: "Phase Tracker", icon: Flag },
  { path: "/period-predictor", label: "Period Predictor", icon: CalendarClock },
  { path: "/hormone-hub", label: "Hormone Hub", icon: FlaskConical },
  { path: "/stress-sleep", label: "Stress & Sleep", icon: BrainCircuit },
  { path: "/cycle-comparison", label: "Cycle Comparison", icon: GitCompare },
  { path: "/nutrition-guide", label: "Nutrition Guide", icon: Salad },
  { path: "/movement-planner", label: "Movement Planner", icon: Dumbbell },
  { path: "/body-quiz", label: "Body Literacy Quiz", icon: Brain },
  { path: "/symptom-heatmap", label: "Symptom Heatmap", icon: LayoutGrid },
];

function NavLink({ item, active, onClick }: { item: { path: string; label: string; icon: React.ElementType }; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.path}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
      )}
      <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
      {item.label}
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNav = [...mainNav, ...exploreNav];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-5 py-4 bg-card border-b border-border"
        style={{ boxShadow: "var(--shadow-xs)" }}
      >
        <span
          className="text-xl text-foreground tracking-tight"
          style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
        >
          Fertility Companion
        </span>
        <button
          data-testid="button-mobile-menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 pb-5 pt-2 max-h-[80vh] overflow-y-auto">
          <p className="label-caps px-3 py-2">Main</p>
          {mainNav.map((item) => (
            <NavLink key={item.path} item={item} active={location === item.path} onClick={() => setMobileOpen(false)} />
          ))}
          <div className="my-2 mx-3 border-t border-border/60" />
          <p className="label-caps px-3 py-2">Explore</p>
          {exploreNav.map((item) => (
            <NavLink key={item.path} item={item} active={location === item.path} onClick={() => setMobileOpen(false)} />
          ))}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 min-h-screen border-r border-border bg-card px-5 py-8 overflow-y-auto"
        style={{ boxShadow: "var(--shadow-xs)" }}
      >
        {/* Brand */}
        <div className="mb-8 px-2">
          <span
            className="text-[2rem] text-foreground leading-none tracking-tight"
            style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
          >
            Fertility Companion
          </span>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Your personal cycle companion</p>
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-0.5">
          {mainNav.map((item) => (
            <NavLink key={item.path} item={item} active={location === item.path} />
          ))}
        </nav>

        {/* Explore section */}
        <div className="mt-5">
          <p className="label-caps px-3 mb-2">Explore</p>
          <nav className="flex flex-col gap-0.5">
            {exploreNav.map((item) => (
              <NavLink key={item.path} item={item} active={location === item.path} />
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="mt-auto px-2 pt-6 border-t border-border/60">
          <p
            className="text-[13px] text-muted-foreground leading-relaxed italic"
            style={{ fontFamily: "var(--app-font-serif)" }}
          >
            Every day of care is a gift to your future self.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-8 md:px-10 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
