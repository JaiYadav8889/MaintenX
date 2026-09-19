import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  ShieldAlert, 
  Gauge, 
  Cpu, 
  Wrench, 
  Database, 
  PlayCircle, 
  AlertTriangle,
  Menu,
  X,
  Radio,
  Clock,
  Layers,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface LayoutProps {
  children: React.ReactNode;
}

export function MaintenxLayout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Sync real-time clock in UTC and local ISO format
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString(undefined, { 
          month: "short", 
          day: "numeric", 
          year: "numeric" 
        }) + " " + now.toLocaleTimeString(undefined, { 
          hour12: false, 
          hour: "2-digit", 
          minute: "2-digit", 
          second: "2-digit" 
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const summaryQuery = trpc.fleet.getSummary.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const summary = summaryQuery.data;

  const navItems = [
    { href: "/", label: "Overview", icon: Gauge, exact: true },
    { href: "/fleet", label: "Fleet Monitoring", icon: Activity, badge: summary?.totalMachines },
    { href: "/insights", label: "Predictive Insights", icon: Cpu, badge: summary?.attentionRequired ? `${summary.attentionRequired} flagged` : undefined, badgeVariant: "warning" },
    { href: "/alerts", label: "Alert Center", icon: ShieldAlert, badge: summary?.activeAlerts, badgeVariant: "destructive" },
    { href: "/maintenance", label: "Maintenance", icon: Wrench, badge: summary?.pendingMaintenance },
    { href: "/datasets", label: "Data Center", icon: Database },
    { href: "/simulation", label: "Interactive Demo", icon: PlayCircle, highlight: true }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Industrial Banner / Status Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Tagline */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-9 h-9 rounded bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-xl tracking-tighter shadow-md shadow-amber-500/20 group-hover:bg-amber-400 transition-colors">
                  <span className="font-mono">M</span>
                  <span className="text-amber-950 text-sm font-black -ml-0.5">X</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                      Mainten<span className="text-amber-400 font-extrabold">X</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      v1.2-PREVIEW
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium hidden sm:block tracking-wide">
                    Detect Earlier. Act Before Failure.
                  </p>
                </div>
              </Link>
            </div>

            {/* Industrial Live Telemetry Heartbeat Status */}
            <div className="hidden lg:flex items-center space-x-6 text-xs text-slate-400 font-mono">
              <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded border border-slate-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-medium">TELEMETRY INGESTION: ACTIVE</span>
              </div>

              <div className="flex items-center space-x-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono-num">{currentTime || "UTC Synchronizing..."}</span>
              </div>

              <div className="text-[11px] text-slate-400 border-l border-slate-800 pl-4">
                Presented by: <span className="text-amber-300 font-medium">Jai Yadav</span>
              </div>
            </div>

            {/* Mobile menu trigger */}
            <div className="flex lg:hidden items-center space-x-2">
              <Link href="/simulation">
                <Button size="sm" variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                  <PlayCircle className="w-3.5 h-3.5 mr-1" /> Demo
                </Button>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Global Desktop Navigation Tabs */}
        <nav className="hidden lg:block bg-slate-950/90 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 py-1.5 overflow-x-auto scrollbar-none">
              {navItems.map((item) => {
                const isActive = item.exact 
                  ? location === item.href 
                  : location.startsWith(item.href) && (item.href !== "/" || location === "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm"
                        : item.highlight
                        ? "bg-slate-800/80 text-amber-400 hover:bg-slate-800 border border-amber-500/20"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : item.highlight ? "text-amber-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        item.badgeVariant === "destructive"
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : item.badgeVariant === "warning"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-slate-800 text-slate-300"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
            <div className="text-[11px] font-mono text-slate-400 px-2 py-1">
              Presented by: <span className="text-amber-300 font-semibold">Jai Yadav</span> • {currentTime}
            </div>
            {navItems.map((item) => {
              const isActive = item.exact ? location === item.href : location.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium ${
                    isActive
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Industrial Footer with Transparency Notice */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="font-bold text-slate-200">MaintenX</span>
            <span>—</span>
            <span>Predictive Maintenance Intelligence Layer</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              Ground Truth Datasets: <strong className="text-slate-200 font-semibold">AI4I 2020</strong> & <strong className="text-slate-200 font-semibold">Zenodo Motor Vibrations</strong>
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="text-slate-400">
              Transparent Multi-Signal Anomaly Scoring (No Black-Box Hallucinations)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
